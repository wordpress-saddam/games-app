const {
    pushElementToSet,
    fetchSetData,
    deleteKey,
    popElementFromSet,
    getPatternMatchingkeys,
    deletePatternMatchingkeys
} = require('../../services/redis/api-cache-helper')

const ProjectDomainsModel = require("../../models/mongodb/db-project-domains");
const ProjectsModel = require('../../models/mongodb/db-projects');

const {
    cacheListPrefix
} = require('../../../config/config').redis;

const {
    createInvalidation
} = require("../../services/aws/cloudfront-manager")

const moment = require("moment");

const md5 = require("md5");

/**
 * Used for pushing Api Cache Key into Redis
 * @param {Array<string>} ids ids
 * @param {string} apiCacheKey  apiCacheKey
 * @param {string} apiType apitype
 */


const pushApiCacheKey = async (ids, apiCacheKey, apiType, serviceStackId) => {
    try {
        for (let i = 0; i < ids.length; i++) {
            const setsKey = cacheListPrefix[apiType] + ids[i];
            console.log(setsKey)
            const response = await pushElementToSet(setsKey, apiCacheKey, serviceStackId);
            if (response) {
                console.log("Pushed the key into ", apiType, " set")
            }
        }
    } catch (err) {
        console.log(err)
    }
}
/**
 * Used for clear API cache which is present in Redis
 * @param {string} apiType type of api
 * @param {string} id id
 */

const clearApiCache = async (apiType, id, projectId) => {
    try {
        const project = await ProjectsModel.findById(projectId, "service_stack_id");
        console.log(projectId, project)

        if(project){
            const setsKey = cacheListPrefix[apiType] + id;
            const setsData = await fetchSetData(setsKey, project.service_stack_id);
            console.log("===>Found these keys ", setsData)
            for (let i = 0; i < setsData.length; i++) {
                console.log(" -->processing ", setsData[i])
                const response = await deleteKey(setsData[i], project.service_stack_id);
                console.log(" -->deleted key ", setsData[i])
                await popElementFromSet(setsKey, setsData[i],  project.service_stack_id);
                console.log(" -->pop field ", setsData[i])
                console.log("<=== Completed ")
            }
        }        
    } catch (err) {
        console.log(err)
    }
}

const clearTurboCache = async(projectId) =>{
    try{    
        
    }catch(err){
        console.log(err);
        return false;
    }
}



const clearTurboHTMLCache = async(projectId, type, guid=null, source) =>{
    try{    
        const redisClient = "turboRedis";

        const platforms = ["pwa", "amp"];

        if(type ==="allArticles"){
            type = "article";
            guid = "*"
        }else if(type === "all"){
            type = "*";
            guid = "*"
        }else  if(type ==="allCategories"){
            guid = "*";
            type ="category";
        }

        const {
            service_stack_id
        } = await ProjectsModel.findById(projectId, "service_stack_id");


        let {
            status,
            demo_host,
            origin_host,
            public_host
        } = await ProjectDomainsModel.findOne({project_id: projectId})

        if(demo_host){
            demo_host = demo_host.replace("https://", "").replace("http://", "")
        }
        if(origin_host){
            origin_host = origin_host.replace("https://", "").replace("http://", "")
        }
        if(public_host) {
            public_host = public_host.replace("https://", "").replace("http://", "")
        }

        for(let platform of platforms){
            let publicHostCachePattern = `Turbo::${public_host}::${platform}::${type}::${guid}:*`;
            let demoHostCachePattern = `Turbo::${demo_host}::${platform}::${type}::${guid}:*`;
            let originHostCachePattern = `Turbo::${origin_host}::${platform}::${type}::${guid}:*`;
            
            if(guid){
                publicHostCachePattern = `Turbo::${public_host}::${platform}::${type}::${guid}*`;
                demoHostCachePattern = `Turbo::${demo_host}::${platform}::${type}::${guid}*`;
                originHostCachePattern = `Turbo::${origin_host}::${platform}::${type}::${guid}*`;
            }else{
                publicHostCachePattern = `Turbo::${public_host}::${platform}::${type}:*`;
                demoHostCachePattern = `Turbo::${demo_host}::${platform}::${type}:*`;
                originHostCachePattern = `Turbo::${origin_host}::${platform}::${type}:*`;
            }

            const demoHostCacheKeys =  await deletePatternMatchingkeys(demoHostCachePattern, service_stack_id, redisClient) || [];

            console.log("demoHostCacheKeys",demoHostCacheKeys);

            // for(const key of demoHostCacheKeys){
            //     await deleteKey(key,service_stack_id, redisClient);
            // }

            /* 
                if project domain status is 4 which means PWA is running then only
                clear cache of turbo pages
            */
            if(status != 4) {
                continue;
            }
            
            const publicHostCacheKeys =  await deletePatternMatchingkeys(publicHostCachePattern, service_stack_id, redisClient) || [];
            console.log("publicHostCacheKeys",publicHostCacheKeys);

            // Removing as No need to clear origin host after GCP Migration
            // if(publicHostArray.includes(public_host)){
            //     const publicHostCacheKeys =  await deletePatternMatchingkeys(publicHostCachePattern, service_stack_id, redisClient) || [];
                
            //     console.log("publicHostCacheKeys",publicHostCacheKeys);
                
            //     // for(const key of publicHostCacheKeys){
            //     //     await deleteKey(key, service_stack_id , redisClient);
            //     // }
            // }else{
            //     const originHostCacheKeys =  await deletePatternMatchingkeys(originHostCachePattern, service_stack_id, redisClient) || [];
                
            //     console.log("originHostCacheKeys",originHostCacheKeys);
                
            //     // for(const key of originHostCacheKeys){
            //     //     await deleteKey(key,service_stack_id, redisClient);
            //     // }
                
            // }
        }
        console.log("Completed turbo cache clean ");
        return true;
    }catch(err){
        console.log(err);
        return false;
    }
}

const clearTurboConfigCache = async(projectId, source)=>{
    try{
        const redisClient = "turboRedis";
        const platforms = ["pwa", "amp"];

        let {
            status,
            demo_host,
            origin_host,
            public_host
        } = await ProjectDomainsModel.findOne({project_id: projectId})

        const {
            service_stack_id
        } = await ProjectsModel.findById(projectId, "service_stack_id");


        if(demo_host){
            demo_host = demo_host.replace("https://", "").replace("http://", "")
        }
        if(origin_host){
            origin_host = origin_host.replace("https://", "").replace("http://", "")
        }

        if(public_host) {
            public_host = public_host.replace("https://", "").replace("http://", "")
        }

        for(let platform of platforms){
            const publicHostCachePattern = `Turbo::${public_host}::${platform}::config::all`;
            const demoHostCachePattern = `Turbo::${demo_host}::${platform}::config::all`;
            const originHostCachePattern = `Turbo::${origin_host}::${platform}::config::all`;

            const demoHostCacheKeys =  await deletePatternMatchingkeys(demoHostCachePattern, service_stack_id, redisClient);
            
            console.log("demoHostCacheKeys",demoHostCacheKeys)
            
            // for(const key of demoHostCacheKeys){
            //     await deleteKey(key,service_stack_id, redisClient);
            // } 

            /* 
                if project domain status is 4 which means PWA is running then only
                clear cache of turbo pages
            */
            if(status != 4) {
                continue;
            }
            const publicHostCacheKeys =  await deletePatternMatchingkeys(publicHostCachePattern, service_stack_id, redisClient) || [];
            console.log("publicHostCacheKeys",publicHostCacheKeys);

            // Removing as No need to clear origin host after GCP Migration
            // if(publicHostArray.includes(public_host)){
            //     const publicHostCacheKeys =  await deletePatternMatchingkeys(publicHostCachePattern,service_stack_id, redisClient);
                
            //     console.log("publicHostCacheKeys",publicHostCacheKeys)
                
            //     // for(const key of publicHostCacheKeys){
            //     //     await deleteKey(key, service_stack_id, redisClient);
            //     // }
            // }else{
            //     const originHostCacheKeys =  await deletePatternMatchingkeys(originHostCachePattern, service_stack_id, redisClient);
            //     console.log("originHostCacheKeys",originHostCacheKeys);
            //     // for(const key of originHostCacheKeys){
            //     //     await deleteKey(key,service_stack_id, redisClient);
            //     // }
            // }
        }
        console.log("Completed turbo cache clean ");
        return true;
    }catch(err){
        console.log(err);
        return false;
    }
}

const clearTurboRouteCache = async(projectId, type, guid=null, source) =>{
    try{    
        const redisClient = "turboRouteRedis";

        const platforms = ["pwa"];

        if(type ==="allRoutes"){
            type = "routeslug"; 
        }

        const {
            service_stack_id
        } = await ProjectsModel.findById(projectId, "service_stack_id");


        let {
            status,
            demo_host,
            origin_host,
            public_host
        } = await ProjectDomainsModel.findOne({project_id: projectId})

        if(demo_host){
            demo_host = demo_host.replace("https://", "").replace("http://", "")
        }
        if(origin_host){
            origin_host = origin_host.replace("https://", "").replace("http://", "")
        }

        if(public_host) {
            public_host = public_host.replace("https://", "").replace("http://", "")
        }

        if(guid){
            guid = md5(guid);
        }
        for(let platform of platforms){
            let publicHostCachePattern = `Turbo::${public_host}::${platform}::${type}::${guid}:*`;
            let originHostCachePattern = `Turbo::${origin_host}::${platform}::${type}::${guid}:*`;
            let demoHostCachePattern = `Turbo::${demo_host}::${platform}::${type}::${guid}:*`;

            if(guid){
                publicHostCachePattern = `Turbo::${public_host}::${platform}::${type}::${guid}*`;
                originHostCachePattern = `Turbo::${origin_host}::${platform}::${type}::${guid}*`;
                demoHostCachePattern = `Turbo::${demo_host}::${platform}::${type}::${guid}*`;
            }else{
                publicHostCachePattern = `Turbo::${public_host}::${platform}::${type}:*`;
                originHostCachePattern = `Turbo::${origin_host}::${platform}::${type}:*`;
                demoHostCachePattern = `Turbo::${demo_host}::${platform}::${type}:*`;
            }

            const demoHostCacheKeys =  await deletePatternMatchingkeys(demoHostCachePattern, service_stack_id, redisClient) || [];
            
            console.log("demoHostCacheKeys",demoHostCacheKeys)
            
            // for(const key of demoHostCacheKeys){
            //     await deleteKey(key,service_stack_id, redisClient);
            // }
            /* 
                if projects domain status is 4 which means PWA is running then only
                clear cache of turbo pages
            */
            if(status != 4) {
                continue;
            }
                
            const publicHostCacheKeys =  await deletePatternMatchingkeys(publicHostCachePattern, service_stack_id, redisClient) || [];
            console.log("publicHostCacheKeys",publicHostCacheKeys);

            // if(publicHostArray.includes(public_host)){
            //     const publicHostCacheKeys =  await deletePatternMatchingkeys(publicHostCachePattern, service_stack_id, redisClient) || [];
                
            //     console.log("publicHostCacheKeys",publicHostCacheKeys)
                
            //     // for(const key of publicHostCacheKeys){
            //     //     await deleteKey(key, service_stack_id , redisClient);
            //     // }
            // }else{
            //     const originHostCacheKeys =  await deletePatternMatchingkeys(originHostCachePattern, service_stack_id, redisClient) || [];
                
            //     console.log("originHostCacheKeys",originHostCacheKeys)
                
            //     // for(const key of originHostCacheKeys){
            //     //     await deleteKey(key,service_stack_id, redisClient);
            //     // }

            // }
        }
        console.log("Completed turbo cache clean ");
        return true;
    }catch(err){
        console.log(err);
        return false;
    }
}

const clearCloudfrontCache = async(projectId, paths=[])=>{
    try{
        const projectDomains= await ProjectDomainsModel.findOne({
            project_id : projectId
        }, "cdn_dist_id")

        console.log(projectDomains, paths)

        if(projectDomains && projectDomains.cdn_dist_id && paths.length){

            const response = await createInvalidation({
                DistributionId: projectDomains.cdn_dist_id,
                InvalidationBatch: { 
                    CallerReference: moment().unix(), 
                    Paths: { 
                        Quantity: paths.length, 
                        Items: [
                            ...paths
                        ]
                    }
                }
            })

            console.log(response);
        }
        return true;
    }catch(err){
        console.log(err);
        return false;
    }
}


module.exports = {
    pushApiCacheKey,
    clearApiCache,
    clearTurboCache,
    clearTurboHTMLCache,
    clearTurboConfigCache,
    clearCloudfrontCache,
    clearTurboRouteCache,
}