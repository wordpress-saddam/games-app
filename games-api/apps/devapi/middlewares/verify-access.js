const authHelper = require('../../admin/helpers/auth-helper');

const verifyAccess = async (req, res, next) => {
    if (req.header('Access-Key') && req.header('Secret-Key')) {
        console.log("req.header",req.header('Access-Key'));
        var valid = await authHelper.validatePubKeys(req.header('Access-Key'), req.header('Secret-Key'));
        console.log("after valid");
        if (valid) {
            req.feedId = valid;
            next()
        } else {
            global.sendErrorResponse(res, false, 403, 403, "Invalid Auth credentials, Your project might got suspended or deactivated for more information contact SORTD Team");
        }
    } else {
        global.sendErrorResponse(res, false, 403, 403, "Missing Auth credentials");
    }
}

module.exports = verifyAccess;