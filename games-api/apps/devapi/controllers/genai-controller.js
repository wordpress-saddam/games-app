const requestApiExceptions = require('../../../config/api-exceptions').request;

//const openAIV2Helper = require('../../../core_libs/helpers/genai/openai-games-helper.js');
const vertexAIV2Helper = require('../../../core_libs/helpers/genai/vertexAI-games-helper.js');

module.exports = {
    // generateOpenAiGames: async (req, res) => {
    //     try {
    //         if (!req.body || !req.body.content || !req.body.headline || !req.body.game_types) {
    //             return global.sendErrorResponse(res, false, 400, 1001, "Invalid parameter");
    //         }
    //         const response = await openAIV2Helper.generateGames(req.body);
    //         if (!response || !response.status) {
    //             return global.sendErrorResponse(res, false, 200, 500, response.message);
    //         }
    //         return global.sendSuccessResponse(res, false, 200, response)
    //     } catch (err) {
    //         global.sendErrorResponse(res, false, 500, requestApiExceptions.serverError.code, requestApiExceptions.serverError.msg);
    //     }
    // },
    generateVertexAiGames: async (req, res) => {
        try {
            if (!req.body || !req.body.content || !req.body.headline) {
                return global.sendErrorResponse(res, false, 400, 1001, "Invalid parameter");
            }
            const response = await vertexAIV2Helper.generateGames(req.body);
            if (!response || !response.status) {
                return global.sendErrorResponse(res, false, 200,  500, response.message);
            }
            return global.sendSuccessResponse(res, false, 200, response)
        } catch (err) {
            global.sendErrorResponse(res, false, 500, requestApiExceptions.serverError.code, requestApiExceptions.serverError.msg);
        }
    },
}