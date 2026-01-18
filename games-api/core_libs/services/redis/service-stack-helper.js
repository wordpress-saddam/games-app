const{
    getRedisClient
} = require('./redis-head');

const setServiceStackSlug = async(authToken, serviceStackId) =>{
    try{
        const redisClient = await getRedisClient();
        return new Promise((resolve, reject)=>{
            redisClient.set(authToken, serviceStackId, (err, reply) => {
                if (err) {
                    return reject(false)
                } else {
                    return resolve(true)
                }
            })
            redisClient.expire(key, -1)
        })
    }catch(err){
        console.log(err);
    }
}

const getServiceStackSlug = async(authToken, serviceStackId) =>{
    try{
        const redisClient = await getRedisClient();
        return new Promise((resolve, reject)=>{
            redisClient.set(authToken, serviceStackId, (err, reply) => {
                if (err) {
                    return reject(false);
                } else {
                    return resolve(true);
                }
            })
            redisClient.expire(key, -1);
        })
    }catch(err){
        console.log(err);
    }
}


module.exports = {
    setServiceStackSlug,
    getServiceStackSlug
}