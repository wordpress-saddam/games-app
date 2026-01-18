const md5 = require('md5');
const redisKeyPrefix = require('../../../config/config').redis.devapiKeyPrefix;
const {
    setApiCache
} = require('../../../core_libs/services/redis/api-cache-helper');

const {
    pushApiCacheKey
} = require('../../../core_libs/helpers/cache_helper/cache-helper')

const sendResponse = async (req, res) => {
    try {
        const {
            responseCode,
            status,
            data
        } = req;
        let cacheResponse = {
            responseCode,
            status,
            data
        }
        if (req.newHeaders) {
            res.set({
                ...req.newHeaders
            })
            cacheResponse.headers = {
                ...req.newHeaders
            }
        }
        res.status(responseCode).json({
            status,
            data
        })
        console.log("responses.js : ", req.serviceStackId)

        const redisKey = redisKeyPrefix + md5(req.originalUrl);
        await setApiCache(redisKey, JSON.stringify(cacheResponse),req.serviceStackId);

        if(req.apiType && req.cacheListId && redisKey){
            pushApiCacheKey(req.cacheListId, redisKey, req.apiType, req.serviceStackId)
        }

        if(req.apiType && req.categoryCache && redisKey){
            console.log("setting category cache");
            pushApiCacheKey(req.categoryCache, redisKey, 'category',req.serviceStackId)
        }
    } catch (err) {
        console.log(err)
    }
}

module.exports = sendResponse