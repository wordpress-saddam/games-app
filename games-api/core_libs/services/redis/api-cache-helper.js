const {
    getRedisClient
} = require('./service-stack-head')

const {
    ttl
} = require('../../../config/config').redis;

const setApiCache = async (key, value, serviceStackId) => {

    console.log("setApiCache : ", serviceStackId)


    const client = await getRedisClient(serviceStackId);

    return new Promise((resolve, reject) => {
        client.set(key, value, (err, reply) => {
            if (err) {
                return reject(false)
            } else {
                return resolve(true)
            }
        })
        client.expire(key, ttl)
    })
}

const getApiCache = async(key,serviceStackId) => {

    console.log("getApiCache : ", serviceStackId)

    const client = await getRedisClient(serviceStackId);

    return new Promise((resolve, reject) => {
        client.get(key, (err, reply) => {
            if (err) {
                return reject(err)
            } else {
                return resolve(reply)
            }
        })
    })
}

const pushElementToSet = async(setName, element,serviceStackId) => {
    const client = await getRedisClient(serviceStackId);

    return new Promise((resolve, reject) => {
        client.sadd(setName, element, (err, reply) => {
            if (err) {
                console.log(err)
                reject(err)
            } else {
                client.expire(setName, 30*60, (error, response) => {
                    if (error) {
                        reject(error)
                    } else {
                        resolve(reply)
                    }
                })

            }
        })
    })
}
const pushElementToSetWithTTl = async(setName, element,serviceStackId,ttl) => {
    const client = await getRedisClient(serviceStackId);
    console.log("pushing element to set ",element, setName);

    return new Promise((resolve, reject) => {
        client.sadd(setName, element, (err, reply) => {
            if (err) {
                console.log(err)
                reject(err)
            } else {
                client.expire(setName, ttl, (error, response) => {
                    console.log(error);
                    if (error) {
                        console.log(error)
                        reject(error)
                    } else {
                        resolve(response)
                    }
                })

            }
        })
    })
}


const fetchSetData = async(setName,serviceStackId) => {
    const client = await getRedisClient(serviceStackId);

    return new Promise((resolve, reject) => {
        client.smembers(setName, (err, reply) => {
            if (err) {
                reject(err);
            } else {
                resolve(reply);
            }
        })
    })
}

const deleteKey = async (key, serviceStackId, redisClient='apiRedis') =>{
    const client = await getRedisClient(serviceStackId, redisClient);

    return new Promise((resolve, reject)=>{
        client.del(key, (err, reply)=>{
            if(err){
                reject(err);
            }else{
                console.log(key,reply)
                resolve(reply);
            }
        })
    })
}

const popElementFromSet = async (setKey, element, serviceStackId) =>{
    const client = await getRedisClient(serviceStackId);

    return new Promise((resolve, reject)=>{
        client.srem(setKey, element, (err, reply)=>{
            if(err){
                reject(err);
            }else{
                resolve(reply);
            }
        })
    })
}

const getPatternMatchingkeys = async(pattern, serviceStackId, requestClient = 'apiRedis')=>{
    const client = await getRedisClient(serviceStackId, requestClient);

    return new Promise((resolve, reject)=>{
        client.keys(pattern, (err, reply)=>{
            if(err){
                reject(err);
            }else{
                resolve(reply);
            }
        })
    })
}

const setApiCacheWithTTL = async(key, value, serviceStackId,customTTL)=>{
    console.log("setApiCache : ", serviceStackId)


    const client = await getRedisClient(serviceStackId);

    return new Promise((resolve, reject) => {
        client.set(key, value, (err, reply) => {
            if (err) {
                return reject(false)
            } else {
                return resolve(true)
            }
        })
        client.expire(key, customTTL)
    })
}



const deletePatternMatchingkeys = async(pattern, serviceStackId, requestClient = 'apiRedis')=>{
    const client = await getRedisClient(serviceStackId, requestClient);

    return new Promise((resolve, reject)=>{
        console.log("Pattern: ",pattern);
        client.keys(pattern, (err, reply)=>{
            if(err){
                reject(err);
            }else{
                console.log("Keys found:",reply.length);
                if(reply && reply.length >0) {
                    client.del(reply, (err) => {
                        if (err) {
                            console.error('Error deleting keys:', err);
                            reject(err);
                        } else {
                            console.log("deleted keys:",reply.length);
                            resolve(reply);
                        }
                    });
                    
                }else {
                    resolve([])
                }
            }
        })
    })
}
module.exports = {
    setApiCache,
    getApiCache,
    pushElementToSet,
    fetchSetData,
    deleteKey,
    popElementFromSet,
    getPatternMatchingkeys,
    setApiCacheWithTTL,
    deletePatternMatchingkeys,
    pushElementToSetWithTTl
}