const mongoose = require("../../utils/database-connection").Mongoose;
const errorCodes = require("../../../config/error-codes").projectConfig;
const async = require("async");

const projectGamesSchema = new mongoose.Schema(
    {
        game_id: {
            type: String,
            required: true,
        },
        project_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "projects",
            required: true,
        },
        article_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "articles",
            required: false,
        },
        categories: [
            {
                type: mongoose.Types.ObjectId,
                ref: "articleCategories",
            },
        ],
        category_guid: {
            type: String,
            required: false,
            default: '',
        },
        article_guid: {
            type: String,
            required: false,
            default: '',
        },
        custom_quiz_id: {
            type: String,
            required: false,
            default: '',
        },
        quiz_title: {
            type: String,
            required: false,
            default: '',
        },
        game_type: {
            type: String,
            required: true,
        },
        status: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);
projectGamesSchema.methods.getPublicObject = function () {
    return {
        game_id: this.game_id,
        project_id: this.project_id,
        article_id: this.article_id,
        categories: this.categories,
        category_guid: this.category_guid,
        article_guid: this.article_guid,
        custom_quiz_id: this.custom_quiz_id,
        quiz_title: this.quiz_title,
        game_type: this.game_type,
        status: this.status,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
    };
};

projectGamesSchema.statics.loadOneByFilters = async function (filters = {}) {
    try {
        const projectGame = await this.findOne(filters).exec();
        return projectGame ? projectGame.getPublicObject() : null;
    } catch (err) {
        throw err;
    }
};
projectGamesSchema.statics.loadAllByFilters = async function (
    filters = {},
    ordering,
    offset,
    limit
) {
    try {

        const games_count = await this.countDocuments(filters);
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

        query.populate({
            path: 'article_id', 
            select: 'title',
        });
        query.populate({
            path: 'categories', 
            select: 'name',
        });

        const projectGames = await query;


        return {
            status: true,
            data: {
                games: projectGames || [],
                count: games_count || 0,
            }

        };
    } catch (err) {
        console.log(err)
        return {
            status: false,
            error: err.message || "An unexpected error occurred",
        }
    }
};

projectGamesSchema.statics.loadAllByFiltersOrdered = function (
    filters = {},
    ordering = { createdAt: -1 },
    cb
) {
    this.loadAllByFilters(filters, ordering, 0, 0, cb);
};

projectGamesSchema.statics.insertMapping = async function (mappingData) {
    try {
        const { game_id, project_id, article_id, game_type, article_guid, category_guid, categories, custom_quiz_id, quiz_title, status = true } = mappingData;
        const updateData = { status, game_type, article_guid, category_guid, categories,article_id };
        
        // Add custom quiz fields if provided
        if (custom_quiz_id) updateData.custom_quiz_id = custom_quiz_id;
        if (quiz_title) updateData.quiz_title = quiz_title;
        
        const updatedMapping = await this.findOneAndUpdate(
            { game_id, project_id,article_id },
            { $set: updateData },
            { new: true, upsert: true }
        );

        return updatedMapping.getPublicObject();
    } catch (err) {
        console.log(`Error inserting/updating game-article mapping: ${err}`);
    }
};



module.exports = mongoose.model("projectGames", projectGamesSchema);
