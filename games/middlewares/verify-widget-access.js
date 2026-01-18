const axios = require('axios');
const hostConfig = require('../config/host-config.json');
const config = require('../config/config');

const devApiUrl = config?.apps?.devapi?.url ?? "http://localhost:5002";

const verifyAccess = async (req, res, next) => {
    try {
        const { hostname, url } = req;

        console.log(`[INFO] Hostname: ${hostname}, URL: ${url}`);

        if (!hostname) {
            return sendError(res, 400, "Bad Request: Missing Hostname");
        }

        if (!hostConfig[hostname]) {
            return sendError(res, 403, "Forbidden: Unauthorized Host");
        }

        console.log(`[INFO] Hostname: ${hostname}, URL: ${url}`);



        const reqData = {
            access_key: config?.apps?.devapi?.accessKey ?? "",
            secret_key: config?.apps?.devapi?.secretKey ?? "",
            project_handle: hostConfig[hostname]?.project_handle,
            project_platform: config?.apps?.devapi?.projectPlatform ?? "",
        };

        try {
            console.log(`[INFO] Sending POST request to ${devApiUrl}/v1/auth/host`);
            const { data } = await axios.post(`${devApiUrl}/v1/auth/host`, reqData);

            if (data?.status && data?.data?.token) {

                req.authToken = data.data.token;
                return next();
            } else {
                console.error(`[ERROR] Invalid Authentication: ${(data?.data)}`);
                return sendError(res, 403, "Forbidden: Invalid Authentication");
            }
        } catch (apiError) {
            console.error(`[ERROR] API Error: ${apiError.message}`);
            return sendError(res, 500, "Internal Server Error: Auth API Failure");
        }

    } catch (error) {
        console.error(`[ERROR] Unexpected Middleware Error: ${error.message}`);
        return sendError(res, 500, "Internal Server Error");
    }
};

const sendError = (res, statusCode, message) => {
    res.status(statusCode)
        .set("Content-Type", "text/html")
        .send(`
            <html>
            <head><title>${statusCode} - Error</title></head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h1 style="color: red;">${statusCode} - ${message.split(":")[0]}</h1>
                <p>${message}</p>
               <!-- <a href="/" style="color: blue;">Go Back Home</a> -->
            </body>
            </html>
        `);
};

module.exports = verifyAccess;
