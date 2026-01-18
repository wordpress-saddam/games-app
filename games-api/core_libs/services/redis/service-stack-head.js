const defaultRedis = require('../../../config/config').redis;
const ServiceStackModel = require('../../models/mongodb/db-service-stack');
const redis = require('redis');
const serviceStackHelper = require('../.././helpers/service_stack_helper/service-stack-helper')
const redisClients = {};

const getRedisClient = async(serviceStackId, requestClient= 'apiRedis') =>{
    try{
        console.log("Available RedisClient",Object.keys(redisClients));
        // const redisClient = await createRedisClient('localhost', 6379);
        // return redisClient;
        let redisClientKey = `${serviceStackId}_${requestClient}`;
        if(serviceStackId){
            if(redisClients[redisClientKey]){
                // console.log("Using existing redis-client")
                return redisClients[redisClientKey];
            }else{
                const serviceStack = await serviceStackHelper.getServiceStackConfig(serviceStackId);

                console.log("getRedisClient : ", serviceStack)

                if(serviceStack){
                    let redisInfo;
                    switch(requestClient){
                        case "turboRedis" : 
                            console.log("in case turboRedis")
                            redisInfo = serviceStack.turbo_redis;
                            break;
                        case "turboRouteRedis" : 
                            console.log("in case turboRouteRedis")
                            redisInfo = serviceStack.route_cache_redis;
                            break;
                        default: 
                            console.log("in case apiRedis")
                            redisInfo = serviceStack.api_redis;
                            break;
                    }
                    // const redisInfo = (requestClient === 'turboRedis' ? serviceStack.turbo_redis : serviceStack.api_redis);
                    const {
                        host,
                        port
                    } = redisInfo;
                    console.log("redisInfo",redisInfo);
                    redisClients[redisClientKey] = await createRedisClient(host, port);
                    return redisClients[redisClientKey];
                }
            }
        }
        return false;
    }catch(err){
        console.log(err);
        return false;
    }
}

const createRedisClient = (host, port) =>{
    try{
        return new Promise((resolve, reject)=>{
            const client = redis.createClient(port, host);
            client.on('connect', ()=>{
                return resolve(client);
            })
        })
    }catch(err){
        console.log(err);
        return false;
    }
}

module.exports = {
    getRedisClient
};
// getRedisClient("626bd60cceca7f370a882eb0","apiRedis").then().catch()