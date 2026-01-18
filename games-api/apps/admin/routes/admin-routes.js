const router = require('express').Router();
const authRoutes = require('./auth-routes');
const feedsRoutes = require('./feeds-routes');
const feedArticlesRoutes = require('./feedarticles-routes');
const settingsRoutes = require('./settings-routes');
const importRoutes = require('./import-routes');
const gameSettingsRoutes = require('./game-settings-routes');

router
    .use('/auth', authRoutes)
    .use('/feeds', feedsRoutes)
    .use('/feedarticles', feedArticlesRoutes)
    .use('/settings', settingsRoutes)
    .use('/import', importRoutes)
    .use('/game-settings', gameSettingsRoutes)
    .get('/health-check', (req, res) => {
        return res.status(200).json({
            status: true,
            message: 'Admin API is working fine'
        });
    });

const initAdminRoutes = (app) => {
    app.use('/api/admin', router);
};

module.exports = initAdminRoutes;

