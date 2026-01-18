const jwt = require('jsonwebtoken');
const config = require('../../../config/config').apps.admin;

/**
 * Generate JWT token for admin user
 * @param {string} userId - User ID
 * @param {string} email - User email
 * @returns {string} - JWT token
 */
const generateToken = (userId, email) => {
    try {
        const payload = {
            userId,
            email,
            type: 'admin'
        };

        const token = jwt.sign(payload, config.jwtSecret, {
            expiresIn: config.jwtExpiry || '24h'
        });

        return token;
    } catch (err) {
        console.error('Error generating token:', err);
        throw err;
    }
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Object} - Decoded token payload or null
 */
const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, config.jwtSecret);
        return decoded;
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            throw { message: 'Token expired', code: 'TOKEN_EXPIRED' };
        } else if (err.name === 'JsonWebTokenError') {
            throw { message: 'Invalid token', code: 'INVALID_TOKEN' };
        } else {
            throw { message: 'Token verification failed', code: 'VERIFICATION_FAILED' };
        }
    }
};

module.exports = {
    generateToken,
    verifyToken
};

