const {
    verifyCredentials
} = require("../helpers/auth-helper");


const apiExceptions = require('../../../config/api-exceptions').devapi;

const DevCredentialsModel = require('../../../core_libs/models/mongodb/db-dev-credentials');
const ProjectDistributionModel = require('../../../core_libs/models/mongodb/db-project-distribution');
const ProjectAuthTokenModel = require('../../../core_libs/models/mongodb/db-project-auth-tokens');
const ProjectDomainsModel = require('../../../core_libs/models/mongodb/db-project-domains');
const ProjectModel = require('../../../core_libs/models/mongodb/db-projects');
const { authenticateJWT } = require('../middlewares/jwt-auth');

const getAuthToken = async (req, res) => {
    try {
        console.log("token request");
        const {
            access_key,
            secret_key,
            project_handle,
            project_platform
        } = req.body;

        console.log(req.body)

        const developer_id = await DevCredentialsModel.verifyCredentials(access_key, secret_key, project_platform);

        if (!developer_id) {
            console.log("Developer id not found")
            return global.sendErrorResponse(res, false, 200, apiExceptions.invalidAuthCred.code, apiExceptions.invalidAuthCred.msg);
        }

        const projectDistribution = await ProjectDistributionModel.getProjectId(project_handle, project_platform);
        console.log(projectDistribution,"projectDistribution")
        if (!projectDistribution) {

            return global.sendErrorResponse(res, false, 200, apiExceptions.invalidAuthCred.code, apiExceptions.invalidAuthCred.msg);
        }
        const {
            project_id,
            distribution_id
        } = projectDistribution;

        console.log("distribution_id", distribution_id)

        const {
            status,
            slug,
            service_stack_id
        } = await ProjectModel.findById(project_id).select("status slug service_stack_id");

        if (status !== 1) {
            return global.sendErrorResponse(res, false, 200, apiExceptions.invalidAuthCred.code, apiExceptions.invalidAuthCred.msg);
        }

        const {
            token,
            ttl
        } = await ProjectAuthTokenModel.generateNewToken(project_id, distribution_id, developer_id);

        return global.sendSuccessResponse(res, false, 200, {
            token,
            ttl
        });
    } catch (err) {
        console.log(err)
        return global.sendErrorResponse(res, false, 500, 500, "Internal server error");
    }
}

/**
 * Verify JWT token and return user info
 * This endpoint is used by the frontend after receiving the token
 */
const verifyAuthToken = async (req, res) => {
    try {
        // User is already attached by authenticateJWT middleware
        const user = req.user;
        
        // Get the latest auth token from database
        const GamesUser = require('../../../core_libs/models/mongodb/db-games-users');
        const dbUser = await GamesUser.findActiveById(user._id.toString());
        
        return global.sendSuccessResponse(res, false, 200, {
            userId: user._id.toString(),
            email: user.email,
            name: user.name,
            googleId: user.googleId || null,
            keycloakId: user.keycloakId || null,
            auth_token: dbUser?.auth_token || null
        });
    } catch (err) {
        console.error('Error in verifyAuthToken:', err);
        return global.sendErrorResponse(res, false, 500, 500, "Internal server error");
    }
}

module.exports = {
    getAuthToken,
    verifyAuthToken
};
