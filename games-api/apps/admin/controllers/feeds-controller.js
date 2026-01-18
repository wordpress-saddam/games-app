const FeedsModel = require('../../../core_libs/models/mongodb/db-feeds');
const FeedSettingsModel = require('../../../core_libs/models/mongodb/db-feed-settings');
const AdminUsersModel = require('../../../core_libs/models/mongodb/db-admin-users');
const { validateFeedUrlFormat, validateRSSFormat } = require('../helpers/feed-validator');
const apiExceptions = require('../../../config/api-exceptions').admin;
const mongoose = require('../../../core_libs/utils/database-connection').Mongoose;

const createFeed = async (req, res) => {
    try {
        const { name, url, description } = req.body;
        const userId = req.user?.userId || req.user?._id;

        console.log('Create feed request:', { name, url, description, userId, user: req.user });

        // Validate required fields - trim whitespace and check for empty strings
        const trimmedName = name ? String(name).trim() : '';
        const trimmedUrl = url ? String(url).trim() : '';

        if (!trimmedName || !trimmedUrl) {
            console.log('Validation failed: missing name or url', { trimmedName, trimmedUrl });
            return global.sendErrorResponse(res, false, 200, apiExceptions.feedValidationFailed.code, 'name_and_url_are_required');
        }

        // Validate userId exists and convert to ObjectId
        if (!userId) {
            console.log('Validation failed: missing userId', { user: req.user });
            return global.sendErrorResponse(res, false, 200, apiExceptions.feedValidationFailed.code, 'user_id_is_required');
        }

        // Convert userId to ObjectId if it's a string
        let userIdObjectId;
        try {
            userIdObjectId = mongoose.Types.ObjectId.isValid(userId) 
                ? (userId instanceof mongoose.Types.ObjectId ? userId : new mongoose.Types.ObjectId(userId))
                : null;
            if (!userIdObjectId) {
                console.log('Validation failed: invalid userId format', { userId });
                return global.sendErrorResponse(res, false, 200, apiExceptions.feedValidationFailed.code, 'invalid_user_id_format');
            }
        } catch (err) {
            console.log('Error converting userId to ObjectId:', err);
            return global.sendErrorResponse(res, false, 200, apiExceptions.feedValidationFailed.code, 'invalid_user_id_format');
        }

        // Verify user exists
        const user = await AdminUsersModel.loadOneByFilters({ _id: userIdObjectId });
        if (!user) {
            console.log('Validation failed: user not found', { userId: userIdObjectId });
            return global.sendErrorResponse(res, false, 200, apiExceptions.feedValidationFailed.code, 'user_not_found');
        }

        // Check if feed URL already exists
        const existingFeed = await FeedsModel.loadOneByFilters({ url: trimmedUrl });
        if (existingFeed) {
            console.log('Validation failed: feed URL already exists', { url: trimmedUrl });
            return global.sendErrorResponse(res, false, 200, apiExceptions.feedAlreadyExists.code, apiExceptions.feedAlreadyExists.msg);
        }

        // Validate URL format
        const urlValidation = validateFeedUrlFormat(trimmedUrl);
        if (!urlValidation.isValid) {
            console.log('URL validation failed:', urlValidation.error);
            // Convert error message to translation key
            const errorKey = urlValidation.error 
                ? urlValidation.error.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_')
                : 'invalid_feed_url_format';
            return global.sendErrorResponse(res, false, 200, apiExceptions.invalidFeedUrl.code, errorKey);
        }

        // Test feed accessibility and format
        console.log('Validating RSS format for URL:', trimmedUrl);
        const feedValidation = await validateRSSFormat(trimmedUrl);
        if (!feedValidation.isValid) {
            console.log('RSS validation failed:', feedValidation.error);
            // Convert error message to translation key
            const errorKey = feedValidation.error 
                ? feedValidation.error.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_')
                : 'invalid_rss_feed_format';
            return global.sendErrorResponse(res, false, 200, apiExceptions.invalidFeedFormat.code, errorKey);
        }

        console.log('RSS validation passed, creating feed...');

        // Create feed
        const feedData = {
            name: trimmedName,
            url: trimmedUrl,
            description: description ? String(description).trim() : '',
            created_by: userIdObjectId,
            status: 1,
            last_fetch_status: 'pending'
        };

        console.log('Feed data to create:', { 
            name: feedData.name,
            url: feedData.url,
            description: feedData.description,
            created_by: feedData.created_by,
            created_by_type: typeof feedData.created_by,
            created_by_isObjectId: feedData.created_by instanceof mongoose.Types.ObjectId,
            status: feedData.status,
            last_fetch_status: feedData.last_fetch_status
        });

        const feed = await FeedsModel.createFeed(feedData);

        if (!feed) {
            console.log('Feed creation returned null');
            return global.sendErrorResponse(res, false, 200, apiExceptions.feedCreationFailed.code, apiExceptions.feedCreationFailed.msg);
        }

        console.log('Feed created successfully:', feed.id);

        // Initialize feed settings with defaults
        const config = require('../../../config/config').apps.admin;
        await FeedSettingsModel.createOrUpdateSettings(feed.id, {
            import_interval_minutes: config.defaultImportInterval || 60,
            auto_import: true,
            max_feedarticles_per_import: 50
        });

        return global.sendSuccessResponse(res, false, 200, feed);
    } catch (err) {
        console.log('Create feed error:', err);
        console.log('Error details:', {
            code: err.code,
            message: err.message,
            errorData: err.errorData,
            errors: err.errors,
            stack: err.stack
        });
        
        // Handle model validation errors (error code 2702)
        if (err.code === 2702) {
            // Convert validation errors to translation keys
            const errorMessage = err.errorData && err.errorData.length > 0 
                ? err.errorData.map(e => {
                    // Convert field name and message to snake_case translation key
                    const fieldKey = e.field ? e.field.toLowerCase().replace(/\s+/g, '_') : 'field';
                    const messageKey = e.message ? e.message.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_') : 'validation_error';
                    return `${fieldKey}_${messageKey}`;
                }).join(', ')
                : 'feed_validation_failed';
            return global.sendErrorResponse(res, false, 200, apiExceptions.feedValidationFailed.code, errorMessage);
        }
        if (err.code) {
            // Convert error message to translation key
            const errorKey = err.message 
                ? err.message.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_')
                : 'unknown_error';
            return global.sendErrorResponse(res, false, 200, err.code, errorKey);
        }
        if (err.code === 11000) { // MongoDB duplicate key error
            return global.sendErrorResponse(res, false, 200, apiExceptions.feedAlreadyExists.code, apiExceptions.feedAlreadyExists.msg);
        }
        return global.sendErrorResponse(res, false, 200, apiExceptions.feedCreationFailed.code, apiExceptions.feedCreationFailed.msg);
    }
};

const getAllFeeds = async (req, res) => {
    try {
        const { offset, limit } = req.pagination;
        const filters = {};

        // Optional status filter
        if (req.query.status !== undefined) {
            filters.status = parseInt(req.query.status);
        }

        const ordering = { createdAt: -1 };
        const feeds = await FeedsModel.loadAllFeeds(filters, ordering, offset, limit);

        return global.sendSuccessResponse(res, false, 200, {
            feeds,
            pagination: {
                offset,
                limit,
                count: feeds.length
            }
        });
    } catch (err) {
        console.log('Get all feeds error:', err);
        return global.sendErrorResponse(res, false, 200, apiExceptions.feedFetchFailed.code, apiExceptions.feedFetchFailed.msg);
    }
};

const getFeedById = async (req, res) => {
    try {
        const { id } = req.params;
        const feed = await FeedsModel.loadOneByFilters({ _id: id });

        if (!feed) {
            return global.sendErrorResponse(res, false, 200, apiExceptions.feedNotFound.code, apiExceptions.feedNotFound.msg);
        }

        return global.sendSuccessResponse(res, false, 200, feed);
    } catch (err) {
        console.log('Get feed by id error:', err);
        return global.sendErrorResponse(res, false, 200, apiExceptions.feedNotFound.code, apiExceptions.feedNotFound.msg);
    }
};

const updateFeed = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, status } = req.body;

        const mongoose = require('../../../core_libs/utils/database-connection').Mongoose;
        const FeedModel = mongoose.model('feeds');

        const feed = await FeedModel.findById(id);

        if (!feed) {
            return global.sendErrorResponse(res, false, 200, apiExceptions.feedNotFound.code, apiExceptions.feedNotFound.msg);
        }

        if (name !== undefined) feed.name = name;
        if (description !== undefined) feed.description = description;
        if (status !== undefined) feed.status = status;

        const updatedFeed = await feed.save();

        if (!updatedFeed) {
            return global.sendErrorResponse(res, false, 200, apiExceptions.feedUpdateFailed.code, apiExceptions.feedUpdateFailed.msg);
        }

        return global.sendSuccessResponse(res, false, 200, updatedFeed.getPublicObject());
    } catch (err) {
        console.log('Update feed error:', err);
        return global.sendErrorResponse(res, false, 200, apiExceptions.feedUpdateFailed.code, apiExceptions.feedUpdateFailed.msg);
    }
};

const deleteFeed = async (req, res) => {
    try {
        const { id } = req.params;

        const feed = await FeedsModel.updateFeedStatus(id, 0);

        if (!feed) {
            return global.sendErrorResponse(res, false, 200, apiExceptions.feedNotFound.code, apiExceptions.feedNotFound.msg);
        }

        return global.sendSuccessResponse(res, false, 200, { message: 'feed_deleted_successfully' });
    } catch (err) {
        console.log('Delete feed error:', err);
        return global.sendErrorResponse(res, false, 200, apiExceptions.feedDeleteFailed.code, apiExceptions.feedDeleteFailed.msg);
    }
};

const restoreFeed = async (req, res) => {
    try {
        const { id } = req.params;

        const feed = await FeedsModel.updateFeedStatus(id, 1);

        if (!feed) {
            return global.sendErrorResponse(res, false, 200, apiExceptions.feedNotFound.code, apiExceptions.feedNotFound.msg);
        }

        return global.sendSuccessResponse(res, false, 200, { message: 'feed_restored_successfully' });
    } catch (err) {
        console.log('Restore feed error:', err);
        return global.sendErrorResponse(res, false, 200, apiExceptions.feedUpdateFailed.code, apiExceptions.feedUpdateFailed.msg);
    }
};

const testFeed = async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return global.sendErrorResponse(res, false, 200, apiExceptions.validationFailed.code, 'url_is_required');
        }

        // Validate URL format
        const urlValidation = validateFeedUrlFormat(url);
        if (!urlValidation.isValid) {
            // Convert error message to translation key
            const errorKey = urlValidation.error 
                ? urlValidation.error.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_')
                : 'invalid_feed_url_format';
            return global.sendErrorResponse(res, false, 200, apiExceptions.invalidFeedUrl.code, errorKey);
        }

        // Test feed
        const feedValidation = await validateRSSFormat(url);

        if (feedValidation.isValid) {
            return global.sendSuccessResponse(res, false, 200, {
                valid: true,
                feed: {
                    title: feedValidation.feed.title,
                    description: feedValidation.feed.description,
                    itemCount: feedValidation.feed.items ? feedValidation.feed.items.length : 0
                }
            });
        } else {
            // Convert error message to translation key
            const errorKey = feedValidation.error 
                ? feedValidation.error.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_')
                : 'invalid_rss_feed_format';
            return global.sendSuccessResponse(res, false, 200, {
                valid: false,
                error: errorKey
            });
        }
    } catch (err) {
        console.log('Test feed error:', err);
        // Convert error message to translation key
        const errorKey = err.message 
            ? err.message.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_')
            : 'feed_test_failed';
        return global.sendErrorResponse(res, false, 200, apiExceptions.feedTestFailed.code, errorKey);
    }
};

module.exports = {
    createFeed,
    getAllFeeds,
    getFeedById,
    updateFeed,
    deleteFeed,
    restoreFeed,
    testFeed
};

