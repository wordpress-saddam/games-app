const router = require('express').Router();
const configController = require('../../controllers/config-controller');
const sendResponse = require('../../middlewares/response');

const {
    verifyToken
} = require('../../middlewares/verify-token');

const {
    verifyQueryString,
    respondFromRedisCache
} = require('../../middlewares/utils');

const {
    isProjectSuspended    
} = require('../../middlewares/is-project-suspended')


router
    .get('/allappconfig/token/:token',verifyToken,  respondFromRedisCache, verifyQueryString, configController.getAllV2AppConfigData, sendResponse)
    .get('/appgeneralconfig/token/:token',verifyToken, respondFromRedisCache,  verifyQueryString, configController.getAppGeneralConfigData, sendResponse)
module.exports = router;