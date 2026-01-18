const express = require('express');
const router = express.Router();
const v2Controller = require('../v2-controllers/games-controller');
const scoreRoutes = require('./score-routes'); // Import the score routes
const userRoutes = require('./user-routes'); // Import the user routes


router.use('/scores', scoreRoutes);
router.use('/user', userRoutes);

router.get('/get-config',v2Controller.getGameConfig);
router.get('/play/:code', v2Controller.getGames);
router.post('/add-user',  v2Controller.addUser)


module.exports = router;
