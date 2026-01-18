const v1Routes = require('./v1/v1-routes');
const v2Routes = require('./v2/v2-routes');

const initRoutes = (app) => {
    app
        .use('/v1', v1Routes)
        .use('/v2', v2Routes)
        .use('*', (req, res) => {
            global.sendErrorResponse(res, false, 404, 404, "Invalid dev api route! try again with valid route");
        })
}

module.exports = initRoutes;