const router = require('express').Router();
const feedsController = require('../controllers/feeds-controller');
const { verifyAdminToken } = require('../middlewares/auth-middleware');
const { validatePagination } = require('../middlewares/utils');
const sendResponse = require('../middlewares/response');

router
    .post('/test', verifyAdminToken, feedsController.testFeed, sendResponse)
    .post('/', verifyAdminToken, feedsController.createFeed, sendResponse)
    .get('/', verifyAdminToken, validatePagination, feedsController.getAllFeeds, sendResponse)
    .get('/:id', verifyAdminToken, feedsController.getFeedById, sendResponse)
    .put('/:id', verifyAdminToken, feedsController.updateFeed, sendResponse)
    .delete('/:id', verifyAdminToken, feedsController.deleteFeed, sendResponse)
    .post('/:id/restore', verifyAdminToken, feedsController.restoreFeed, sendResponse)
    .post('/:id/test', verifyAdminToken, feedsController.testFeed, sendResponse);

module.exports = router;

