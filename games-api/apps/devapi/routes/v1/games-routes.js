const { verifyToken } = require('../../middlewares/verify-token');

const router = require('express').Router();
const gamesController = require('../../controllers/games-controller')

router
    .get('/list/token/:token/type/:type', verifyToken, gamesController.getGames)
    .get('/get-games-config/token/:token', verifyToken, gamesController.getGamesConfig)
    .get('/game-config-byfilter/token/:token', verifyToken, gamesController.getGamesConfigByFilter)
    .get('/get-games/token/:token/gametype/:game_type', verifyToken, gamesController.getAIGames)
    .post('/register-user/token/:token', verifyToken, gamesController.registerGamesUser)
    .post('/update-user/token/:token', verifyToken, gamesController.updateGamesUser)
    .post('/insert-game-score/token/:token', verifyToken, gamesController.insertGameScore)
    .get('/get-leader-board/token/:token/type/:score_type/duration/:duration', verifyToken, gamesController.getGameLeaderboard)
    .post('/delete-user/token/:token', verifyToken, gamesController.deleteGamesUser)
    .post('/add-continue-games/token/:token', verifyToken, gamesController.updateUserContinueGames)
    .post('/get-continue-games/token/:token', verifyToken, gamesController.getContinueGames)

module.exports = router;