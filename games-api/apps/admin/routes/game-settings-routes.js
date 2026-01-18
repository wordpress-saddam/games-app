const router = require('express').Router();
const gameSettingsController = require('../controllers/game-settings-controller');
const { verifyAdminToken } = require('../middlewares/auth-middleware');
const { validatePagination } = require('../middlewares/utils');
const sendResponse = require('../middlewares/response');

router
    .post('/', verifyAdminToken, gameSettingsController.createOrUpdateSettings, sendResponse)
    .get('/', verifyAdminToken, validatePagination, gameSettingsController.getAllSettings, sendResponse)
    .get('/feed/:feedId', verifyAdminToken, gameSettingsController.getSettings, sendResponse)
    .delete('/feed/:feedId', verifyAdminToken, gameSettingsController.deleteSettings, sendResponse);

module.exports = router;

