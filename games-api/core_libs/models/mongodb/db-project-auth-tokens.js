const mongoose = require('../../utils/database-connection').Mongoose;
const {
    ObjectId
} = mongoose.Schema.Types;

const {
    v1: uuidV1
} = require('uuid');

const projectAuthTokenSchema = new mongoose.Schema({
    project_id: {
        type: ObjectId,
        required: true,
        ref: "projects"
    },
    distribution_id: {
        type: ObjectId,
        ref: "projectDistributions",
        required: true
    },
    developer_id: {
        type: ObjectId,
        ref: "devCredentials",
        required: true
    },
    expires_at: {
        type: Date,
        required: true
    },
    token: {
        type: String,
        required: true
    },
    status: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
})

projectAuthTokenSchema.statics.generateNewToken = async function (project_id, distribution_id, developer_id) {
    try {

        console.log(distribution_id);

        //TODO 
        //count and apply limit here!

        const token = uuidV1();
        const expires_at = Date.now() + 24 * 60 * 60 * 1000;
        const authToken = new ProjectAuthToken({
            project_id,
            distribution_id,
            developer_id,
            expires_at,
            token
        })

        await authToken.save()

        return {
            token: authToken.token,
            ttl: authToken.expires_at - Date.now()
        };
    } catch (err) {
        throw err
    }
}

projectAuthTokenSchema.statics.getAuthToken = async function (project_id, distribution_id, developer_id) {
    try {
        const token = await this.findOne({
            project_id,
            distribution_id,
            developer_id,
            expires_at: {
                $gt: Date.now() + 60 * 60 * 1000
            }
        })

        if (token) {
            return {
                token: token.token,
                ttl: token.expires_at - Date.now()
            };
        }
        return false

    } catch (err) {

    }
}

projectAuthTokenSchema.statics.verifyToken = async function (token) {
    try {
        const authToken = await ProjectAuthToken.findOne({
            token
        }).populate("project_id","service_stack_id publishers_id");

        if (!authToken) {
            return {
                err: true,
                msg: "Invalid Token"
            }
        }

        if (!(authToken.expires_at >= Date.now())) {
            return {
                err: true,
                msg: "Token expired"
            }
        }
        return {
            isValid: true,
            project_id: authToken.project_id,
            distribution_id: authToken.distribution_id
        }

    } catch (err) {
        throw err
    }
}


module.exports = ProjectAuthToken = mongoose.model('projectAuthTokens', projectAuthTokenSchema)