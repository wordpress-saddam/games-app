const mongoose = require('../../utils/database-connection').Mongoose;
const errorCodes = require('../../../config/error-codes').feedSettings;

const feedSettingsSchema = new mongoose.Schema({
    feed_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'feeds',
        unique: true,
        sparse: true
    },
    import_interval_minutes: {
        type: Number,
        default: 60,
        min: 5
    },
    auto_import: {
        type: Boolean,
        default: true
    },
    max_feedarticles_per_import: {
        type: Number,
        default: 50
    },
    last_import_at: {
        type: Date
    },
    next_import_at: {
        type: Date
    },
    global_settings: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

feedSettingsSchema.methods.getPublicObject = function () {
    return {
        id: this._id,
        feed_id: this.feed_id,
        import_interval_minutes: this.import_interval_minutes,
        auto_import: this.auto_import,
        max_feedarticles_per_import: this.max_feedarticles_per_import,
        last_import_at: this.last_import_at,
        next_import_at: this.next_import_at,
        global_settings: this.global_settings,
        created_at: this.createdAt,
        updated_at: this.updatedAt
    };
};

feedSettingsSchema.statics.createOrUpdateSettings = async function (feedId, settingsData) {
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
        );

        // Calculate next_import_at if interval is set
        if (settings.import_interval_minutes && settings.auto_import) {
            settings.next_import_at = new Date(Date.now() + settings.import_interval_minutes * 60 * 1000);
            await settings.save();
        }

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

feedSettingsSchema.statics.getSettingsByFeedId = async function (feedId) {
    try {
        const settings = await this.findOne({ feed_id: feedId }).exec();
        if (settings) {
            return settings.getPublicObject();
        }
        // Return default settings if not found
        return {
            import_interval_minutes: 60,
            auto_import: true,
            max_feedarticles_per_import: 50,
            global_settings: false
        };
    } catch (err) {
        console.log(err);
        throw err;
    }
};

feedSettingsSchema.statics.getGlobalSettings = async function () {
    try {
        const settings = await this.findOne({ global_settings: true }).exec();
        if (settings) {
            return settings.getPublicObject();
        }
        // Return default global settings
        return {
            import_interval_minutes: 60,
            auto_import: true,
            max_feedarticles_per_import: 50,
            global_settings: true
        };
    } catch (err) {
        console.log(err);
        throw err;
    }
};

feedSettingsSchema.statics.updateNextImportTime = async function (feedId) {
    try {
        const settings = await this.findOne({ feed_id: feedId }).exec();
        if (settings && settings.import_interval_minutes && settings.auto_import) {
            settings.last_import_at = new Date();
            settings.next_import_at = new Date(Date.now() + settings.import_interval_minutes * 60 * 1000);
            await settings.save();
            return settings.getPublicObject();
        }
        return null;
    } catch (err) {
        console.log(err);
        throw err;
    }
};

module.exports = FeedSettingsModel = mongoose.model('feedsettings', feedSettingsSchema);

