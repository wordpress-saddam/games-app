const mongoose = require('../../utils/database-connection').Mongoose;
const errorCodes = require('../../../config/error-codes').projects;
const async = require('async');
//const firebaseProjectId = require('../../../config/config').notifications.firebase.defaultProjectId;

const projectsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    desc: String,
    logo: String,
    host: String,
    locale: String,
    slug: String,
    is_used: {
        type: Number,
        default: 0
    },
    status: {
        type: Number,
        enum: [
            0, // 'init'
            1, // 'active'
            -1, //suspended
            -2 //deleted 
        ],
        default: 0
    },
    timezone: String,
    publishers_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'publishers',
        required: true
    },
    bucket_name: String,
    bucket_region: String,
    gcp_bucket_name: String,
    gcp_bucket_region: String,
    firebase_project_id: {
        type: String
    },
    service_stack_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'servicestacks'
    },
    enable_bulk_sync: {
        type: Boolean,
        default: false,
    },
    enable_article_view_count: {
        type: Boolean,
        default: false,
    },
    enable_membership_subscription: {
        type: Boolean,
        default: false
    },
    enable_linking: {
        type: Boolean,
        default: false
    },
    linked_project_ids: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'projects',
        }],
        default: [],
    }
    // service_stack_slug: {
    //     type: String
    // }
}, {
    timestamps: true
});

projectsSchema.methods.getPublicObject = function () {
    const linkedProjects = (this.linked_project_ids || []).map(p => {
        if (p && p.createdAt) {
            return {
                _id: p._id,
                name: p.name,
                slug: p.slug,
                created_at: p.createdAt,
            };
        }
        return p;
    });

    return {
        id: this._id,
        name: this.name,
        desc: this.desc,
        logo: this.logo,
        host: this.host,
        locale: this.locale,
        status: this.status,
        slug: this.slug,
        timezone: this.timezone,
        publishers_id: this.publishers_id,
        enable_bulk_sync: this.enable_bulk_sync,
        is_used: this.is_used,
        created_at: this.createdAt,
        enable_article_view_count: this.enable_article_view_count,
        enable_membership_subscription: this.enable_membership_subscription,
        enable_linking: this.enable_linking || false,
        linked_project_ids: linkedProjects,
    }
};

projectsSchema.statics.createProject = async function (projectData) {
    try {
        const project = new ProjectsModel({
            ...projectData,
            //firebase_project_id: firebaseProjectId
        });

        const projectCreated = await project.save();
        console.log(projectCreated);
        return (projectCreated ? projectCreated.getPublicObject() : null);

    } catch (err) {
        var errorData = [];
        for (item in err.errors) {
            errorData.push({
                field: err.errors[item].path,
                message: err.errors[item].message
            });
        }
        error = {
            code: errorCodes.validationFailed,
            message: 'Validation Failed',
            errorData: errorData
        };
        throw error;
    }
};
projectsSchema.statics.loadOneByFilters = async function (filters = {}) {

    try {
        const project = await this.findOne(filters).exec();
        return project ? project.getPublicObject() : null;
    } catch (err) {
        console.log(err);
        throw err;
    }

};

projectsSchema.statics.loadOneByFiltersWithPopulatedLinks = async function (filters = {}) {
    try {
        const project = await this.findOne(filters)
            .populate({
                path: 'linked_project_ids',
                select: 'name slug createdAt'
            }).populate({
                path: 'publishers_id',
                select: 'name email'
            }).exec();
        return project ? project.getPublicObject() : null;
    } catch (err) {
        console.log(err);
        throw err;
    }
};


// projectsSchema.statics.loadOneByFilters = function (filters = {}, cb) {

//     this.findOne(filters).exec((err, project) => {

//         if (err) {
//             return cb({
//                 message: err.message,
//                 code: errorCodes.notFound
//             });
//         }

//         cb(null, project ? project.getPublicObject() : null);
//     });
// };


projectsSchema.statics.loadOneByField = function (fieldName, fieldValue, cb) {

    this.findOne({
        [fieldName]: fieldValue
    }).exec((err, project) => {

        if (err) {
            return cb({
                message: err.message,
                code: errorCodes.notFound
            });
        }

        cb(null, project ? project.getPublicObject() : null);
    });
};


projectsSchema.statics.updateStatus = async function (filters = {}, status) {
    try {
        const project = await this.findOne(filters);
        project.status = status;
        const result = await project.save();
        return result ? true : false;

    } catch (error) {
        throw error;
    }
};

projectsSchema.statics.updateIsUsed = async function (filters = {}, is_used) {
    try {
        const project = await this.findOne(filters);
        project.is_used = is_used;
        const result = await project.save();
        return result ? true : false;

    } catch (error) {
        throw error;
    }
};


projectsSchema.statics.updateField = async function (filters = {}, fieldKey, fieldValue) {
    try {
        const project = await this.findOne(filters);
        project[fieldKey] = fieldValue;
        const result = await project.save();
        return result ? true : false;

    } catch (error) {
        throw error;
    }
};

projectsSchema.statics.loadAllProjects = async function (filters = {}, ordering, offset, limit) {
    try {
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

        const projects = await projectQ;
        let allProjects = [];

        if (projects.length && projects.length > 0) {
            projects.forEach(function (projectDetails) {
                allProjects.push(projectDetails.getPublicObject());
            })

        }
        return allProjects;
    } catch (error) {
        throw error;
    }
};

projectsSchema.statics.loadAllByFilters = async function (filters = {}, ordering, offset, limit) {
    try {
        // console.log("filters are :",filters)
        // console.log("ordering is",ordering);
        // console.log("offset is :",offset);
        // console.log("limit is:",limit);
        let projectQ = this.find(filters).populate('publishers_id');
        //console.log("project Q are :",projectQ)
        if (ordering) {

            projectQ.sort(ordering);
        }

        if (offset) {

            projectQ.skip(offset);
        }

        if (limit) {

            projectQ.limit(limit);
        }

        const projects = await projectQ;
        // console.log("project Q at the end are :",projects.length)
        let allProjects = [];

        if (projects.length && projects.length > 0) {
            projects.forEach(function (projectDetails) {
                allProjects.push(projectDetails.getPublicObject());
            })

        }

        return allProjects;
    } catch (error) {
        throw error;
    }
};
projectsSchema.statics.getPublisherEmail = async function (projectId) {
    try {
        const publisherDetails = await this.findOne({
            _id: projectId
        }, "publishers_id").populate("publishers_id", "email");
        if (!publisherDetails) return false;
        // console.log("publisher details are :",publisherDetails);
        return publisherDetails.publishers_id.email;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

projectsSchema.statics.getPublisher = async function (projectId) {
    try {
        const publisherDetails = await this.findOne({
            _id: projectId
        }, "publishers_id").populate("publishers_id", "email name");
        if (!publisherDetails) return false;
        console.log(publisherDetails);
        var obj = {
            email: publisherDetails.publishers_id.email,
            name: publisherDetails.publishers_id.name
        }
        return obj;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

projectsSchema.statics.linkProjects = async function (projectId, linkedIds) {
    try {
        if (!Array.isArray(linkedIds) || linkedIds.length === 0) {
            return { success: false, message: 'No project IDs provided', updatedDoc: null };
        }

        const sanitizedIds = linkedIds.map(id => mongoose.Types.ObjectId(id));

        const updatedDoc = await this.findByIdAndUpdate(
            projectId,
            { $addToSet: { linked_project_ids: { $each: sanitizedIds } } },
            {
                new: true,
                runValidators: false
            }
        );

        if (!updatedDoc) {
            return { success: false, message: 'Project not found', data: {} };
        }

        return {
            status: true,
            message: 'Projects linked successfully',
            data: updatedDoc?._doc
        };

    } catch (err) {
        console.error("Error linking projects:", err);
        return {
            status: false,
            message: 'Something went wrong while linking projects',
            error: err.message,
            data: {}
        };
    }
};

projectsSchema.statics.unlinkProjects = async function (projectId, unlinkIds) {
    try {
        if (!Array.isArray(unlinkIds) || unlinkIds.length === 0) {
            return { status: false, data: {}, error: 'No project IDs provided' };
        }

        const updatedDoc = await this.findByIdAndUpdate(
            projectId,
            { $pull: { linked_project_ids: { $in: unlinkIds } } },
            {
                new: true,
                runValidators: false
            }
        );

        if (!updatedDoc) {
            return { status: false, data: {}, error: 'Project not found' };
        }

        return {
            status: true,
            data: updatedDoc,
            error: null
        };
    } catch (err) {
        console.error("Error unlinking projects:", err);
        return {
            status: false,
            data: {},
            error: err.message
        };
    }
};

module.exports = ProjectsModel = mongoose.model('projects', projectsSchema);