const jwt = require('jsonwebtoken');
const config = require('../config/config'); // Adjust path if your config file is elsewhere

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const jwtSecret = config.jwt?.secret || 'YOUR_DEFAULT_SECRET';
        if (!jwtSecret) {
            console.error("JWT_SECRET is not defined in the configuration.");
            return res.status(500).json({ message: 'Internal server error: JWT configuration missing.' });
        }

        const decoded = jwt.decode(token, jwtSecret);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired.' });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({ message: 'Invalid token.' });
        }
        console.error("Error verifying token:", error);
        return res.status(500).json({ message: 'Failed to authenticate token.' });
    }
};

module.exports = verifyToken;
