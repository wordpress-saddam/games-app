const express = require('express');
const router = express.Router();
const userController = require('../v2-controllers/games-controller');

router.post('/add-user', userController.addUser);
router.post('/delete-user', userController.deleteUser);
router.post('/add-continue-games', userController.addContinueGames);
router.post('/get-continue-games', userController.getContinueGames);
module.exports = router;