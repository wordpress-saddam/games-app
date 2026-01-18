const router = require('express').Router();
const importController = require('../controllers/import-controller');
const { verifyAdminToken } = require('../middlewares/auth-middleware');
const { validatePagination } = require('../middlewares/utils');
const sendResponse = require('../middlewares/response');

router
    .post('/feed/:feedId', verifyAdminToken, importController.importFeed, sendResponse)
    .post('/all', verifyAdminToken, importController.importAllFeeds, sendResponse)
    .get('/history', verifyAdminToken, validatePagination, importController.getImportHistory, sendResponse);

module.exports = router;

