const GameSettingsModel = require("../../../core_libs/models/mongodb/db-game-settings");
/**
 * Helper------This helper is used for Create Publisher

/**
 * Helper------This helper is used for validatePubKeys
 * @param {any} accessKey accessKey
 * @param {any} secretKey secretKey
 * @returns {any} feed_id/false
 */
const validatePubKeys = async (accessKey, secretKey) => {
    try {
        const keysValidated = await GameSettingsModel.loadOneByFilters({
            access_key: accessKey,
            secret_key: secretKey,
            enabled: true,
        });

        console.log(keysValidated);

        if (keysValidated) {
            // return keysValidated;
            return keysValidated.feed_id;
        } else {
            return false;
        }
    } catch (err) {
        throw err;
    }
};
module.exports = {
    validatePubKeys,
};