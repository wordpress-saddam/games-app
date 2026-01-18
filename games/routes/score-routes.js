const express = require('express');
const router = express.Router();
const scoreController = require('../controllers/scores-controller');
const verifyToken = require('../middlewares/verify-token'); // Import the middleware

router.post('/insert-score',verifyToken, scoreController.insertScore);
router.get('/get-leaderboard/type/:score_type/duration/:duration', verifyToken, scoreController.getLeaderboard);

module.exports = router;