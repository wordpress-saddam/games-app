const gameHelper = require('../helpers/games-helper');

const getGameTypeHTML = async (req, res) => {
    try {
        const { authToken, hostname, query: { article_guid, game_id } } = req;

        console.log(`[INFO] Controller - getGameTypeHTML | authToken: ${authToken}, hostname: ${hostname}`);

        if (!authToken) return sendError(res, 401, "Unauthorized");

        const gameHTML = await gameHelper.getGameTypeHTML(authToken, hostname, article_guid, game_id);
        console.log("[INFO] Sending game HTML");

        return res.send(gameHTML);
    } catch (error) {
        console.error(`[ERROR] getGameTypeHTML failed: ${error.message}`);
        return sendError(res, 500, "Internal Server Error");
    }
};


const getGameTypeWidget = async (req, res) => {
    try {
        const { authToken, hostname, query: { article_guid, game_id } } = req;

        console.log(`[INFO] Controller - getGameTypeWidget | hostname: ${hostname}`);

        if (!authToken) return sendError(res, 401, "Unauthorized");

        const widget = await gameHelper.getGameTypeWidget(authToken, hostname, article_guid, game_id);
        res.header('Content-Type', 'application/javascript');

        return res.send(widget);
    } catch (error) {
        console.error(`[ERROR] getGameTypeWidget failed: ${error.message}`);
        return sendError(res, 500, "Internal Server Error");
    }
};

const getGames = async (req, res) => {
    try {
        const { authToken, query: { game_id, article_guid, article_url }, params: { code: gameType } } = req;

        console.log(`[INFO] Controller - getGames | Game Type: ${gameType}`);

        if (!authToken) return sendError(res, 401, "Unauthorized");

        const filters = { game_id, article_guid, article_url };
        let gameResponse;

        switch (gameType) {
            case "hangman":
                gameResponse = await gameHelper.getHangmanGame(authToken, gameType, filters);
                break;
            case "quiz":
                gameResponse = await gameHelper.getQuizGame(authToken, gameType, filters);
                break;
            case "headline_scramble":
                gameResponse = await gameHelper.getHeadlineScrambleGame(authToken, gameType, filters);
                break;
            default:
                return sendError(res, 400, "Unsupported Game Type");
        }

        return res.send(gameResponse);
    } catch (error) {
        console.error(`[ERROR] getGames failed: ${error.message}`);
        return sendError(res, 500, "Internal Server Error");
    }
};

const sendError = (res, statusCode, message) => {
    res.status(statusCode)
        .set("Content-Type", "text/html")
        .send(`
            <html>
            <head><title>${statusCode} - Error</title></head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h1 style="color: red;">${statusCode} - ${message.split(":")[0]}</h1>
                <p>${message}</p>
                <a href="/" style="color: blue;">Go Back Home</a>
            </body>
            </html>
        `);
};

module.exports = {
    getGameTypeHTML,
    getGameTypeWidget,
    getGames,
};
