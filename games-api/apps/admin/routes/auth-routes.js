const router = require('express').Router();
const authController = require('../controllers/auth-controller');
const { verifyAdminToken } = require('../middlewares/auth-middleware');
const sendResponse = require('../middlewares/response');

router
    .post('/register', authController.register, sendResponse)
    .post('/login', authController.login, sendResponse)
    .get('/me', verifyAdminToken, authController.getCurrentUser, sendResponse);

module.exports = router;

