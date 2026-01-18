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

const getGameConfig = async (authToken) => {
    try {
        const data = await devapi.fetchGameConfig(authToken);
        
        if (data?.status && data?.data) {
            return data;
        }

        console.log("[WARN] No game config data available.");
        return { status: false, data: null, message: "No Data Available" };

    } catch (error) {
        console.error(`[ERROR] Error fetching game type data: ${error.message}`);
        throw new Error("Error loading game config. Please try again later.");
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
        const data = gameData?.data?.games ?? []
     
        return {status: true, data: data};
    } catch (error) {
        console.error(`[ERROR] Error fetching quiz questions: ${error.message}`);
        return getErrorHTML("Error loading quiz. Please try again later.");
    }
};
const getCustomQuizGame = async (authToken, gameType, filters) => {
    try {
        const gameData = await devapi.fetchGameData(authToken, gameType, filters);
        const data = gameData?.data?.games ?? []
     
        return {status: true, data: data};
    } catch (error) {
        console.error(`[ERROR] Error fetching quiz questions: ${error.message}`);
        return getErrorHTML("Error loading quiz. Please try again later.");
    }
};

const getCrosswordGame = async (authToken, gameType, filters) => {
    try {
        const gameData = await devapi.fetchGameData(authToken, gameType, filters);
        const data = gameData?.data?.clues ?? []
     
        return {status: true, data: data};
    } catch (error) {
        console.error(`[ERROR] Error fetching quiz questions: ${error.message}`);
        return getErrorHTML("Error loading quiz. Please try again later.");
    }
};
const getHeadlineScrambleGame = async (authToken, gameType, filters) => {
    try {

        const gameData = await devapi.fetchGameData(authToken, gameType, filters);
        const data = gameData?.data?.games ?? []

        return {status: true, data: data};
    } catch (error) {
        console.error(`[ERROR] Error fetching scramble game data: ${error.message}`);
        return getErrorHTML("Error loading scramble game. Please try again later.");
    }
};

const getHangmanGame = async (authToken, gameType, filters) => {
    try {
        const gameData = await devapi.fetchGameData(authToken, gameType, filters);
      
          const data = gameData?.data?.games ?? []
            return {status: true, data: data};
     
    } catch (error) {
        console.error(`[ERROR] Error fetching hangman game data: ${error.message}`);
        return getErrorHTML("Error loading Hangman. Please try again later.");
    }
};


const addUser = async (authToken, user) => {
  try {


   
        const apiResponse = await devapi.addUser(authToken, user);
        return apiResponse;
    } catch (error) {
        console.error(`[ERROR] Helper: Failed to add user: ${error}`);
        return {
            status: false,
            error: {
                errorCode: 500, 
                errorMsg: error.message || "An unexpected error occurred while trying to add user."
            }
        };
    }
};

const addContinueGames = async (authToken, continueGames, userId) => {
    if (!authToken || !continueGames || !userId) {
      console.error("[Service Error] Missing authToken or continueGames for adding continue games.");
      return {
        status: false,
        error: {
          errorCode: "HELPER_ERROR",
          errorMsg: "Missing authToken or continueGames or userId for adding continue games."
        }
      };
    }
    try {
        const apiResponse = await devapi.addContinueGames(authToken, continueGames, userId);
        return apiResponse;
    } catch (error) {
        console.error(`[ERROR] Helper: Failed to add continue games: ${error.message}`);
        return {
            status: false,
            error: {
                errorCode: "HELPER_ERROR",
                errorMsg: error.message || "An unexpected error occurred while trying to add continue games."
            }
        };
    }
};

const getContinueGames = async (authToken, userId) => {
    if (!authToken || !userId) {
      console.error("[Service Error] Missing authToken or userId for getting continue games.");
      return {
        status: false,
        error: {
          errorCode: "HELPER_ERROR",
          errorMsg: "Missing authToken or userId for getting continue games."
        }
      };
    }
    try {
        const apiResponse = await devapi.getContinueGames(authToken, userId);
        return apiResponse;
    } catch (error) {
        console.error(`[ERROR] Helper: Failed to get continue games: ${error.message}`);
        return {
            status: false,
            error: {
                errorCode: "HELPER_ERROR",
                errorMsg: error.message || "An unexpected error occurred while trying to get continue games."
            }
        };
    }
};

const deleteUser = async (authToken, userId) => {
    try {
        const apiResponse = await devapi.deleteUser(authToken, userId);
        return apiResponse;
    } catch (error) {
        console.error(`[ERROR] Helper: Failed to delete user: ${error.message}`);
        return {
            status: false,
            error: {
                errorCode: "HELPER_ERROR",
                errorMsg: error.message || "An unexpected error occurred while trying to delete user."
            }
        };
    }
};

const getArticleGamesForWidget = async (authToken, url) => {
    try {
        // This is a pass-through to the devapi helper.
        // We re-throw the error so the controller can handle Axios-specific errors.
        return await devapi.getArticleGamesForWidget(authToken, url);
    } catch (error) {
        console.error(
            `[ERROR] Helper: Failed to get article games for widget: ${error.message}`
        );
        throw error;
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
   getGameConfig,
    getGameTypeWidget,
    getQuizGame,
    getHeadlineScrambleGame,
    getHangmanGame,
    addUser,
    addContinueGames,
    getContinueGames,
    deleteUser,
    // getUiConfig,
    getCustomQuizGame,
    getCrosswordGame
};
