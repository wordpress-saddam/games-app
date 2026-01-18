const router = require('express').Router();
const authController = require('../../controllers/auth-controller');
const googleAuthController = require('../../controllers/google-auth-controller');
const keycloakAuthController = require('../../controllers/keycloak-auth-controller');
const { authenticateJWT } = require('../../middlewares/jwt-auth');
const sendResponse = require('../../middlewares/response');
const {
    respondFromRedisCache,
    verifyQueryString
} = require('../../middlewares/utils');

const {
    verifyToken
} = require('../../middlewares/verify-token')

router
    .post('/host', authController.getAuthToken)
    // Google OAuth routes (kept for future use, currently disabled)
    .get('/google', googleAuthController.initiateGoogleAuth)
    .get('/google/callback', googleAuthController.handleGoogleCallback)
    // Keycloak OAuth routes (PRIMARY - active)
    .get('/keycloak', keycloakAuthController.initiateKeycloakAuth)
    .get('/keycloak/callback', keycloakAuthController.handleKeycloakCallback)
    // Logout endpoint (GET for redirect)
    .get('/logout', keycloakAuthController.handleLogout)
    // Verify JWT token endpoint
    .get('/verify', authenticateJWT, authController.verifyAuthToken)
    // .get('/test/token/:token', respondFromRedisCache, verifyQueryString, verifyToken, authController.test, sendResponse)
    // .post('/apppackage', authController.getAppAuthToken)
module.exports = router;