const mongoose = require('../../utils/database-connection').Mongoose;

const devCredentialsSchema = new mongoose.Schema({
    access_key: {
        type: String,
        required: true
    },
    secret_key: {
        type: String,
        required: true
    },
    platform: {
        type: String,
        required: true
    }
})

const generateRandomKey = length =>{
    const sampleString ="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const sampleLength = sampleString.length;
    let key = "";
    while(length>0){
        key+= sampleString[Math.floor(Math.random()*sampleLength)];
        length--;
    }
    return key;
}

devCredentialsSchema.statics.createDevCredentials = async function(platform){
    try{
        const access_key = generateRandomKey(32);
        const secret_key = generateRandomKey(32);
        const devCredentials = new DevCredentials({
            access_key,
            secret_key,
            platform
        })
        await devCredentials.save()
        return true;
    }catch(err){
        console.log(err)
        return false;
    }
}

devCredentialsSchema.statics.verifyCredentials = async function(access_key, secret_key, platform){
    try{
        
        const devCredentials = await DevCredentials.findOne({
            access_key,
            secret_key,
            platform
        })

        if(devCredentials){
            return devCredentials._id;
        }
        return false;

    }catch(err){
        throw err;
    }
}

devCredentialsSchema.statics.getDeveloperId = async function(platform){
    try{
        
        const devCredentials = await DevCredentials.findOne({
            platform
        })

        if(devCredentials){
            return devCredentials._id;
        }
        return false;

    }catch(err){
        throw err;
    }
}

module.exports = DevCredentials = mongoose.model('devCredentials',devCredentialsSchema)