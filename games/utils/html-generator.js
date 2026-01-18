const quizTemplate = require('../templates/quiz.js');
const headlineScrambleTemplate = require('../templates/headline_scramble2.js');
const hangmanTemplate = require('../templates/hangman.js');
const gameTypeTemplate = require('../templates/game-type.js');

const getGameTypeHTML = async (gameConfig, hostname, article_guid, game_id) => {
    return await gameTypeTemplate.getGameTypeHTML(gameConfig, hostname, article_guid, game_id);
};

const getGameTypeWidget = async (gameConfig, hostname, article_guid, game_id) => {
    return await gameTypeTemplate.getGameTypeWidget(gameConfig, hostname, article_guid, game_id);
};

const getQuizGameHTML = async (quizData) => {
    return await quizTemplate.getQuizGame(quizData);
};

const getHeadlineScrambleGameHTML = async (headlineData) => {
    return await headlineScrambleTemplate.getHeadlineScrambleGame(headlineData);
};

const getHangmanGameHTML = async (hangmanData) => {
    return await hangmanTemplate.getHangmanGame(hangmanData);
};

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
    getQuizGameHTML,
    getHeadlineScrambleGameHTML,
    getHangmanGameHTML,
    getErrorHTML,
};
