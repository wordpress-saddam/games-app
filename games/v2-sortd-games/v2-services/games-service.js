import axios from "axios";

const getToken = () => {
  let token = null;
  if (typeof window !== 'undefined' && window.localStorage) {
    const user  = localStorage.getItem('userDetails');
   if (user) {
      const userDetails = JSON.parse(user);
      token = userDetails?.token || null;
    }
  }
  if (!token) {
    console.log("JWT Token not found. API requests requiring auth might fail. Using placeholder.");
    return null;
  }
  return token;
};

const isAnonymousUser = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const user = localStorage.getItem('userDetails');
    if (user) {
      try {
        const userDetails = JSON.parse(user);
        return userDetails?.isAnonymous === true;
      } catch (e) {
        return false;
      }
    }
  }
  return false;
};

const getAuthHeaders = () => {
  const token = getToken();

  return {
    Authorization: `Bearer ${token}`,
  };
};

/**
 * Makes an API request using Axios.
 * @param {string} method - The HTTP method (e.g., 'get', 'post', 'put', 'delete').
 * @param {string} url - The URL to request.
 * @param {object} [payload=null] - The data to send. For GET/DELETE, treated as query params. For POST/PUT/PATCH, as request body.
 * @param {boolean} [requiresAuth=false] - Whether the request requires authentication.
 * @returns {Promise<import("axios").AxiosResponse<any>>} The Axios response.
 */
const makeApiRequest = async (method, url, payload = null, requiresAuth = false) => {
  const config = {
    method: method.toLowerCase(),
    url,
  };

  if (requiresAuth) {
    config.headers = getAuthHeaders();
  }

  if (payload) {
    if (['get', 'delete', 'head', 'options'].includes(config.method)) {
      config.params = payload; // Data as query parameters
    } else if (['post', 'put', 'patch'].includes(config.method)) {
      config.data = payload; // Data as request body
    }
  }

  try {
    console.log("config for makeApiRequest", config);
    const response = await axios.request(config);
    return response;
  } catch (error) {
    const errorPrefix = `[API Request][${method.toUpperCase()}] to ${url}`;
    if (error.response) {
      console.error(`${errorPrefix} failed with status ${error.response.status}:`, error.response.data);
    } else if (error.request) {
      console.error(`${errorPrefix} failed: No response received.`, error.request);
    } else {
      console.error(`${errorPrefix} failed: Error in request setup.`, error.message);
    }
    throw error; // Re-throw the error to be handled by the caller
  }
};

const getGameConfig = async () => {
  const response = await makeApiRequest("get", "/api/v2/get-config");
  return response.data;
  // return true;
};

const getGame = async (gameType, id) => {
  if (!gameType) {
    return "Game type is required";
  }

  let response;

  try {
     if (!id || id === "null" || id === "undefined"){
     
      response = await makeApiRequest("get", `/api/v2/play/${gameType}`);
    } else {
      response = await makeApiRequest("get", `/api/v2/play/${gameType}`, { game_id: id }, true);
    }
    return response.data;
  } catch (error) {
    console.error("Failed to fetch game:", error);
    throw error;
  }
};

const addUser = async (user) => {
  try {
    const formdata = { ...user };
    console.log("adding user with data:", formdata);
    const response = await makeApiRequest("post", "/api/v2/user/add-user", formdata, true);
    console.log("Add User Response:", response);
    return response;
  } catch (e) {
    console.log("Error in addUser service:", e);
    throw e;
  }
};

const addContinueGames = async (continueGames, userId) => {
  // Skip continue games persistence for anonymous users
  if (isAnonymousUser()) {
    console.log("Anonymous user detected. Skipping continue games persistence.");
    return { data: { message: "Continue games not saved for anonymous users" } };
  }
  const payload = {
    continueGames: continueGames,
    userId: userId
  };
  console.log(" payload to add continue games", payload);
  try {
    const response = await makeApiRequest("post", "/api/v2/user/add-continue-games", payload, true);
    return response;
  } catch (e) {
    console.log("Error in addContinueGames service:", e);
    throw e;
  }
};

const getContinueGames = async (userId) => {
  const payload = {
    userId: userId
  };
  try {
    const response = await makeApiRequest("post", "/api/v2/user/get-continue-games", payload, true);
    return response;
  } catch (e) {
    console.log("Error in getContinueGames service:", e);
    throw e;
  }
};

const deleteUser = async (user) =>{
   try {
   
    const response = await makeApiRequest("post", "/api/v2/user/delete-user", user, true);
    console.log("Add User Response:", response);
    return response;
  } catch (e) {
    console.log("Error in addUser service:", e);
    // Re-throw the error so the component can handle it
    throw e;
  }
}
const insertScore = async (scorePayload) => {
  // Skip score insertion for anonymous users
  if (isAnonymousUser()) {
    console.log("Anonymous user detected. Skipping score insertion.");
    return { data: { message: "Score not saved for anonymous users" } };
  }
  const response = await makeApiRequest("post", "/api/v2/scores/insert-score", { scoreData: scorePayload }, true);
  return response;
};


const getLeadershipBoard = async (filter = {}) => {
  // Skip leaderboard fetch for anonymous users
  if (isAnonymousUser()) {
    console.log("Anonymous user detected. Leaderboard access denied.");
    return { data: { message: "Leaderboard not available for anonymous users" } };
  }
  const { score_type, duration, ...otherFilters } = filter;

  if (!score_type || !duration) {
    console.error("Error: 'score_type' and 'duration' are required in the filter for getLeadershipBoard.");
    throw new Error("'score_type' and 'duration' are required parameters.");
  }
console.log(filter)
  const url = `/api/v2/scores/get-leaderboard/type/${score_type}/duration/${duration}`;
  const response = await makeApiRequest("get", url, otherFilters, true);
  return response.data;
};


const fetchUserIPDetails = async() =>{
 try {
  const response = await axios.get("http://ipwho.is/");
    if (response.data && response.data.success) {
      console.log(response.data)
      return response.data
      
    } else {
      console.error("Failed to fetch IP details:", response.data.message);
    }
  } catch (error) {
    console.error("Error fetching IP details:", error);
  }}



export default {
  getGameConfig,
  getGame,
  addUser,
  insertScore,
  addContinueGames,
  getContinueGames,
  deleteUser,
  getLeadershipBoard,
  fetchUserIPDetails
};
