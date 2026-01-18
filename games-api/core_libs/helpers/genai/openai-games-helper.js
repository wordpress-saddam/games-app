const openAI = require('../../services/openai/open-ai-helper');
const gameTypeConfig = require("./game-type-config");

const getGamesV2 = async (prompt, schema) => {
    try {
        // fs.writeFileSync('Request-openai.json', JSON.stringify({
        //     messages: [{ role: "user", content: prompt }],
        //     model: "gpt-4o",
        //     response_format: {
        //         type: "json_schema",
        //         json_schema: {
        //             name: "CombinedGamesSchema",
        //             strict: true,
        //             schema,
        //         },
        //     },
        // }, null, 2));


        const response = await openAI.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-4o",
            response_format: {
                type: "json_schema",
                json_schema: {
                    name: "CombinedGamesSchema",
                    strict: true,
                    schema,
                },
            },
        });
        if (response?.choices?.[0]?.message?.content) {
            return JSON.parse(response.choices[0].message.content || "{}");
        } else {
            console.log("OpenAI response missing expected content.");
            return { status: false, message: "OpenAI response content is missing." };
        }

    } catch (err) {
        console.log("Error in getGames:", err.message);
        console.log(err.stack);
        return { status: false, message: "Failed to fetch games from OpenAI." };
    }
};

const combinePromptsAndSchemas = (content, headline, gameTypes) => {

    const combinedPrompt = [];
    const combinedSchema = {
        type: "object",
        properties: { score: { type: "number" }, status: { type: "boolean" } , message: { type: "string" } },
        required: ["score", "status", "message"],
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
        combinedPrompt.push(`${index + 1}. ${prompt()}`);
        combinedSchema.properties[type] = schema;

        if (!combinedSchema.required.includes(type)) {
            combinedSchema.required.push(type);
        }
    });

    if (combinedPrompt.length === 0) {
        console.log("[ERROR] : No valid game types found.");
        return { prompt: "", schema: {} };
    }

    const finalPrompt =
        `1. **Sentiment Analysis**:\n` +
        `\t- Analyze the sentiment of the below provided headline and content.\n` +
        `\t- Assign a sentiment score ranging from 1 to 100 (1 being highly negative and 100 being highly positive).\n` +
        `\t- If the score is **greater than or equal to 35**, proceed with the subsequent tasks. Otherwise, return:\n` +
        `\t  \`{ "status": false, "message": "The sentiment score is below the required threshold.", "score": Number }\`\n\n` +
        combinedPrompt.join("\n") +
        `\n\n**Headline**: ${headline}\n**Content**: ${content}\n\n` +
        `If the sentiment is not positive, do not generate any games and return:\n` +
        `\`{ "status": false, "message": "The sentiment of the headline is not positive.","score": Number }\``;

    return { prompt: finalPrompt, schema: combinedSchema };
};

const generateGames = async (data) => {
    const { content, headline, game_types } = data;
    try {
        console.log("Generating games using OPENAI...");
        const { prompt, schema } = combinePromptsAndSchemas(content, headline, game_types);


        if (!prompt || Object.keys(schema).length === 0) {
            console.log("Invalid prompt or schema.");
            return { status: false, message: "Umsupported game types" };
        }

        const response = await getGamesV2(prompt, schema);
        // fs.writeFileSync('Response-openai.json', JSON.stringify(response, null, 2));

        if (!response || !response.score || response.score < 80) {
            console.log("Game generation failed:", response.message);
            return { status: false, message: "Article has a negative sentiment." };
        }

        return response;

    } catch (err) {
        console.log("Error in generateGames:", err.message);
        return { status: false, message: "An error occurred while generating games." };
    }
};

module.exports = {
    generateGames
};
