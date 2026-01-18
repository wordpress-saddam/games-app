const mongoose = require('../../utils/database-connection').Mongoose;
const errorCodes = require('../../../config/error-codes').feedArticles;

const feedArticleGamesSchema = new mongoose.Schema({
    game_id: {
        type: String,
        required: true
    },
    feed_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'feeds',
        required: true
    },
    article_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'feedarticles',
        required: true
    },
    categories: {
        type: [String],
        default: []
    },
    category_guid: {
        type: String,
        default: ''
    },
    article_guid: {
        type: String,
        required: false,
        default: ''
    },
    game_type: {
        type: String,
        required: true
    },
    status: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

feedArticleGamesSchema.index({ feed_id: 1, article_id: 1, game_type: 1 });
feedArticleGamesSchema.index({ game_id: 1 });

feedArticleGamesSchema.methods.getPublicObject = function () {
    return {
        game_id: this.game_id,
        feed_id: this.feed_id,
        article_id: this.article_id,
        categories: this.categories,
        category_guid: this.category_guid,
        article_guid: this.article_guid,
        game_type: this.game_type,
        status: this.status,
        created_at: this.createdAt,
        updated_at: this.updatedAt
    };
};

feedArticleGamesSchema.statics.insertMapping = async function (mappingData) {
    try {
        const existingMapping = await this.findOne({
            feed_id: mappingData.feed_id,
            article_id: mappingData.article_id,
            game_type: mappingData.game_type
        });

        if (existingMapping) {
            // Update existing mapping
            existingMapping.game_id = mappingData.game_id;
            existingMapping.article_guid = mappingData.article_guid || '';
            existingMapping.category_guid = mappingData.category_guid || '';
            existingMapping.categories = mappingData.categories || [];
            existingMapping.status = true;
            await existingMapping.save();
            return existingMapping.getPublicObject();
        } else {
            // Create new mapping
            const mapping = new FeedArticleGamesModel(mappingData);
            await mapping.save();
            return mapping.getPublicObject();
        }
    } catch (err) {
        console.error('Error inserting feed article game mapping:', err);
        throw err;
    }
};

feedArticleGamesSchema.statics.loadOneByFilters = async function (filters = {}) {
    try {
        const mapping = await this.findOne(filters).exec();
        return mapping ? mapping.getPublicObject() : null;
    } catch (err) {
        console.log(err);
        throw err;
    }
};

feedArticleGamesSchema.statics.loadAllByFilters = async function (filters = {}, ordering, offset, limit) {
    try {
        let query = this.find(filters);

        if (ordering) {
            query.sort(ordering);
        }

        if (offset) {
            query.skip(offset);
        }

        if (limit) {
            query.limit(limit);
        }

        const mappings = await query.exec();
        let allMappings = [];

        if (mappings.length && mappings.length > 0) {
            mappings.forEach(function (mappingDetails) {
                allMappings.push(mappingDetails.getPublicObject());
            });
        }
        return allMappings;
    } catch (error) {
        throw error;
    }
};

module.exports = FeedArticleGamesModel = mongoose.model('feedarticlegames', feedArticleGamesSchema);

