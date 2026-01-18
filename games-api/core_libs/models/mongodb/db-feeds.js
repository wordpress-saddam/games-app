const mongoose = require('../../utils/database-connection').Mongoose;
const errorCodes = require('../../../config/error-codes').feeds;

const feedsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String
    },
    status: {
        type: Number,
        enum: [0, 1], // 0=inactive, 1=active
        default: 1
    },
    last_fetched: {
        type: Date
    },
    last_fetch_status: {
        type: String,
        enum: ['success', 'failed', 'pending'],
        default: 'pending'
    },
    last_fetch_error: {
        type: String
    },
    total_feedarticles: {
        type: Number,
        default: 0
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'adminusers',
        required: true
    }
}, {
    timestamps: true
});

feedsSchema.methods.getPublicObject = function () {
    return {
        id: this._id,
        name: this.name,
        url: this.url,
        description: this.description,
        status: this.status,
        last_fetched: this.last_fetched,
        last_fetch_status: this.last_fetch_status,
        last_fetch_error: this.last_fetch_error,
        total_feedarticles: this.total_feedarticles,
        created_by: this.created_by,
        created_at: this.createdAt,
        updated_at: this.updatedAt
    };
};

feedsSchema.statics.createFeed = async function (feedData) {
    try {
        const feed = new FeedsModel(feedData);
        const savedFeed = await feed.save();
        return savedFeed ? savedFeed.getPublicObject() : null;
    } catch (err) {
        console.log('FeedsModel.createFeed error:', err);
        console.log('Error details:', {
            name: err.name,
            message: err.message,
            errors: err.errors,
            code: err.code,
            keyPattern: err.keyPattern,
            keyValue: err.keyValue
        });
        
        var errorData = [];
        if (err.errors) {
            for (item in err.errors) {
                errorData.push({
                    field: err.errors[item].path,
                    message: err.errors[item].message
                });
            }
        }
        
        // Handle duplicate key error (MongoDB error code 11000)
        if (err.code === 11000) {
            const error = {
                code: 11000,
                message: 'Feed with this URL already exists',
                errorData: errorData
            };
            throw error;
        }
        
        // If no specific error data but there's an error message, include it
        if (errorData.length === 0 && err.message) {
            errorData.push({
                field: 'general',
                message: err.message
            });
        }
        
        const error = {
            code: errorCodes.validationFailed,
            message: err.message || 'Validation Failed',
            errorData: errorData
        };
        throw error;
    }
};

feedsSchema.statics.loadAllFeeds = async function (filters = {}, ordering, offset, limit) {
    try {
        let feedQuery = this.find(filters).populate('created_by', 'name email');

        if (ordering) {
            feedQuery.sort(ordering);
        }

        if (offset) {
            feedQuery.skip(offset);
        }

        if (limit) {
            feedQuery.limit(limit);
        }

        const feeds = await feedQuery.exec();
        let allFeeds = [];

        if (feeds.length && feeds.length > 0) {
            feeds.forEach(function (feedDetails) {
                allFeeds.push(feedDetails.getPublicObject());
            });
        }
        return allFeeds;
    } catch (error) {
        throw error;
    }
};

feedsSchema.statics.loadOneByFilters = async function (filters = {}) {
    try {
        const feed = await this.findOne(filters).populate('created_by', 'name email').exec();
        return feed ? feed.getPublicObject() : null;
    } catch (err) {
        console.log(err);
        throw err;
    }
};

feedsSchema.statics.updateFeedStatus = async function (feedId, status) {
    try {
        const feed = await this.findByIdAndUpdate(feedId, { status }, { new: true });
        return feed ? feed.getPublicObject() : null;
    } catch (error) {
        throw error;
    }
};

feedsSchema.statics.updateLastFetch = async function (feedId, status, error = null) {
    try {
        const updateData = {
            last_fetched: new Date(),
            last_fetch_status: status
        };
        if (error) {
            updateData.last_fetch_error = error;
        }
        const feed = await this.findByIdAndUpdate(feedId, updateData, { new: true });
        return feed ? feed.getPublicObject() : null;
    } catch (err) {
        throw err;
    }
};

feedsSchema.statics.incrementFeedArticleCount = async function (feedId, count = 1) {
    try {
        const feed = await this.findByIdAndUpdate(
            feedId,
            { $inc: { total_feedarticles: count } },
            { new: true }
        );
        return feed ? feed.getPublicObject() : null;
    } catch (err) {
        throw err;
    }
};

module.exports = FeedsModel = mongoose.model('feeds', feedsSchema);

