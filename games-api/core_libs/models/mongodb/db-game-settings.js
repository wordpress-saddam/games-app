const mongoose = require('../../utils/database-connection').Mongoose;
const errorCodes = require('../../../config/error-codes').gameSettings;

const gameSettingsSchema = new mongoose.Schema({
    feed_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'feeds',
        required: true,
        unique: true
    },
    enabled: {
        type: Boolean,
        default: false
    },
    language: {
        type: String,
        enum: ['English', 'Arabic'],
        default: 'Arabic'
    },
    games: {
        type: [{
            type: String,
            enum: ['headline_scramble', 'quiz', 'hangman', 'crossword']
        }],
        default: []
    },
    access_key: {
        type: String,
        required: false
    },
    secret_key: {
        type: String,
        required: false
    }
}, {
    timestamps: true
});

gameSettingsSchema.methods.getPublicObject = function () {
    // Extract feed_id - handle both populated object and direct ID
    let feedId = this.feed_id;
    
    // Handle populated feed object
    if (feedId && typeof feedId === 'object') {
        // Check if it's a populated Mongoose document (has _id property)
        if (feedId._id) {
            feedId = feedId._id;
        } else if (feedId.id) {
            feedId = feedId.id;
        }
    }
    
    // Convert to string - handle ObjectId, string, or other types
    if (feedId) {
        if (typeof feedId === 'object' && feedId.toString) {
            feedId = feedId.toString();
        } else if (typeof feedId !== 'string') {
            feedId = String(feedId);
        }
    } else {
        feedId = '';
    }
    
    // If feed_id is populated, also include the populated feed object for display
    const feedObject = (this.feed_id && typeof this.feed_id === 'object' && this.feed_id._id && this.feed_id.name) 
        ? this.feed_id 
        : null;
    
    return {
        id: this._id,
        feed_id: feedId,
        feed_id_obj: feedObject, // Keep populated object for display purposes
        enabled: this.enabled,
        language: this.language,
        games: this.games || [],
        access_key: this.access_key || '',
        secret_key: this.secret_key || '',
        created_at: this.createdAt,
        updated_at: this.updatedAt
    };
};

gameSettingsSchema.statics.createOrUpdateSettings = async function (feedId, settingsData) {
    try {
        const settings = await this.findOneAndUpdate(
            { feed_id: feedId },
            {
                ...settingsData,
                feed_id: feedId
            },
            {
                new: true,
                upsert: true,
                runValidators: true
            }
        ).populate('feed_id', 'name url');

        return settings ? settings.getPublicObject() : null;
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

gameSettingsSchema.statics.getSettingsByFeedId = async function (feedId) {
    try {
        const settings = await this.findOne({ feed_id: feedId })
            .populate('feed_id', 'name url')
            .exec();
        return settings ? settings.getPublicObject() : null;
    } catch (err) {
        console.log(err);
        throw err;
    }
};

gameSettingsSchema.statics.getAllSettings = async function (filters = {}, ordering, offset, limit) {
    try {
        let settingsQuery = this.find(filters).populate('feed_id', 'name url');

        if (ordering) {
            settingsQuery.sort(ordering);
        }

        if (offset) {
            settingsQuery.skip(offset);
        }

        if (limit) {
            settingsQuery.limit(limit);
        }

        const settings = await settingsQuery.exec();
        let allSettings = [];

        if (settings.length && settings.length > 0) {
            settings.forEach(function (settingsDetails) {
                allSettings.push(settingsDetails.getPublicObject());
            });
        }
        return allSettings;
    } catch (error) {
        throw error;
    }
};

gameSettingsSchema.statics.deleteSettings = async function (feedId) {
    try {
        const result = await this.findOneAndDelete({ feed_id: feedId });
        return result ? true : false;
    } catch (err) {
        console.log(err);
        throw err;
    }
};

gameSettingsSchema.statics.loadOneByFilters = async function (filters = {}, populateFeed = false) {
    try {
        let query = this.findOne(filters);
        
        // Only populate if explicitly requested (for cases where feeds model is available)
        if (populateFeed) {
            query = query.populate('feed_id', 'name url');
        }
        
        const settings = await query.exec();
        return settings ? settings.getPublicObject() : null;
    } catch (err) {
        console.log(err);
        throw err;
    }
};

module.exports = GameSettingsModel = mongoose.model('gamesettings', gameSettingsSchema);

