const md5 = require('md5');
const redisKeyPrefix = require('../../../config/config').redis.devapiKeyPrefix;
const {
    getApiCache,
    setApiCache
} = require('../../../core_libs/services/redis/api-cache-helper');

const verifyQueryString = (req, res, next) => {
    if (req.query) {
        // let entries = Object.entries(req.query)
        // for (let i = 1; i < entries.length; i++) {
        //     if (entries[i - 1][0] >= entries[i][0]) {
        //         return res.send("invalid query string");
        //     }
        // }
    }
    next();
}

const respondFromRedisCache = async (req, res, next) => {

    console.log("Starting respond from redis cache");

    const key = redisKeyPrefix + md5(req.originalUrl);
    console.log("Key for redis cache",key ,"service stack id", req.serviceStackId)

    const redisResponse = await getApiCache(key,req.serviceStackId);

    if (redisResponse) {
        console.log("responding from redis as response ","")

        const parsedRedisResponse = JSON.parse(redisResponse);
        const headers = parsedRedisResponse.headers || false;
        console.log("responding from redis")
        return global.sendSuccessResponse(res, headers, parsedRedisResponse.responseCode, parsedRedisResponse.data);
    }
    console.log("Response not found in redis moving to next Middleware")
    next();
}

module.exports = {
    verifyQueryString,
    respondFromRedisCache
}