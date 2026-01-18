const FeedSettingsModel = require('../../../core_libs/models/mongodb/db-feed-settings');
const apiExceptions = require('../../../config/api-exceptions').admin;

const getSettings = async (req, res) => {
    try {
        const { feedId } = req.query;

        if (feedId) {
            const settings = await FeedSettingsModel.getSettingsByFeedId(feedId);
            return global.sendSuccessResponse(res, false, 200, settings);
        } else {
            const settings = await FeedSettingsModel.getGlobalSettings();
            return global.sendSuccessResponse(res, false, 200, settings);
        }
    } catch (err) {
        console.log('Get settings error:', err);
        return global.sendErrorResponse(res, false, 200, apiExceptions.settingsFetchFailed.code, apiExceptions.settingsFetchFailed.msg);
    }
};

const updateSettings = async (req, res) => {
    try {
        const { feedId } = req.body;
        const { import_interval_minutes, auto_import, max_feedarticles_per_import } = req.body;

        if (!feedId) {
            return global.sendErrorResponse(res, false, 200, apiExceptions.validationFailed.code, apiExceptions.validationFailed.msg);
        }

        // Validate interval (minimum 5 minutes)
        if (import_interval_minutes !== undefined && import_interval_minutes < 5) {
            return global.sendErrorResponse(res, false, 200, apiExceptions.invalidInterval.code, 'Import interval must be at least 5 minutes');
        }

        const settingsData = {};
        if (import_interval_minutes !== undefined) settingsData.import_interval_minutes = import_interval_minutes;
        if (auto_import !== undefined) settingsData.auto_import = auto_import;
        if (max_feedarticles_per_import !== undefined) settingsData.max_feedarticles_per_import = max_feedarticles_per_import;

        const settings = await FeedSettingsModel.createOrUpdateSettings(feedId, settingsData);

        if (!settings) {
            return global.sendErrorResponse(res, false, 200, apiExceptions.settingsUpdateFailed.code, apiExceptions.settingsUpdateFailed.msg);
        }

        return global.sendSuccessResponse(res, false, 200, settings);
    } catch (err) {
        console.log('Update settings error:', err);
        if (err.code) {
            return global.sendErrorResponse(res, false, 200, err.code, err.message);
        }
        return global.sendErrorResponse(res, false, 200, apiExceptions.settingsUpdateFailed.code, apiExceptions.settingsUpdateFailed.msg);
    }
};

const getGlobalSettings = async (req, res) => {
    try {
        const settings = await FeedSettingsModel.getGlobalSettings();
        return global.sendSuccessResponse(res, false, 200, settings);
    } catch (err) {
        console.log('Get global settings error:', err);
        return global.sendErrorResponse(res, false, 200, apiExceptions.settingsFetchFailed.code, apiExceptions.settingsFetchFailed.msg);
    }
};

module.exports = {
    getSettings,
    updateSettings,
    getGlobalSettings
};

