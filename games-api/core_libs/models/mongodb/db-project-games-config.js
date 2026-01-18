const mongoose = require("../../utils/database-connection").Mongoose;
const errorCodes = require("../../../config/error-codes").projectConfig;
const async = require("async");

const projectGamesConfigSchema = new mongoose.Schema(
    {
        project_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "projects",
        },
        status: {
            type: Boolean,
            default: true,
        },
        category_ids: {
            type: [String],
            default: [],
        },
        enabled_games: {
            type: [String],
            default: [],
        },
        language: {
            type: String,
            enum: ["english", "hindi", "arabic"],
            default: "english",
        },
        host_name: {
            type: String,
        }
        ,
        enable_custom_quiz: {
            type: Boolean,
            default: false,
        }
    },
    {
        timestamps: true,
    }
);

projectGamesConfigSchema.methods.getPublicObject = function () {
    return {
        project_id: this.project_id,
        status: this.status,
        category_ids: this.category_ids || [],
        enabled_games: this.enabled_games || [],
        language: this.language || 'english',
        host_name: this.host_name,
        enable_custom_quiz: this.enable_custom_quiz || false,
    };
};

projectGamesConfigSchema.statics.loadOneByFilters = async function (filters = {}) {
    try {
        const project = await this.findOne(filters).exec();

        return project ? project.getPublicObject() : null;
    } catch (err) {
        throw err;
    }
};

projectGamesConfigSchema.statics.loadOneByFiltersAndField = async function (filters = {}, fieldName) {
    try {
        const project = await this.findOne(filters, {
            [fieldName]: 1,
        }).exec();

        return project[fieldName]
            ? {
                [fieldName]: project[fieldName],
            }
            : null;
    } catch (err) {
        throw err;
    }
};

projectGamesConfigSchema.statics.loadOneByField = async function (
    fieldName,
    fieldValue
) {
    try {
        const project = await this.findOne({
            [fieldName]: fieldValue,
        }).exec();
        return project ? project.getPublicObject() : null;
    } catch (err) {
        throw err;
    }
};

projectGamesConfigSchema.statics.loadAllByFilters = function (
    filters = {},
    ordering,
    offset,
    limit,
    cb
) {
    let projectQ = this.find(filters);

    if (ordering) {
        projectQ.sort(ordering);
    }

    if (offset) {
        projectQ.skip(offset);
    }

    if (limit) {
        projectQ.limit(limit);
    }

    projectQ.exec((err, projects) => {
        if (err) {
            return cb({
                message: err.message,
                code: errorCodes.notFound,
            });
        }

        async.map(
            projects,
            (project, callback) => {
                callback(null, project.getPublicObject());
            },
            cb
        );
    });
};

projectGamesConfigSchema.statics.saveConfig = async function (
    fieldName,
    projectId,
    fieldConfig
) {
    try {
        let projectConfig = await this.findOne({
            project_id: projectId,
        });
        if (!projectConfig) {
            projectConfig = new ProjectGamesConfigModel({
                project_id: projectId,
            });
        }
        projectConfig[fieldName] = fieldConfig;

        const updatedConfig = await projectConfig.save();
        return updatedConfig;
    } catch (err) {
        console.log(err);
    }
};

projectGamesConfigSchema.statics.saveProjectGamesConfig = async function (
    formdata,
    projectId
) {
    try {
        let projectConfig = await this.findOne({
            project_id: projectId,
        });
        if (!projectConfig) {
            projectConfig = new ProjectGamesConfigModel({
                project_id: projectId,
            });
        }
        Object.keys(formdata).forEach((field) => {
            if (formdata.hasOwnProperty(field) && field !== 'project_id') {
                projectConfig[field] = formdata[field];
            }
        });

        const updatedConfig = await projectConfig.save();
        return updatedConfig;
    } catch (err) {
        console.log(err);
        throw new Error(`Error saving configuration for project ID ${projectId}: ${err.message}`);
    }
};


module.exports = ProjectGamesConfigModel = mongoose.model(
    "projectGamesConfig",
    projectGamesConfigSchema
);