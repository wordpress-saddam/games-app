const { verifyToken } = require('../../../core_libs/utils/jwt-helper');
const GamesUser = require('../../../core_libs/models/mongodb/db-games-users');
const apiExceptions = require('../../../config/api-exceptions').devapi;

/**
 * JWT Authentication Middleware
 * Verifies JWT token and attaches user to request object
 */
const authenticateJWT = async (req, res, next) => {
    try {
        // Get token from Authorization header or query parameter
        let token = null;
        
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        } else if (req.query.token) {
            token = req.query.token;
        }

        if (!token) {
            return global.sendErrorResponse(
                res, 
                false, 
                401, 
                apiExceptions.invalidToken?.code || 401, 
                'No token provided'
            );
        }

        // Verify token
        const decoded = verifyToken(token);
        if (!decoded) {
            return global.sendErrorResponse(
                res, 
                false, 
                401, 
                apiExceptions.invalidToken?.code || 401, 
                'Invalid or expired token'
            );
        }

        // Fetch user from database
        const user = await GamesUser.findActiveById(decoded.userId);
        if (!user || !user.status) {
            return global.sendErrorResponse(
                res, 
                false, 
                401, 
                apiExceptions.invalidToken?.code || 401, 
                'User not found or inactive'
            );
        }

        // Attach user to request
        req.user = {
            _id: user._id,
            email: user.email,
            name: user.name,
            googleId: user.googleId || null,
            keycloakId: user.keycloakId || null,
            auth_token: user.auth_token || null
        };
        req.userId = user._id.toString();

        next();
    } catch (err) {
        console.error('Error in JWT authentication middleware:', err);
        return global.sendErrorResponse(
            res, 
            false, 
            500, 
            500, 
            'Authentication error'
        );
    }
};

module.exports = {
    authenticateJWT
};

