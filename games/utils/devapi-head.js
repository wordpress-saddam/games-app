const axios = require("axios");
const config = require("../config/config");
const html = require("../utils/html-generator");
const DEV_API_DOMAIN = config?.apps?.devapi?.url ?? "http://localhost:5002";

const fetchGameData = async (authToken, gameTypeCode, filters = {}) => {
  try {
    if (!authToken || !gameTypeCode) {
      throw new Error("Missing required parameters: authToken or gameTypeCode");
    }
    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value);
      }
    }
    const queryString = queryParams.toString();
    const url = `${DEV_API_DOMAIN}/v1/games/get-games/token/${authToken}/gametype/${gameTypeCode}${queryString ? `?${queryString}` : ""
      }`;

    const { data } = await axios.get(url);
    return data || null;
  } catch (error) {
    console.error(`[ERROR] Failed to fetch game data: ${error.message}`);
    return html.getErrorHTML("Error fetching game data. Please try again later.");
  }
};

const fetchGameConfig = async (authToken) => {
  try {
    const { data } = await axios.get(
      `${DEV_API_DOMAIN}/v1/games/get-games-config/token/${authToken}`
    );
    return data || null;
  } catch (error) {
    console.error(`[ERROR] Failed to fetch game config: ${error.message}`);
    throw error;
  }
};

const fetchArticleData = async (authToken, articleIds) => {
  try {
    const url = `${DEV_API_DOMAIN}/v1/articles/getbyids/token/${authToken}?articleIds=${articleIds}`
    const { data } = await axios.get(url);
    return data || null;
  } catch (error) {
    console.error(`[ERROR] Failed to fetch article data: ${error.message}`);
    throw error;
  }
};

const addUser = async (authToken, user) => {
  try {
    const url = `${DEV_API_DOMAIN}/v1/games/register-user/token/${authToken}`;
    const { id: user_id, username: user_name, country, city, region, email } = user;


    const payload = {
      user_id,
      user_name,
      ...(country && { country }),
      ...(city && { city }),
      ...(region && { region }),
      ...(email && { email }),
    };
    console.log("payload to add user ", payload)
    const response = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data || null;
  } catch (error) {
    console.error(
      `[ERROR] Failed to register user via Dev API: ${error.message}`
    );
    if (error.response && error.response.data) {
      return error.response.data;
    }
    throw error;
  }
};

const addContinueGames = async (authToken, continueGames, userId) => {
  try {
    const url = `${DEV_API_DOMAIN}/v1/games/add-continue-games/token/${authToken}`;
    const payload = {
      user_id: userId,
      continue_games: continueGames
    };
    
    const response = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data || null;
  } catch (error) {
    console.error(`[ERROR] Failed to add continue games: ${error.message}`);
    throw error;
  }
};

const deleteUser = async (authToken, userId) => {
  try {
    const url = `${DEV_API_DOMAIN}/v1/games/delete-user/token/${authToken}`;
    const payload = { user_id: userId };
    const response = await axios.post(url, payload, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data || null;
  } catch (error) {
    console.error(
      `[ERROR] Failed to delete user via Dev API: ${error.message}`
    );
    if (error.response && error.response.data) {
      return error.response.data;
    }
    throw error;
  }
};

const updateUser = async (authToken, userData) => {
  try {
    if (!authToken || !userData) {
      throw new Error("Missing required parameters: authToken or userData");
    }
    const url = `${DEV_API_DOMAIN}/v1/games/update-user/token/${authToken}`;
    const { data } = await axios.post(url, userData);
    return data || null;
  } catch (error) {
    console.error(`[ERROR] Failed to update user: ${error.message}`);
    throw error; // Re-throw the error to be handled by the caller
  }
};
const insertGameScore = async (authToken, scoreData) => {
  try {
    if (!authToken || !scoreData) {
      throw new Error("Missing required parameters: authToken or scoreData");
    }
    console.log("dev", scoreData)
    const url = `${DEV_API_DOMAIN}/v1/games/insert-game-score/token/${authToken}`;
    const payload = {
      user_id: scoreData.user_id,
      user_name: scoreData.user_name,
      score: scoreData.score,
      email: scoreData.email,
      game_type: scoreData.game_type,
      game_id: scoreData.game_id,
    };
    const response = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data || null;
  } catch (error) {
    console.error(
      `[ERROR] Failed to register user via Dev API: ${error.message}`
    );
    if (error.response && error.response.data) {
      return error.response.data;
    }
    throw error;
  }
};

const getLeaderBoard = async (
  authToken,
  scoreType,
  duration,
  queryParams = {}
) => {
  try {
    const urlParams = new URLSearchParams();
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined && value !== null && value !== "") {
        urlParams.append(key, value);
      }
    }

    const queryString = urlParams.toString();

    console.log("dv ", queryString)
    const url = `${DEV_API_DOMAIN}/v1/games/get-leader-board/token/${authToken}/type/${scoreType}/duration/${duration}${queryString ? `?${queryString}` : ""
      }`;
    console.log(url)
    const { data } = await axios.get(url);
    return data || null;
  } catch (error) {
    console.error(`[ERROR] Failed to get leaderboard: ${error.message}`);
    throw error;
  }
};

const getArticleGamesForWidget = async (authToken, articleUrl) => {
  try {
    if (!authToken || !articleUrl) {
      throw new Error("Missing required parameters: authToken or articleUrl");
    }
    const url = `${DEV_API_DOMAIN}/v1/articles/get-article-games/token/${authToken}`;
    const response = await axios.post(url, { url: articleUrl });
    return response.data || null;
  } catch (error) {
    console.error(`[ERROR] Failed to fetch article games for widget: ${error.message}`);
    throw error;
  }
};

const getContinueGames = async (authToken, userId) => {
  try {
    if (!authToken || !userId) {
      throw new Error("Missing required parameters: authToken or userId");
    }
    const url = `${DEV_API_DOMAIN}/v1/games/get-continue-games/token/${authToken}`;
    const payload = { user_id: userId };
    console.log(" payload to get continue games from devapi ", payload);
    const response = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data || null;
  } catch (error) {
    console.error(`[ERROR] Failed to get continue games: ${error.message}`);
    if (error.response && error.response.data) {
      return error.response.data;
    }
    throw error;
  }
};

module.exports = {
  fetchGameData,
  fetchGameConfig,
  fetchArticleData,
  addUser,
  deleteUser,
  updateUser,
  addContinueGames,
  getContinueGames,
  insertGameScore,
  getLeaderBoard,
  getArticleGamesForWidget,
};
