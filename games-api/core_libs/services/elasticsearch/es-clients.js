const clients = {};
var elasticsearch = require('elasticsearch');
const ServicestackModel = require("../../models/mongodb/db-service-stack");
const serviceStackHelper = require("../../helpers/service_stack_helper/service-stack-helper")

const getEsClients = async(serviceStackId) =>{
    try{
        // const esClient = new elasticsearch.Client({
        //     hosts: ["http://es.sortd.mobi"]
        // })
        // return esClient;

        if(clients[serviceStackId]){
            console.log("using existing existing elasticsearch client", serviceStackId)
            return clients[serviceStackId];
        }

        console.log("Creating new elasticsearch client ", serviceStackId);

        const serviceStackConfig = await serviceStackHelper.getServiceStackConfig(serviceStackId);

        if(serviceStackConfig){
            const {
                es_articles
            } = serviceStackConfig;
    
            if(!es_articles){
                console.log("no service stack config found for es");
            }
    
            let hosts = [];
    
            //hosts.push(`${es_articles.host}:${es_articles.port}`)
            hosts.push(`${es_articles.host}`)
    
            console.log("hosts", hosts)
    
            const client =  new elasticsearch.Client({
                hosts,
                requestTimeout : 120000
            })

            // Set cluster max_shards_per_node to 3000
            // try {
            //     await client.cluster.putSettings({
            //         body: {
            //             persistent: {
            //                 'cluster.max_shards_per_node': '3000'
            //             }
            //         }
            //     });
            //     console.log(`Successfully set cluster.max_shards_per_node to 3000 for serviceStackId: ${serviceStackId}`);
            // } catch (settingsError) {
            //     console.log(`Warning: Failed to set cluster.max_shards_per_node for serviceStackId ${serviceStackId}:`, settingsError.message);
            //     // Continue even if setting fails - client is still usable
            // }
              
    
            clients[serviceStackId] = client;
            
            return clients[serviceStackId];
        }
    }catch(err){
        console.log(err)
        console.log("Error in connecting with client");
    }
}

module.exports = {
    getEsClients
}
