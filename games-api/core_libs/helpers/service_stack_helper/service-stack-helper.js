const ServiceStackModel = require('../../models/mongodb/db-service-stack');
const slug = require('slug');
const redis = require('redis');
const elasticsearch = require('elasticsearch')

const generateServiceStackSlug = async(name) =>{
    try{

        let serviceStackSlug = slug(name);

        let serviceStack = await ServiceStackModel.findOne({
            slug: serviceStackSlug
        })
        if(!serviceStack){
            return serviceStackSlug;
        }
        let i = 1;
        while(i>0){
            let checkslug = serviceStackSlug + "-" + i;

            serviceStack =  await ServiceStackModel.findOne({
                slug: checkslug
            })

            if(!serviceStack){
                serviceStackSlug = checkslug;
                i=0;
                break;
            }
            i++;
        }
        return serviceStackSlug;
    }catch(err){
        console.log(err);
        return false;
    }   
}

const getServiceStackConfig = async(serviceStackId) =>{
    try{
        if(global[serviceStackId]){
            return global[serviceStackId];
        }

        const serviceStack = await ServiceStackModel.findById(serviceStackId);

        if(!serviceStack){
            console.log("Service stack data not found! invalid stackId ", serviceStackId)
        }
        
        global[serviceStackId] = serviceStack;

        return serviceStack;
    }catch(err){
        console.log(err);
        return false;
    }
}

const checkRedisConnection = (host, port)=>{
    return new Promise((resolve, reject)=>{
        try{
           const client = redis.createClient(port, host);
            client.on('connect', ()=>{
                client.quit();
                return resolve(true);
            })
            client.on("error", (error)=>{
                console.log(error)
                return resolve(false)
            })
        }catch(err){
            console.log(err)
            return resolve(false);
        }
    })
}

const checkElasticSearchConnection = (host, port) =>{
    return new Promise((resolve, reject)=>{
        try{
            const esClient = new elasticsearch.Client({
                host : `${host}:${port}`
            })
            esClient.ping({}, (err)=>{
                if(err){
                    return resolve(false);
                }else{
                    return resolve(true)
                }
            })
        }catch(err){
            console.log(err);
            return resolve(false);
        }
    })
}

module.exports = {
    generateServiceStackSlug,
    getServiceStackConfig,
    checkRedisConnection,
    checkElasticSearchConnection
}