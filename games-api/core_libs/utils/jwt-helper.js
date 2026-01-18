const jwt = require('jsonwebtoken');
const Config = require('../../config/config');

// Get JWT secret from environment or config
const JWT_SECRET = process.env.JWT_SECRET || Config.jwt?.secret || 'your-secret-key-change-in-production';

// JWT expiration time (15 minutes)
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '15m';

/**
 * Generate JWT token for user
 * @param {Object} user - User object with _id, email, name
 * @param {String} provider - Auth provider ('keycloak' or 'google')
 * @returns {String} JWT token
 */
const generateToken = (user, provider = 'google') => {
    try {
        const payload = {
            userId: user._id.toString(),
            email: user.email,
            name: user.name,
            provider: provider
        };

        const token = jwt.sign(payload, JWT_SECRET, {
            expiresIn: JWT_EXPIRATION,
            issuer: 'asharq-games',
            audience: 'asharq-games-frontend'
        });

        return token;
    } catch (err) {
        console.error('Error generating JWT token:', err);
        throw err;
    }
};

/**
 * Verify JWT token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded token payload or null if invalid
 */
const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET, {
            issuer: 'asharq-games',
            audience: 'asharq-games-frontend'
        });
        return decoded;
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            console.error('JWT token expired');
        } else if (err.name === 'JsonWebTokenError') {
            console.error('Invalid JWT token');
        } else {
            console.error('Error verifying JWT token:', err);
        }
        return null;
    }
};

module.exports = {
    generateToken,
    verifyToken,
    JWT_SECRET
};

