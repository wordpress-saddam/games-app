const { sendSuccessResponse, sendErrorResponse } = require('../../../core_libs/utils/responses');

const sendResponse = async (req, res) => {
    try {
        const {
            responseCode,
            status,
            data
        } = req;
        
        if (status) {
            return global.sendSuccessResponse(res, false, responseCode || 200, data);
        } else {
            return global.sendErrorResponse(res, false, responseCode || 200, data.errorCode, data.message);
        }
    } catch (err) {
        console.log(err);
        return global.sendErrorResponse(res, false, 500, 500, 'Internal server error');
    }
};

module.exports = sendResponse;

