const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const appConfig = require('../../config/config').apps.admin;
const initAdminRoutes = require('./routes/admin-routes');
const port = process.env.ADMIN_PORT || appConfig.port;
const config = require('../../config/config');

const {
    loadLogger,
    loadRequestParsers,
    createGlobals
} = require('./scripts/init-server');

// Start feed scheduler
const { startScheduler } = require('./services/feed-scheduler');

if (config.ENV === "STAGING" || config.ENV === "PRODUCTION" && config.apm && config.apm.admin && config.apm.admin.enable) {
    console.log("Starting APM")
    var apm = require('elastic-apm-node').start({
        serviceName: config.apm.admin.service_name,
        serverUrl: config.apm.admin.server_url
    })
}

// Enable CORS
app.use(cors({
    origin: [
        process.env.ADMIN_FRONTEND_URL || "http://localhost:3000",
        "https://console-asharqgames-uat.sortd.pro"
      ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

loadLogger(app);
loadRequestParsers(app);
createGlobals(app);

// Health check endpoint - ping/pong
app.get('/ping', (req, res) => {
    res.status(200).send('pong');
});

initAdminRoutes(app);

app.listen(port, () => {
    console.log("Admin server running on port ", port);
    
    // Start scheduler after server starts
    setTimeout(() => {
        startScheduler();
    }, 2000);
})

