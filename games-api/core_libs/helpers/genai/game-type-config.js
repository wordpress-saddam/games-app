const gameTypeConfig = {
    headline_scramble: {
        prompt: (language = 'english') => `Split the headline of given article into **a minimum of 3 and a maximum of 7 meaningful, non-empty parts** while preserving the **semantic structure** — no grammatical butchering, no entity-breaking. The output must be in **${language}**.
    Rules:
- Parts must be non-empty
- Do not repeat any segment/part
-Each part must be unique
- Do not invent or remove any words
- Do not split named entities or common expressions (e.g. United Nations, climate change)
- Keep original word order and punctuation as-is

If the headline is too short to split into 4 valid parts, return:
{
  "error": "Headline too short to split into even 4 parts."
}
  
Bad example:
["Mirwaiz Umar castigates", "J&K government,", "", ";"] // empty part, no meaning

Bad example :
["TAAK discusses","tourism promotion","with officials","with officials"] // repeated part
 Can be broken down into:
["TAAK discusses","tourism promotion","with","officials"] // repeated part
 
Bad example:
Original Headline :"A Morning Tryst with Nature"
[ "A Morning","Tryst with","Nature","with Nature"] // "with Nature" is a repeated part and extra in the headline, unable to form the same headline by combining the parts.

Good example:
Input: "NASA confirms water on moon's surface during daytime"

Output:
{
  "headline": "NASA confirms water on moon's surface during daytime",
  "randomized": [
    "NASA confirms",
    "water on",
    "moon's surface",
    "during daytime"
  ] // 4 parts
}
If the headline is too short to split into 4 valid parts, return:
{
  "error": "Headline too short to split into even 4 parts."
}
`,
        schema: {
            type: "object",
            properties: {
                headline: { type: "string" },
                randomized: {
                    type: "array",
                    items: {
                        type: "string",
                        minLength: 1,
                        pattern: ".*\\S.*",
                    },
                    "minItems": 3,
                    "maxItems": 7,
                    
                },
                status: { type: "boolean" },
                message: { type: "string" },
                error: { type: "string" },
            },
            required: ["status", "message"],
            additionalProperties: false,
        },
    },
    quiz: {
        prompt: () => `Generate 5 high-quality multiple-choice questions (MCQs) based on the given article.

Purpose:
- Teach users something useful or interesting
- Spark curiosity about the topic
- Encourage readers to explore or revisit the article
- Users should feel smarter or more informed after playing

Rules for Questions:
-Eache question must be written in a way that user has never read the article before, so no questions like "What is the article about?" or "What is the main point of the article?" or "According to the article, what is...?" or "In this article, it is mentioned that...?" or "The article discusses..." etc.
- Each question must be inspired by the article’s content and contain a subtle hint pointing back to it — not a quote, but a recognizable idea or context, this ensures the quiz connects with the source while remaining self-contained..
- Keep questions self-contained — no context from the article required
-Frame the questions in a way that they can be answered based on the options provided, without needing to read the article.
- Avoid trivia, obscure facts, or technical jargon
- Questions should be based on general knowledge, real-world logic, or broad insights
-Each question and its options must be meaningful, contextually relevant, and designed to add informational or conceptual value to the user — not just filler or obvious facts.
- Present questions in the same order as the article’s structure (if applicable)
- No duplicate questions or repeated options
- Each answer must be one of the given options (a/b/c/d), using the **full text** of the correct option
- Do not invent facts — only use what's actually in the article

Output Format (per question):
{
  "question": "A clear question under 150 characters",
  "a": "Option 1",
  "b": "Option 2",
  "c": "Option 3",
  "d": "Option 4",
  "answer": "The correct answer must be from one of the options (a, b, c, or d)"
}

Also generate:
{
  "title": "A short, catchy title that reflects the article’s topic and encourages curiosity"
}

End Goal:
The quiz should be informative and fun on its own, while gently pushing users to explore the article further.
`,
        schema: {
            type: "object",
            properties: {
                data: {
                    type: "object",
                    properties: {
                        title: {
                            type: "string",
                            minLength: 5,
                            maxLength: 100,
                            pattern: "^[A-Z0-9a-z ,\\-:!?'\"()]+$" // safe readable title
                        },
                        questions: {
                            type: "array",
                            minItems: 5,
                            maxItems: 5,
                            items: {
                                type: "object",
                                properties: {
                                    question: {
                                        type: "string",
                                        minLength: 10,
                                        maxLength: 150,
                                        pattern: "^[A-Z0-9a-z ,\\-:!?'\"()]+$"
                                    },
                                    a: {
                                        type: "string",
                                        minLength: 1,
                                        maxLength: 100
                                    },
                                    b: {
                                        type: "string",
                                        minLength: 1,
                                        maxLength: 100
                                    },
                                    c: {
                                        type: "string",
                                        minLength: 1,
                                        maxLength: 100
                                    },
                                    d: {
                                        type: "string",
                                        minLength: 1,
                                        maxLength: 100
                                    },
                                    answer: {
                                        type: "string",
                                        enum: ["a", "b", "c", "d"]
                                    }
                                },
                                required: ["question", "a", "b", "c", "d", "answer"],
                                additionalProperties: false
                            }
                        }
                    },
                    required: ["questions", "title"],
                    additionalProperties: false
                },
                status: {
                    type: "boolean"
                },
                message: {
                    type: "string"
                },
                error: {
                    type: "string"
                },
            },
            required: ["status", "message"],
            additionalProperties: false
        }

    },
    poll: {
        prompt: (headline, content) => `
        - Extract meaningful content from the web-scraped data (ignore ads, site info, and unrelated text).  
        - Perform sentiment analysis:  
            - If the score is below 80 → Return an empty poll array with "Sentiment score below threshold" message.  
            - If the score is 80 or higher → Create 1 poll with:  
                - 'Poll': Question as a string  
                - 'a', 'b', 'c', 'd': Options as strings  
                - Shuffle options randomly  
        - If meaningful content is less than 30% of input → Return an empty poll array with "Insufficient meaningful content" message.  
        - If content contains excessive negative sentiment → Return an empty poll array with "Content contains excessive negative sentiment" message.  
        - On errors → Return an empty poll array with error details.  
        - Poll should be:  
            - Clear, unbiased, and non-ambiguous  
            - Options should be distinct and not misleading  
            - Language of poll and options should match input content  
        `,
        schema: {
            type: "object",
            properties: {
                data: {
                    type: "object",
                    properties: {
                        polls: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    Poll: { type: "string" },
                                    a: { type: "string" },
                                    b: { type: "string" },
                                    c: { type: "string" },
                                    d: { type: "string" },
                                },
                                required: ["Poll", "a", "b", "c", "d"],
                                additionalProperties: false,
                            },
                        },
                    },
                    required: ["polls"],
                    additionalProperties: false,
                },
                status: { type: "boolean" },
                message: { type: "string" },
                error: { type: "string" },
                score: { type: "number" },
            },
            required: ["data", "status", "score", "message", "error"],
            additionalProperties: false,
        },
    },
    crossword: {
        prompt: (language = 'english') => `Generate 10 high-quality keywords and clues for a crossword game based on the provided news article. All generated content must be in the **${language}** language.

**Primary Goal:** Create engaging and solvable clues that are directly inspired by the article's main topics, entities, and concepts.

**Word Rules:**
- Words must be between **4 and 10 characters** long.
- Words must be single words with no spaces or special characters.
- Select words that are significant to the article (e.g., key people, places, events, or concepts). Avoid generic or trivial words.

**Clue Rules:**
- Clues must be self-contained and understandable **without reading the article**.
- Frame clues as definitions, fill-in-the-blanks, or interesting facts that logically lead to the word.
- **Crucially, do not** reference the article directly (e.g., "According to the article...", "This article discusses...").
- Clues should be clear, concise, and unambiguous.

---
**Good Example (from an article about a space mission):**
word: galaxy
clue: A vast system of stars, gas, and dust held together by gravity.

**Bad Example (references the article):**
word: mission
clue: The article describes this as a success for the space agency.
---
`,
        schema: {
            type: "object",
            properties: {
                data: {
                    type: "object",
                    properties: {
                        clues: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    word: { type: "string" },
                                    clue: { type: "string" },
                                },
                                required: ["word", "clue"],
                                additionalProperties: false,
                            },
                        },
                    },
                    required: ["clues"],
                    additionalProperties: false, 
                },
                status: { type: "boolean" },
                message: { type: "string" },
                error: { type: "string" },
                score: { type: "number" },
            },
            required: ["data", "status", "score", "message", "error"],
            additionalProperties: false,
        },
    },
    hangman: {
        prompt: (language = 'english') => `Generate one smart, meaningful word and a corresponding clue from the provided news article. Both the word and the clue must be in the **${language}** language.

**Primary Goal:** The word and clue should form a fun, self-contained puzzle that educates the user or sparks their curiosity about the article's topic.

Word rules:
-Must be a real word in the specified language
-The word must be a **central concept, key entity, or significant term** from the article. Avoid generic or filler words.
-Use only lowercase letters
-No spaces or punctuation
-Length must be between **7 and 10 characters**.

Clue rules:
-The clue must be self-contained and understandable **without reading the article**.
-Frame the clue as a mini-fact, a definition, a fill-in-the-blank, or a thought-provoking question that logically leads to the word.
-**Crucially, do not** reference the article directly (e.g., "In the article...", "According to the text...").

---
**Examples:**

**Bad example 1 (Vague Clue):**
word: ecosystem
clue: This is part of nature

**Bad example 2 (Direct Reference):**
word: tourism
clue: This is what the Travel Agents Association of Kashmir aims to boost.

**Bad example 3 (Filler Word):**
word: farmer
clue: A person who cultivates land. (Too generic, not specific to the article's unique story)

**Good example (from an article about coral bleaching):**
word: coral
clue: This colorful reef builder is struggling with ocean heat
---
`,
        schema: {
            type: "object",
            properties: {
                data: {
                    type: "object",
                    properties: {
                        word: {
                            type: "string",
                            pattern: "^[a-z]{7,10}$",
                        },
                        clue: {
                            type: "string",
                            minLength: 10,
                            maxLength: 200,
                        },
                    },
                    required: ["word", "clue"],
                    additionalProperties: false,
                },
                status: { type: "boolean" },
                message: { type: "string" },
                error: { type: "string" },
            },
            required: ["status", "message"],
            additionalProperties: false,
        }

    },
};

module.exports = gameTypeConfig;
