const GameSettingsModel = require('../../../core_libs/models/mongodb/db-game-settings');
const FeedsModel = require('../../../core_libs/models/mongodb/db-feeds');
const apiExceptions = require('../../../config/api-exceptions').admin;

const createOrUpdateSettings = async (req, res) => {
    try {
        const { feed_id, enabled, language, games, access_key, secret_key } = req.body;

        if (!feed_id) {
            return global.sendErrorResponse(res, false, 200, apiExceptions.validationFailed.code, 'Feed ID is required');
        }

        // Validate feed exists
        const feed = await FeedsModel.loadOneByFilters({ _id: feed_id });
        if (!feed) {
            return global.sendErrorResponse(res, false, 200, apiExceptions.feedNotFound.code, apiExceptions.feedNotFound.msg);
        }

        // Validate language
        if (language && !['English', 'Arabic'].includes(language)) {
            return global.sendErrorResponse(res, false, 200, apiExceptions.validationFailed.code, 'Invalid language. Must be English or Arabic');
        }

        // Validate games
        if (games && Array.isArray(games)) {
            const validGames = ['headline_scramble', 'quiz', 'hangman', 'crossword'];
            const invalidGames = games.filter(game => !validGames.includes(game));
            if (invalidGames.length > 0) {
                return global.sendErrorResponse(res, false, 200, apiExceptions.validationFailed.code, `Invalid games: ${invalidGames.join(', ')}`);
            }
        }

        const settingsData = {
            enabled: enabled !== undefined ? enabled : false,
            language: language || 'Arabic',
            games: games || [],
            access_key: access_key || '',
            secret_key: secret_key || ''
        };

        const settings = await GameSettingsModel.createOrUpdateSettings(feed_id, settingsData);

        if (!settings) {
            return global.sendErrorResponse(res, false, 200, apiExceptions.settingsUpdateFailed.code, apiExceptions.settingsUpdateFailed.msg);
        }

        return global.sendSuccessResponse(res, false, 200, settings);
    } catch (err) {
        console.log('Create/Update game settings error:', err);
        if (err.code) {
            return global.sendErrorResponse(res, false, 200, err.code, err.message);
        }
        return global.sendErrorResponse(res, false, 200, apiExceptions.settingsUpdateFailed.code, apiExceptions.settingsUpdateFailed.msg);
    }
};

const getSettings = async (req, res) => {
    try {
        const { feedId } = req.params;

        if (!feedId) {
            return global.sendErrorResponse(res, false, 200, apiExceptions.validationFailed.code, 'Feed ID is required');
        }

        const settings = await GameSettingsModel.getSettingsByFeedId(feedId);

        if (!settings) {
            // Return default settings if not found
            return global.sendSuccessResponse(res, false, 200, {
                feed_id: feedId,
                enabled: false,
                language: 'Arabic',
                games: []
            });
        }

        return global.sendSuccessResponse(res, false, 200, settings);
    } catch (err) {
        console.log('Get game settings error:', err);
        return global.sendErrorResponse(res, false, 200, apiExceptions.settingsFetchFailed.code, apiExceptions.settingsFetchFailed.msg);
    }
};

const getAllSettings = async (req, res) => {
    try {
        const { offset, limit } = req.pagination;
        const filters = {};

        // Optional filter by enabled status
        if (req.query.enabled !== undefined) {
            filters.enabled = req.query.enabled === 'true';
        }

        const ordering = { createdAt: -1 };
        const settings = await GameSettingsModel.getAllSettings(filters, ordering, offset, limit);

        return global.sendSuccessResponse(res, false, 200, {
            settings,
            pagination: {
                offset,
                limit,
                count: settings.length
            }
        });
    } catch (err) {
        console.log('Get all game settings error:', err);
        return global.sendErrorResponse(res, false, 200, apiExceptions.settingsFetchFailed.code, apiExceptions.settingsFetchFailed.msg);
    }
};

const deleteSettings = async (req, res) => {
    try {
        const { feedId } = req.params;

        if (!feedId) {
            return global.sendErrorResponse(res, false, 200, apiExceptions.validationFailed.code, 'Feed ID is required');
        }

        const deleted = await GameSettingsModel.deleteSettings(feedId);

        if (!deleted) {
            return global.sendErrorResponse(res, false, 200, apiExceptions.settingsNotFound.code, apiExceptions.settingsNotFound.msg);
        }

        return global.sendSuccessResponse(res, false, 200, { message: 'Game settings deleted successfully' });
    } catch (err) {
        console.log('Delete game settings error:', err);
        return global.sendErrorResponse(res, false, 200, apiExceptions.settingsDeleteFailed.code, apiExceptions.settingsDeleteFailed.msg);
    }
};

module.exports = {
    createOrUpdateSettings,
    getSettings,
    getAllSettings,
    deleteSettings
};

