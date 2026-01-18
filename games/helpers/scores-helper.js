const devApi = require('../utils/devapi-head');


const insertGamesScore = async (authToken, scoreData) => {
 if (!authToken || !scoreData) {
        console.error("[Service Error] Missing authToken or scoreData for inserting score.");
        return null;
    }
     console.log("helper",scoreData)
    return await devApi.insertGameScore(authToken, scoreData);
};


const getLeaderBoard = async (authToken, scoreType, duration, queryParams) => {
 if (!authToken || !scoreType || !duration) {
 console.error("[Service Error] Missing authToken, scoreType, or duration for getting leaderboard.");
        return null;
    }
 return await devApi.getLeaderBoard(authToken, scoreType, duration, queryParams);
};

module.exports = {
    insertGamesScore,
    getLeaderBoard,
};
