const mongoose = require('../../utils/database-connection').Mongoose;
const {
    ObjectId
} = mongoose.Schema.Types;

const projectDistributionSchema = new mongoose.Schema({
    project_id: {
        type: ObjectId,
        ref: 'projects',
        required: true,
    },
    project_handle: {
        type:String,
        required: true
    },
    project_platform: {
        type: String,
        required: true,
        enum: ["android", "pwa", "ios", "androidctv","iosctv"]
    },
    project_env: {
        type:String,
        enum: ["demo", "origin", "public"],
        required: true
    }
})

projectDistributionSchema.statics.getProjectId = async function(project_handle, project_platform){
    try{
        const projectDistribution = await ProjectDistribution.findOne({
            project_handle,
            project_platform
        })
        if(projectDistribution){
            return {
                project_id:projectDistribution.project_id,
                distribution_id:projectDistribution._id
            };
        }
        return false;
    }catch(err){
        throw err
    }
}

projectDistributionSchema.statics.getProjectPublicHost = async function(project_id, project_platform){
    try{
        const projectDistribution = await ProjectDistribution.findOne({
            project_id,
            project_platform,
            project_env : 'public'
        })
        if(projectDistribution){
            return projectDistribution.project_handle;
        }
        return false;
    }catch(err){
        throw err
    }
}

projectDistributionSchema.statics.createDoc = async function(project_id, project_handle, project_platform, project_env){
    try{
        const projectDistribution = new this({
            project_id,
            project_handle,
            project_platform,
            project_env
        })
        await projectDistribution.save();

        console.log("projectDistribution saved with ", projectDistribution);
        return true;
    }catch(err){
        throw err;
    }
}

projectDistributionSchema.statics.loadOneByFilters = async function (filters = {}) {
    try{
        const record = await this.findOne(filters).exec();
        return record ? record : null;
    }catch(err){
        console.log(err);
        throw err;
    }

};


module.exports = ProjectDistribution = mongoose.model('projectDistributions', projectDistributionSchema)