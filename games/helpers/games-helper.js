const axios = require('axios');
const quizTemplate = require('../templates/quiz.js');
const headlineScrambleTemplate = require('../templates/headline_scramble2.js');
const hangmanTemplate = require('../templates/hangman.js');
const gameTypeTemplate = require('../templates/game-type.js');
const fs = require('fs');
const devapi = require('../utils/devapi-head');

function getArticleIds(gamesData) {
    if (!Array.isArray(gamesData)) {
        throw new TypeError("gamesData must be an array.");
    }

    if (gamesData.length === 0) {
        return "";
    }

    const articleIds = [];
    for (const game of gamesData) {
        if (typeof game !== 'object' || game === null) {
            throw new TypeError("Each element in gamesData must be an object.");
        }
        if (game.hasOwnProperty('article_id')) {
            articleIds.push(game.article_id);
        }
    }

    return articleIds.join(",");
}
function createArticleGuidMap(articleData) {
    if (!Array.isArray(articleData)) {
        throw new TypeError("articleData must be an array.");
    }

    const articleMap = {};
    for (const article of articleData) {
        if (typeof article !== 'object' || article === null) {
            throw new TypeError("Each element in articleData must be an object.");
        }
        if (article.hasOwnProperty('guid')) {
            articleMap[article.guid] = {
                id: article.article_id,
                url: article.url,
                title: article.t, // Corrected this line
                entities: article.entities,
                guid: article.guid
            };
        }
    }
    return articleMap;
}

const getGameTypeHTML = async (authToken, hostname, article_guid, game_id) => {
    try {
        const data = await devapi.fetchGameConfig(authToken)
        if (data?.status && data?.data) {
            return await gameTypeTemplate.getGameTypeHTML(data.data, hostname, article_guid, game_id);
        }
        return getErrorHTML("Games not available.");
    } catch (error) {
        console.error(`[ERROR] Error fetching game type data: ${error.message}`);
        return getErrorHTML("Error loading game type. Please try again later.");
    }
};

const getGameTypeWidget = async (authToken, hostname, article_guid, game_id) => {
    try {
        const data = await devapi.fetchGameConfig(authToken)
        if (data?.status && data?.data) {
            return await gameTypeTemplate.getGameTypeWidget(data.data, hostname, article_guid, game_id);
        }

        return getErrorHTML("Games not available.");
    } catch (error) {
        console.error(`[ERROR] Error generating widget script: ${error.message}`);
        return getErrorHTML("Error loading widget. Please try again later.");
    }
};

const getQuizGame = async (authToken, gameType, filters) => {
    try {
        const gameData = await devapi.fetchGameData(authToken, gameType, filters);

        if (!gameData?.status || !gameData?.data?.games?.length) {
            console.log(`[WARNING] No game data found for type: ${gameType}`);
            return getErrorHTML("No questions available! Please try again later.");
        }
        const data = gameData?.data ?? {};

        const articleIds = await getArticleIds(data.games || [])
        const articleData = await devapi.fetchArticleData(authToken, articleIds)

        const articleGuidMap = await createArticleGuidMap(articleData?.data?.articles);

        return await quizTemplate.getQuizGame(data, articleGuidMap);
    } catch (error) {
        console.error(`[ERROR] Error fetching quiz questions: ${error.message}`);
        return getErrorHTML("Error loading quiz. Please try again later.");
    }
};

const getHeadlineScrambleGame = async (authToken, gameType, filters) => {
    try {
        const gameData = await devapi.fetchGameData(authToken, gameType, filters);
        if (!gameData?.status || !gameData?.data?.games?.length) {
            console.log(`[WARNING] No game data found for type: ${gameType}`);
            return getErrorHTML("No data available! Please try again later.");
        }

        if (!gameData?.data?.games?.[0]?.data) {
            console.log(`[WARNING] Game found but no data available for type: ${gameType}`);
            return getErrorHTML("No data available! Please try again later.");
        }
        const data = gameData?.data?.games ?? []


        console.log("data",data)
        const articleIds = await getArticleIds(data || [])
        const articleData = await devapi.fetchArticleData(authToken, articleIds)

        const articleGuidMap = await createArticleGuidMap(articleData?.data?.articles);


      
        return await headlineScrambleTemplate.getHeadlineScrambleGame(data, articleGuidMap);
    } catch (error) {
        console.error(`[ERROR] Error fetching scramble game data: ${error.message}`);
        return getErrorHTML("Error loading scramble game. Please try again later.");
    }
};

const getHangmanGame = async (authToken, gameType, filters) => {
    try {
        const gameData = await devapi.fetchGameData(authToken, gameType, filters);
        if (!gameData?.status || !gameData?.data?.games?.length) {
            console.log(`[WARNING] No game data found for type: ${gameType}`);
            return getErrorHTML("No data available! Please try again later.");
        }


        if (!gameData?.data?.games?.[0]?.data) {
            console.log(`[WARNING] Game found but no data available for type: ${gameType}`);
            return getErrorHTML("No data available! Please try again later.");
        }
        const data = gameData?.data ?? {};

        const articleIds = await getArticleIds(data.games || [])
        const articleData = await devapi.fetchArticleData(authToken, articleIds)

        const articleGuidMap = await createArticleGuidMap(articleData?.data?.articles);

        // fs.writeFileSync("hangmanData-articleGuidMap.json", JSON.stringify(articleGuidMap, null, 2));
        return await hangmanTemplate.getHangmanGame(data, articleGuidMap);
    } catch (error) {
        console.error(`[ERROR] Error fetching hangman game data: ${error.message}`);
        return getErrorHTML("Error loading Hangman. Please try again later.");
    }
};

/**
 * Returns a standardized error HTML message.
 * @param {string} message - The error message to display.
 * @returns {string} - HTML formatted error message.
 */
const getErrorHTML = (message) => {
    return `
        <html>
        <head>
            <title>Error</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f8f8f8; }
                .error-container { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); display: inline-block; }
                h1 { color: red; }
                p { color: #333; }
                a { color: blue; text-decoration: none; font-weight: bold; }
                a:hover { text-decoration: underline; }
            </style>
        </head>
        <body>
            <div class="error-container">
                <h1>Error</h1>
                <p>${message}</p>
                <a href="/">Go Back Home</a>
            </div>
        </body>
        </html>
    `;
};

module.exports = {
    getGameTypeHTML,
    getGameTypeWidget,
    getQuizGame,
    getHeadlineScrambleGame,
    getHangmanGame,
};
