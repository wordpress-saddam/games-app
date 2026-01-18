const v2gameHelper = require("../v2-helpers/games-helper");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const config = require("../config/config");
const widgetHelper = require("../v2-helpers/widget-helper");

const getGameConfig = async (req, res) => {
  try {
    const {
      authToken,
      hostname,
      query: { article_guid, game_id },
    } = req;

    if (!authToken) return sendError(res, 401, "Unauthorized");

    const gameConfig = await v2gameHelper.getGameConfig(
      authToken,
      hostname,
      article_guid,
      game_id
    );

    return res.send(gameConfig);
  } catch (error) {
    console.error(`[ERROR] getGameTypeHTML failed: ${error.message}`);
    return sendError(res, 500, "Internal Server Error");
  }
};

const getGameTypeWidget = async (req, res) => {
  try {
    const {
      authToken,
      hostname,
      query: { article_guid, game_id },
    } = req;

    console.log(
      `[INFO] Controller - getGameTypeWidget | hostname: ${hostname}`
    );

    if (!authToken) return sendError(res, 401, "Unauthorized");

    const widget = await v2gameHelper.getGameTypeWidget(
      authToken,
      hostname,
      article_guid,
      game_id
    );
    res.header("Content-Type", "application/javascript");

    return res.send(widget);
  } catch (error) {
    console.error(`[ERROR] getGameTypeWidget failed: ${errador.message}`);
    return sendError(res, 500, "Internal Server Error");
  }
};

const getGames = async (req, res) => {
  try {
    const {
      authToken,
      query: { game_id, article_guid, article_url },
      params: { code: gameType },
    } = req;

    console.log(`[INFO] Controller - getGames | Game Type: ${gameType}`);

    if (!authToken) return sendError(res, 401, "Unauthorized");

    const filters = { game_id, article_guid, article_url };
    let gameResponse;

    switch (gameType) {
      case "hangman":
        gameResponse = await v2gameHelper.getHangmanGame(
          authToken,
          gameType,
          filters
        );
        break;
      case "quiz":
        gameResponse = await v2gameHelper.getQuizGame(
          authToken,
          gameType,
          filters
        );
        break;
      case "headline_scramble":
        gameResponse = await v2gameHelper.getHeadlineScrambleGame(
          authToken,
          gameType,
          filters
        );
        break;
      case "custom_quiz":
        gameResponse = await v2gameHelper.getCustomQuizGame(
          authToken,
          gameType,
          filters
        );
        break;
        case "crossword":
        gameResponse = await v2gameHelper.getCustomQuizGame(
          authToken,
          gameType,
          filters
        );
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

const generateUserToken = (userDetails) => {
  const jwtSecret = config.jwt?.secret || "YOUR_DEFAULT_SECRET"; // Replace 'YOUR_DEFAULT_SECRET' with a strong fallback or ensure config is loaded
  if (jwtSecret === "YOUR_DEFAULT_SECRET") {
    console.log("JWT_SECRET not found in config. Using a default secret. ");
  }
  return jwt.sign(userDetails, jwtSecret, { expiresIn: "7d" });
};

const sendJsonError = (res, statusCode, errorCode, message) => {
  res.status(statusCode).json({
    status: false,
    error: {
      errorCode: errorCode || statusCode,
      errorMsg: message,
    },
  });
};

const addUser = async (req, res) => {
  try {
    const { authToken } = req;
    const { username, country, region } = req.body;



    if (!username) {
      return sendJsonError(res, 400, 401, "Username is required");
    }

    const user_id = uuidv4();

    const userDetails = {
      ...req.body,
      id: user_id,
    };


    const apiResponse = await v2gameHelper.addUser(authToken, userDetails);
    console.log("controller", apiResponse)
    if (apiResponse && apiResponse.status === true) {
      const tokenUserDetails = {
        id: userDetails.id,
        username: userDetails.username,
      };
      const userJwtToken = generateUserToken(tokenUserDetails);
      return res.status(200).json({
        status: true,
        token: userJwtToken,
        user_id: userDetails.id,
        user_name: userDetails.username,
        message: apiResponse.data?.message || "User registered successfully.",
      });
    } else {
      const errorDetails = apiResponse?.error || {};
      const apiErrorCode = errorDetails.errorCode;
      const apiErrorMsg =
        typeof errorDetails.message === "string"
          ? errorDetails.message
          : "Failed to add user due to an unknown API error.";

      console.error(
        `[ERROR] Failed to add user: ${apiErrorMsg} (Code: ${apiErrorCode})`
      );

      if (apiErrorCode === 409 || apiErrorCode === "409") {
        console.log("User already exists");
        return sendJsonError(
          res,
          409,
          apiErrorCode,
          apiErrorMsg ||
          "Username already exists. Please choose a different username."
        );
      } else if (
        apiErrorCode === 401 ||
        apiErrorCode === "401" ||
        apiErrorCode === 400 ||
        apiErrorCode === "400"
      ) {
        return sendJsonError(res, 400, apiErrorCode, apiErrorMsg);
      } else {
        return sendJsonError(
          res,
          500,
          apiErrorCode || "API_ERROR",
          apiErrorMsg
        );
      }
    }
  } catch (error) {
    console.error(`[ERROR] Controller addUser unexpected error: ${error}`);
    return sendJsonError(
      res,
      500,
      "CONTROLLER_EXCEPTION",
      "Internal Server Error"
    );
  }
};

const deleteUser = async (req, res) => {
  try {
    const { authToken } = req;
    const { user_id } = req.body;

    if (!user_id) {
      return sendJsonError(res, 400, 401, "user_id is required.");
    }

    const apiResponse = await v2gameHelper.deleteUser(authToken, user_id);

    if (apiResponse && apiResponse.status === true) {
      return res.status(200).json({
        status: true,
        data: apiResponse.data || {
          message: "User status updated to false (deactivated).",
        },
      });
    } else {
      const errorDetails = apiResponse?.error || {};
      const apiErrorCode = errorDetails.errorCode;
      const apiErrorMsg =
        typeof errorDetails.message === "string"
          ? errorDetails.message
          : "Failed to delete user due to an unknown API error.";

      if (apiErrorCode === 404 || apiErrorCode === "404") {
        return sendJsonError(res, 404, apiErrorCode, apiErrorMsg);
      } else if (
        String(apiErrorCode).startsWith("4") ||
        apiErrorMsg === "user_id is required."
      ) {
        return sendJsonError(
          res,
          400,
          apiErrorCode || "BAD_REQUEST",
          apiErrorMsg
        );
      } else {
        return sendJsonError(
          res,
          500,
          apiErrorCode || "API_ERROR",
          apiErrorMsg
        );
      }
    }
  } catch (error) {
    console.error(
      `[ERROR] Controller deleteUser unexpected error: ${error.message}`
    );
    return sendJsonError(
      res,
      500,
      "CONTROLLER_EXCEPTION",
      "Internal Server Error"
    );
  }
};

const sendError = (res, statusCode, message) => {
  res.status(statusCode).set("Content-Type", "text/html").send(`
            <html>
            <head><title>${statusCode} - Error</title></head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h1 style="color: red;">${statusCode} - ${message.split(":")[0]
    }</h1>
                <p>${message}</p>
                <a href="/" style="color: blue;">Go Back Home</a>
            </body>
            </html>
        `);
};


const getSortdGamesWidget = async (req, res) => {
  try {
    const { authToken } = req;
    const { width, height, border, game_type } = req.query;
    let { url } = req.query;
    if (!authToken) {
      return sendJsonError(
        res,
        401,
        "UNAUTHORIZED",
        "Authentication token is required."
      );
    }

    if (!url) {
      return sendJsonError(
        res,
        400,
        "MISSING_URL",
        "Missing `url` query parameter for Asharq Games Widget"
      );
    }

    // Make a POST request via the helper to get article games
    const articleGamesResponse = await v2gameHelper.getArticleGamesForWidget(
      authToken,
      url = decodeURIComponent(url)
    );

    const games = articleGamesResponse?.data?.game;
    if (!articleGamesResponse.status || !Array.isArray(games)) {
      return sendJsonError(res, 404, "GAMES_NOT_FOUND", "No games found for this article.");
    }

    const matchingGame = games.find(game => game.game_type === game_type);

    if (!matchingGame || !matchingGame.game_id) {
      return sendJsonError(res, 404, "GAME_NOT_FOUND", `Game of type '${game_type}' not found for this article.`);
    }

    const { game_id } = matchingGame;

    const gameUrl = `https://${req.get("host")}/games/${game_type}?id=${game_id}&src=article`;
    console.log(`[INFO] Generated game URL for widget: ${gameUrl}`);
    const script = widgetHelper.generateWidgetScript({
      url: gameUrl,
      width: width || "100%",
      height: height || "100vh",
      border: border || "none",
    });

    res.setHeader("Content-Type", "application/javascript");
    res.send(script);
  } catch (err) {
    if (err.isAxiosError) {
      console.error(`[ERROR] DevAPI call failed: ${err.message}`);
      const status = err.response?.status || 500;
      const data = err.response?.data;
      const errorCode = data?.error?.errorCode || "DEV_API_ERROR";
      const errorMsg = data?.error?.errorMsg || data?.message || "Failed to get article games from DevAPI.";
      return sendJsonError(res, status, errorCode, errorMsg);
    }
    console.error(`[ERROR] getSortdGamesWidget failed: ${err.message}`);
    return sendJsonError(res, 500, "WIDGET_GENERATION_ERROR", "An error occurred while generating the widget script.");
  }
};

const addContinueGames = async (req, res) => {
  try {
    const { authToken } = req;
    const { continueGames, userId } = req.body;

    if (!userId || !continueGames) {
      return sendJsonError(res, 400, 401, "user_id and continueGames are required.");
    }

    const apiResponse = await v2gameHelper.addContinueGames(authToken, continueGames, userId);
    console.log("apiResponse", apiResponse);
    if (apiResponse && apiResponse.status === true) {
      return res.status(200).json({ status: true, data: apiResponse.data });
    } else {
      return sendJsonError(res, 500, "Internal Server Error");
    }
  } catch (error) {
    console.error(`[ERROR] addContinueGames failed: ${error.message}`);
    return sendJsonError(res, 500, "Internal Server Error 2");
  }
};

const getContinueGames = async (req, res) => {
  try {
    const { authToken } = req;
    const { userId } = req.body;

    if (!userId) {
      return sendJsonError(res, 400, 401, "user_id is required.");
    }

    const apiResponse = await v2gameHelper.getContinueGames(authToken, userId);
    if (apiResponse && apiResponse.status === true) {
      return res.status(200).json({ status: true, data: apiResponse.data });
    } else {
      const errorDetails = apiResponse?.error || {};
      return sendJsonError(
        res,
        500,
        errorDetails.errorCode || "INTERNAL_ERROR",
        errorDetails.errorMsg || "Failed to get continue games"
      );
    }
  } catch (error) {
    console.error(`[ERROR] getContinueGames failed: ${error.message}`);
    return sendJsonError(res, 500, "INTERNAL_ERROR", "Internal Server Error");
  }
};

module.exports = {
  getGameConfig,
  getGameTypeWidget,
  addUser,
  deleteUser,
  getGames,
  getSortdGamesWidget,
  addContinueGames,
  getContinueGames
};
