const gameRoutes = require('./games-routes');
const widgetRoutes = require('./widget-routes');
const v2GameRoutes = require('./v2-games-routes');

const initializeRoutes = (app) => {
    app
       .use('/', gameRoutes)
       .use('/widget', widgetRoutes)
       .use('/api/v2', v2GameRoutes)
}

module.exports = initializeRoutes;
