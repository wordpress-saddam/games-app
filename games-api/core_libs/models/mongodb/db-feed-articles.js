const mongoose = require('../../utils/database-connection').Mongoose;
const errorCodes = require('../../../config/error-codes').feedArticles;

const feedArticlesSchema = new mongoose.Schema({
    feed_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'feeds',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    content: {
        type: String
    },
    link: {
        type: String,
        required: true,
        unique: true
    },
    guid: {
        type: String,
        unique: true,
        sparse: true
    },
    author: {
        type: String
    },
    published_date: {
        type: Date
    },
    image_url: {
        type: String
    },
    categories: {
        type: [String],
        default: []
    },
    status: {
        type: Number,
        enum: [0, 1, -1], // 0=draft, 1=published, -1=archived
        default: 1
    },
    imported_at: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes
feedArticlesSchema.index({ feed_id: 1 });
feedArticlesSchema.index({ link: 1 }, { unique: true });
feedArticlesSchema.index({ guid: 1 }, { unique: true, sparse: true });
feedArticlesSchema.index({ published_date: -1 });
feedArticlesSchema.index({ status: 1 });

feedArticlesSchema.methods.getPublicObject = function () {
    return {
        id: this._id,
        feed_id: this.feed_id,
        title: this.title,
        description: this.description,
        content: this.content,
        link: this.link,
        guid: this.guid,
        author: this.author,
        published_date: this.published_date,
        image_url: this.image_url,
        categories: this.categories,
        status: this.status,
        imported_at: this.imported_at,
        created_at: this.createdAt,
        updated_at: this.updatedAt
    };
};

feedArticlesSchema.statics.createFeedArticle = async function (feedArticleData) {
    try {
        const feedArticle = new FeedArticlesModel(feedArticleData);
        const savedFeedArticle = await feedArticle.save();
        return savedFeedArticle ? savedFeedArticle.getPublicObject() : null;
    } catch (err) {
        var errorData = [];
        if (err.errors) {
            for (item in err.errors) {
                errorData.push({
                    field: err.errors[item].path,
                    message: err.errors[item].message
                });
            }
        }
        const error = {
            code: errorCodes.validationFailed,
            message: 'Validation Failed',
            errorData: errorData
        };
        throw error;
    }
};

feedArticlesSchema.statics.loadFeedArticlesByFeed = async function (feedId, filters = {}, ordering, offset, limit) {
    try {
        const queryFilters = { ...filters, feed_id };
        let feedArticleQuery = this.find(queryFilters);

        if (ordering) {
            feedArticleQuery.sort(ordering);
        } else {
            feedArticleQuery.sort({ published_date: -1 });
        }

        if (offset) {
            feedArticleQuery.skip(offset);
        }

        if (limit) {
            feedArticleQuery.limit(limit);
        }

        const feedArticles = await feedArticleQuery.exec();
        let allFeedArticles = [];

        if (feedArticles.length && feedArticles.length > 0) {
            feedArticles.forEach(function (feedArticleDetails) {
                allFeedArticles.push(feedArticleDetails.getPublicObject());
            });
        }
        return allFeedArticles;
    } catch (error) {
        throw error;
    }
};

feedArticlesSchema.statics.loadAllFeedArticles = async function (filters = {}, ordering, offset, limit) {
    try {
        let feedArticleQuery = this.find(filters).populate('feed_id', 'name url');

        if (ordering) {
            feedArticleQuery.sort(ordering);
        } else {
            feedArticleQuery.sort({ published_date: -1 });
        }

        if (offset) {
            feedArticleQuery.skip(offset);
        }

        if (limit) {
            feedArticleQuery.limit(limit);
        }

        const feedArticles = await feedArticleQuery.exec();
        let allFeedArticles = [];

        if (feedArticles.length && feedArticles.length > 0) {
            feedArticles.forEach(function (feedArticleDetails) {
                allFeedArticles.push(feedArticleDetails.getPublicObject());
            });
        }
        return allFeedArticles;
    } catch (error) {
        throw error;
    }
};

feedArticlesSchema.statics.findByLink = async function (link) {
    try {
        const feedArticle = await this.findOne({ link }).exec();
        return feedArticle;
    } catch (err) {
        console.log(err);
        throw err;
    }
};

feedArticlesSchema.statics.findByGuid = async function (guid) {
    try {
        if (!guid) return null;
        const feedArticle = await this.findOne({ guid }).exec();
        return feedArticle;
    } catch (err) {
        console.log(err);
        throw err;
    }
};

feedArticlesSchema.statics.updateFeedArticleStatus = async function (feedArticleId, status) {
    try {
        const feedArticle = await this.findByIdAndUpdate(feedArticleId, { status }, { new: true });
        return feedArticle ? feedArticle.getPublicObject() : null;
    } catch (error) {
        throw error;
    }
};

module.exports = FeedArticlesModel = mongoose.model('feedarticles', feedArticlesSchema);

