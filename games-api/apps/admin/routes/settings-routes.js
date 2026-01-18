const router = require('express').Router();
const settingsController = require('../controllers/settings-controller');
const { verifyAdminToken } = require('../middlewares/auth-middleware');
const sendResponse = require('../middlewares/response');

router
    .get('/', verifyAdminToken, settingsController.getSettings, sendResponse)
    .put('/', verifyAdminToken, settingsController.updateSettings, sendResponse)
    .get('/global', verifyAdminToken, settingsController.getGlobalSettings, sendResponse);

module.exports = router;

