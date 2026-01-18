const router = require('express').Router();
const feedArticlesController = require('../controllers/feedarticles-controller');
const { verifyAdminToken } = require('../middlewares/auth-middleware');
const { validatePagination } = require('../middlewares/utils');
const sendResponse = require('../middlewares/response');

router
    .get('/', verifyAdminToken, validatePagination, feedArticlesController.getFeedArticles, sendResponse)
    .get('/:id', verifyAdminToken, feedArticlesController.getFeedArticleById, sendResponse)
    .put('/:id/status', verifyAdminToken, feedArticlesController.updateFeedArticleStatus, sendResponse)
    .delete('/:id', verifyAdminToken, feedArticlesController.deleteFeedArticle, sendResponse);

module.exports = router;

