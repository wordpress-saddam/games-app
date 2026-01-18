const express = require('express');
const router = express.Router();
const gameController = require('../controllers/games-controller');


router.get('/',gameController.getGameTypeHTML);
router.get('/play/:code', gameController.getGames);


module.exports = router;
