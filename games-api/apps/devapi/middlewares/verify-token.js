const ProjectAuthTokens = require('../../../core_libs/models/mongodb/db-project-auth-tokens');
const apiExceptions = require('../../../config/api-exceptions').devapi;
const ProjectsModel = require('../../../core_libs/models/mongodb/db-projects');
const redisHelper =  require('../../../core_libs/services/redis/redis-helper');
const ProjectDomainsModel = require('../../../core_libs/models/mongodb/db-project-domains')
const config = require('../../../config/config');

const verifyToken = async (req, res, next) => {
    const projectId = config.projectId;
    const serviceStackId = config.serviceStackId;
    try {
        const {
            token
        } = req.params;

        if (!token) {
            return global.sendErrorResponse(res, false, 200, apiExceptions.invalidToken.code, apiExceptions.invalidToken.msg)
        }
        let tokenData = await redisHelper.getElementValue(`DA:TOKEN:${token}`);

        if(tokenData){
            tokenData = JSON.parse(tokenData);
            console.log("Token verified from redis", tokenData)

            // req.project_id = tokenData.project_id;
            req.project_id = projectId;
            req.distribution_id = tokenData.distribution_id;
            // req.serviceStackId = tokenData.serviceStackId;
            req.serviceStackId = serviceStackId;
            req.publicHost = tokenData.public_host;
            req.publisherId = tokenData.publisherId;
            req.demoHost = tokenData.demoHost;
            return next();
        }

        const validToken = await ProjectAuthTokens.verifyToken(token);

        if (validToken.err) {
            return global.sendErrorResponse(res, false, 200, apiExceptions.invalidToken.code, apiExceptions.invalidToken.msg)
        }


        if (validToken.isValid) {
            const projectDomains = await ProjectDomainsModel.findOne({
                project_id: validToken.project_id._id
            },"public_host demo_host")

            // req.project_id = validToken.project_id._id;
            req.project_id = projectId;
            req.distribution_id =  validToken.distribution_id;
            // req.serviceStackId = validToken.project_id.service_stack_id;
            req.serviceStackId = serviceStackId;
            req.publicHost = projectDomains.public_host;
            req.publisherId = validToken.project_id.publishers_id;
            req.demoHost = projectDomains.demo_host

            tokenData = {
                // project_id: validToken.project_id._id,
                project_id: projectId,
                distribution_id: validToken.distribution_id,
                // serviceStackId: validToken.project_id.service_stack_id,
                serviceStackId: serviceStackId,
                public_host: projectDomains.public_host,
                publisherId: validToken.project_id.publishers_id,
                demoHost: projectDomains.demo_host
            }
            tokenData = JSON.stringify(tokenData);
            await redisHelper.setElementValue(`DA:TOKEN:${token}`, tokenData);
            next();
        }
    } catch (err) {
        console.log(err)
    }
}

module.exports = {
    verifyToken
};