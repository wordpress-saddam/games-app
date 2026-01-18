const devapi = require('../utils/devapi-head');
const scoreHelper = require('../helpers/scores-helper');


const insertScore = async (req, res) => {
    try {
        const { authToken } = req;
        console.log(req.body)
        const {scoreData} = req.body;

        console.log("controller",scoreData)
        if (!authToken) {
            return res.status(401).json({ message: 'Unauthorized: Auth token is missing.' });
        }
        if (!scoreData) {
            return res.status(400).json({ message: 'Bad Request: Score data is missing.' });
        }

        const result = await scoreHelper.insertGamesScore(authToken, {...scoreData,
            user_id:req?.user?.userId??""
            
        });

        if (result) {
            res.status(201).json({ message: 'Score inserted successfully', data: result });
        } else {
            res.status(500).json({ message: 'Failed to insert score. Please try again later.' });
        }
    } catch (error) {
        console.error('[Controller Error] Insert Score:', error);
        res.status(500).json({ message: 'An unexpected error occurred while inserting the score.' });
    }
};

const getLeaderboard = async (req, res) => {
    try {

        console.log("get leaderboard called")
        const { authToken } = req;
        const { score_type, duration } = req.params; 
        const { ...otherFilters } = req.query;
        const userId = req?.user?.id ?? "";
        console.log("otherfilter" , otherFilters)
        if (!authToken) {
            return res.status(401).json({ message: 'Unauthorized: Auth token is missing.' });
        }
        if (!score_type || !duration) {
            return res.status(400).json({ message: 'Bad Request: score_type or duration is missing in path parameters.' });
        }

        const queryParams = {
            ...otherFilters,
            user_id: userId,
        };
        console.log("queryparam" , queryParams)

        const result = await scoreHelper.getLeaderBoard(authToken, score_type, duration, queryParams);
console.log("result" , result)
        if (result) {
            res.status(200).json({ message: 'Leaderboard fetched successfully', data: result });
        } else {
            res.status(500).json({ message: 'Failed to fetch leaderboard. Please try again later.' });
        }
    } catch (error) {
        console.error('[Controller Error] Get Leaderboard:', error);
        res.status(500).json({ message: 'An unexpected error occurred while fetching the leaderboard.' });
    }
};

module.exports = {
    insertScore,
    getLeaderboard
};