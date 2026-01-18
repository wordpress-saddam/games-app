const mongoose = require('../../utils/database-connection').Mongoose;
const errorCodes = require('../../../config/error-codes').projectDomains;
const envName = require('../../../config/config').ENV;
const async = require('async');

const projectDomainsSchema = new mongoose.Schema({
    project_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'projects'
    },
    demo_host: {
        type: String,
        required: true
    },
    public_host: String,
    origin_host: String,
    https_only: {
        type: Boolean,
        default: false
    },
    behind_login: {
        type: Boolean,
        default: false
    },
    pwa_engine: String,
    cdn_dist_id: String, // Link to cdn_management collection
    status: {
        type: String,
        default: 0
        //o - SSL Pending
        //1 - SSL Not Verified
        //2 - Deployment Pending
        //3 - Deployment Complete
        //4 - CNAME record verified
    },
    public_host_cname: {
        type: String
    },
    cdn_url: String,
}, {
    timestamps: true
});

projectDomainsSchema.methods.getPublicObject = function () {

    return {
        id: this._id,
        project_id: this.project_id,
        demo_host: this.demo_host,
        public_host: this.public_host,
        origin_host: this.origin_host,
        https_only: this.https_only,
        behind_login: this.behind_login,
        pwa_engine: this.pwa_engine,
        cdn_dist_id: this.cdn_dist_id,
        status: this.status,
        public_host_cname: this.public_host_cname,
        cdn_url: this.cdn_url,
    }
};

projectDomainsSchema.statics.createProjectDemoHostDomain = async function (projectId, demo_host, https_only, behind_login, pwa_engine, cdn_dist_id) {
    try {
        const projectData = {
            project_id: projectId,
            demo_host: demo_host,
            https_only: https_only,
            behind_login: behind_login,
            pwa_engine: pwa_engine,
            cdn_dist_id: cdn_dist_id,
            status: 0
        }

        if (envName === "DEVELOPMENT") {
            projectData.status = 3;
        }

        const projectdomain = new ProjectDomainsModel({
            ...projectData
        });

        console.log("Project Domain document object", projectdomain);

        const projectDomainCreated = await projectdomain.save();
        return (projectDomainCreated ? projectDomainCreated.getPublicObject() : null);

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



projectDomainsSchema.statics.createProjectDomain = async function (projectId, demo_host, public_host, origin_host, https_only, behind_login, pwa_engine, cdn_dist_id, public_host_cname) {
    try {
        const projectData = {
            project_id: projectId,
            demo_host: demo_host,
            public_host: public_host,
            origin_host: origin_host,
            https_only: https_only,
            behind_login: behind_login,
            pwa_engine: pwa_engine,
            cdn_dist_id: cdn_dist_id,
            public_host_cname,
            status: 0
        }
        if (envName === "DEVELOPMENT") {
            projectData.status = 3;
        }

        const projectdomain = new ProjectDomainsModel({
            ...projectData
        });

        console.log("Project Domain document object", projectdomain);

        const projectDomainCreated = await projectdomain.save();
        return (projectDomainCreated ? projectDomainCreated.getPublicObject() : null);

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


projectDomainsSchema.statics.updateProjectDomain = async function (projectId, demo_host, public_host, origin_host, https_only, behind_login, pwa_engine, cdn_dist_id, public_host_cname) {
    try {
        const projectData = {
            // project_id: projectId,
            // demo_host: demo_host,
            public_host: public_host,
            origin_host: origin_host,
            https_only: https_only,
            behind_login: behind_login,
            pwa_engine: pwa_engine,
            cdn_dist_id: cdn_dist_id,
            public_host_cname,
            status: 0
        }

        // if (envName === "DEVELOPMENT") {
        //     projectData.status = 3;
        // }


        const projectdomain = await this.findOne({
            project_id: projectId
        });
        if (projectdomain) {
            projectdomain.public_host = public_host;
            projectdomain.origin_host = origin_host;
            projectdomain.status = projectData.status;
            projectdomain.public_host_cname = public_host_cname;

            const projectDomainUpdated = await projectdomain.save();
            return (projectDomainUpdated ? projectDomainUpdated.getPublicObject() : null);
        } else {
            return projectDomainsSchema.statics.createProjectDomain(projectId, demo_host, public_host, origin_host, https_only, behind_login, pwa_engine, cdn_dist_id, public_host_cname);
        }

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




projectDomainsSchema.statics.loadOneByFilters = async function (filters = {}) {
    try {
        const domain = await this.findOne(filters).exec();
        console.log(domain, " domain")
        return domain ? domain.getPublicObject() : null;
    } catch (err) {
        console.log(err);
        throw err;
    }
};

projectDomainsSchema.statics.loadOneByField = function (fieldName, fieldValue, cb) {

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


projectDomainsSchema.statics.loadAllByFilters = async function (filters = {}, ordering, offset, limit) {
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

        const domains = await projectQ;
        let allDomains = [];

        if (domains.length && domains.length > 0) {
            domains.forEach(function (domainDetails) {
                allDomains.push(domainDetails.getPublicObject());
            })

        }
        return allDomains;
    } catch (error) {
        throw error;
    }
};

projectDomainsSchema.statics.updateStatus = async function (filters = {}, status) {
    try {
        const domain = await this.findOne(filters);
        domain.status = status;
        const result = await domain.save();
        return result ? true : false;

    } catch (error) {
        throw error;
    }
};

projectDomainsSchema.statics.updateField = async function (filters = {}, fieldKey, fieldValue) {
    try {
        const domain = await this.findOne(filters);
        domain[fieldKey] = fieldValue;
        const result = await domain.save();
        return result ? true : false;

    } catch (error) {
        throw error;
    }
};

module.exports = ProjectDomainsModel = mongoose.model('projectDomains', projectDomainsSchema);