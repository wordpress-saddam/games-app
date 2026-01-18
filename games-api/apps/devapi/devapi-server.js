const express = require('express');
const app = express();
require('dotenv').config();
const appConfig = require('../../config/config').apps.devapi;
const initV1Routes = require('./routes/init-routes');
const port = process.env.PORT || appConfig.port;
const config = require('../../config/config');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');

const {
  loadLogger,
  loadRequestParsers,
  createGlobals
} = require('./scripts/init-server');

if (config.ENV === "STAGING" || config.ENV === "PRODUCTION" && config.apm.devapi.enable) {
  console.log("Starting APM")
  var apm = require('elastic-apm-node').start({
    serviceName: config.apm.devapi.service_name,
    serverUrl: config.apm.devapi.server_url
  })
}

// CORS configuration - Allow all origins
const corsOptions = {
  //origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  origin: true, // Allow all origins (works with credentials: true)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Health check endpoint - ping/pong (registered early, before DB/Redis connections)
app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

// Session configuration (minimal, for passport)
app.use(session({
  secret: process.env.SESSION_SECRET || config.jwt?.secret || 'your-session-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

loadLogger(app);
loadRequestParsers(app);
createGlobals(app);

// Start server listening BEFORE initializing routes (which may connect to DB/Redis)
app.listen(port, () => {
  console.log("Dev-api-server running on port ", port);
  
  // Initialize routes after server is listening
  // This allows /ping to be available even if DB/Redis connections fail
  initV1Routes(app);
  
})