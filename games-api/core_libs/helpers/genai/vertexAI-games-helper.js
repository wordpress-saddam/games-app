const gameTypeConfig = require('./game-type-config');
const vertexAIHelper = require('../../services/vertexAI/vertex-ai-helper');
const fs = require('fs');


const buildPromptAndSchema = async (gameTypes, content, headline, language = 'english') => {

    const combinedPrompt = [];
    const combinedSchema = {
        type: "object",
        properties: {
            message: { type: "string" },
            score: {
                "type": "number",
                "minimum": 0,
                "maximum": 100
            },
            status: { type: "boolean" },
            sentiment: {
                type: "string",
                enum: ["positive", "neutral", "negative"]
            },

        },
        required: ["score", "status", "message", "sentiment"],
        additionalProperties: false
    };

    if (typeof gameTypeConfig !== "object" || gameTypeConfig === null) {
        console.log("[ERROR] : Invalid game type configuration.");
        return { prompt: "", schema: {} };
    }

    gameTypes.forEach((type, index) => {
        const config = gameTypeConfig[type];
        if (!config) {
            console.log(`[ERROR] : Unsupported game type: ${type}`);
            return;
        }
        const { prompt, schema } = config;
        combinedPrompt.push(`Game ${index + 1}. ${prompt(language)}`);
        combinedSchema.properties[type] = schema;
        if (!combinedSchema.required.includes(type)) {
            combinedSchema.required.push(type);
        }
    });

    if (combinedPrompt.length === 0) {
        console.log("[ERROR] : No valid game types found.");
        return { prompt: "", schema: {} };
    }

    const finalPrompt = `
Follow the below tasks on the news article content provided in the end. Ensure all generated text content (like questions, clues, etc.) is in the **${language}** language.
Task 1 - Sentiment Analysis 
Rules : 
-If banned keywords like death, dead, killed, murder, casualty, bodies, corpse, terror, attack, violence, explosion, tragedy, massacre, victims, shooting, blast, assassination, grief, last rites, funeral, mourning, conflict, war, riot, disaster, injured, survivor, gunmen, militant, hostage etc. or relative words or phrases of negative sentiment appear even once in the headline or body, immediately block and return:
 {"status": false, "error": "Blocked due to sensitive or violent subject matter. Article rejected at pre-processing stage.", "score": 0,"sentiment": "negative"}
 (e.g., article: “Explosion kills 20 in marketplace” → blocked).
-If the article passes that check, perform sentiment filtering by extracting only neutral or positive content. If the sentiment score is below 60, terminate and return:
 {"status": false, "error": "Insufficient positive sentiment for gamification.", "score": <score>,"sentiment": "negative"}
 (e.g., “Job losses hit small towns hard” → score: 45 → rejected).
-If the sentiment is acceptable, check if at least 40% of the article is neutral content. If not, or if it implies trauma or unrest (even subtly), return:
 {"error": "Thematic content unsuitable for game transformation due to emotional or ethical sensitivity.","score": <score>,"sentiment": "<calculated sentiment>"}
 (e.g., “Actor donates to flood victims” → rejected due to lingering trauma theme).
-Only if the article is clean, upbeat or neutral, and safe for gameplay, return success like:
 {"status": true, "message": "Content suitable for gamification.","score": <score>,"sentiment": "<calculated sentiment>"}
 (e.g., “Student builds solar car” → accepted with score 92).
 Tell the reason of score and sentiment assigned in the message field.
 Only proceed to Task 2 if the sentiment is positive only thus making the content suitable for gamification.\n`
        + combinedPrompt.join("\n") +
        `\n News Article Content:
{
    "headline": "${headline}",
    "body": "${content}"
}`
    //console.log(finalPrompt);
    return { prompt: finalPrompt, schema: combinedSchema };
};

const generateGamesFromVertexAI = async (prompt, schema) => {
    try {
        // await fs.writeFileSync('Request-vertexai.json', JSON.stringify({ schema: schema, contents: [{ role: 'user', parts: [{ text: prompt }] }], }, null, 2));
        const generativeModel = vertexAIHelper.getGenerativeModel({
            model: 'gemini-2.0-flash-lite',
            generationConfig: {
                max_output_tokens: 8192,
                temperature: 0.2,
                top_p: 0.6,
                responseMimeType: 'application/json',
                responseSchema: schema,
            },
            safetySettings: [
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
                { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_ONLY_HIGH' }
            ],
        });

        const req = {
            contents: [
                {
                    role: "user",
                    parts: [{ text: prompt }],
                },
            ],
        };

        const response = await generativeModel.generateContent(req);
        // await fs.writeFileSync('Response-vertexai.json', JSON.stringify(response, null, 2));
        if (response?.response?.candidates[0]?.finishReason !== 'STOP') {
            console.log("Game generation failed: Response not successful.");
            return { status: false, message: "Failed to generate games: Response incomplete." };
        }
        const rawResponse = response.response.candidates[0].content?.parts[0]?.text || "{}";
        return JSON.parse(rawResponse);

    } catch (error) {
        console.log("Error in generateGamesFromVertexAI:", error.message);
        return { status: false, message: "Error during game generation with Vertex AI." };
    }
};

const generateGames = async (data) => {
    console.log("Generating games using Vetex AI...");

    try {
        const { content, headline, game_types,language } = data;
        if (!Array.isArray(game_types) || game_types.length === 0) {
            console.log("Invalid game types array.");
            return { status: false, message: "game_types must be a non-empty array." };
        }
        const { prompt, schema } = await buildPromptAndSchema(game_types, content, headline, language);

        if (!prompt || Object.keys(schema).length === 0) {
            console.log("Invalid prompt or schema.");
            return { status: false, message: "Umsupported game types" };
        }
        //console.log("[prompt] ", prompt);
        //console.log("[schema] ", schema);
        const response = await generateGamesFromVertexAI(prompt, schema);
        //console.log("[response score] ", response?.score);
        //console.log("[response sentiment] ", response?.sentiment);
        //console.log("[response message] ", response?.message);
        if (!response || !response.score || response.score < 60 || response.sentiment !== "positive") {
            console.log("[FAILED] Game generation failed:", response.message);
            return { status: false, message: "Article has a negative sentiment." };
        }

        if (!response) {
            console.log("[ERROR] Game generation error:", response);
            return { status: false, message: "Error during game generation." };
        }

        return response;

    } catch (err) {
        console.log("Error in generateGames:", err.message);
        return { status: false, message: "An error occurred while generating games." };
    }
};

module.exports = {
    generateGames,
};
