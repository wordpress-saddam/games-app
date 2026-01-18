const express = require('express');
const router = express.Router();
const gameController = require('../controllers/games-controller');
const gamesController = require('../v2-controllers/games-controller');

router.get('/home.js',gameController.getGameTypeWidget);
router.get('/game.js', gamesController.getSortdGamesWidget);


module.exports = router;
