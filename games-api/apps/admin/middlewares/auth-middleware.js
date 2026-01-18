const { verifyToken } = require('../helpers/jwt-helper');
const apiExceptions = require('../../../config/api-exceptions').admin;

const verifyAdminToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return global.sendErrorResponse(res, false, 200, apiExceptions.invalidToken.code, apiExceptions.invalidToken.msg);
        }

        const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

        if (!token) {
            return global.sendErrorResponse(res, false, 200, apiExceptions.invalidToken.code, apiExceptions.invalidToken.msg);
        }

        const decoded = verifyToken(token);

        if (!decoded || decoded.type !== 'admin') {
            return global.sendErrorResponse(res, false, 200, apiExceptions.invalidToken.code, apiExceptions.invalidToken.msg);
        }

        // Attach user info to request
        req.user = {
            userId: decoded.userId,
            email: decoded.email
        };

        next();
    } catch (err) {
        if (err.code === 'TOKEN_EXPIRED') {
            return global.sendErrorResponse(res, false, 200, apiExceptions.tokenExpired.code, apiExceptions.tokenExpired.msg);
        }
        return global.sendErrorResponse(res, false, 200, apiExceptions.invalidToken.code, apiExceptions.invalidToken.msg);
    }
};

module.exports = {
    verifyAdminToken
};

