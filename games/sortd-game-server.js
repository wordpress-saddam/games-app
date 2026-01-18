const express = require('express');
const path = require('path');
const cors = require("cors");
const app = express();
app.use(cors());
const config = require('./config/config');

const PORT = process.env.PORT || config?.port;

const verifyWidgetAccess = require('./middlewares/verify-widget-access');
const initializeRoutes = require('./routes/init-routes');
app.use(express.json()); 

app.use(express.static(path.join(__dirname, 'public')));

app.use(verifyWidgetAccess);

app.use(express.static(path.join(__dirname,'/v2-sortd-games/dist'))); 

// Health check endpoint - ping/pong
app.get('/ping', (req, res) => {
    res.status(200).send('pong');
});

initializeRoutes(app);
app.get('/*', function (req, res) {
  res.sendFile(path.join(__dirname, '/v2-sortd-games/dist', 'index.html'));
});



app.use((req, res, next) => {
    console.log(`[SERVER] ${req.method} ${req.url}`);
    
    res.status(404)
       .set("Content-Type", "text/html")
       .send(`
            <html>
            <head><title>404 - Not Found</title></head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h1 style="color: red;">404 - Page Not Found</h1>
                <p>The page you're looking for doesn't exist.</p>
                <a href="/" style="color: blue;">Go Back Home</a>
            </body>
            </html>
        `);
});

app.use((err, req, res, next) => {
    console.error(`[SERVER ERROR] ${err.message}`);

    res.status(500)
       .set("Content-Type", "text/html")
       .send(`
            <html>
            <head><title>500 - Server Error</title></head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h1 style="color: red;">500 - Internal Server Error</h1>
                <p>Something went wrong. Please try again later.</p>
                <a href="/" style="color: blue;">Go Back Home</a>
            </body>
            </html>
        `);
});

app.listen(PORT, () => {
    console.info(`[SERVER] Running on port ${PORT}`);
});
