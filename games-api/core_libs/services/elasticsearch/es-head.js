var elasticsearch = require('elasticsearch');
const fs = require('fs');
const {
    paginationLimit
} = require('../../../config/config').apps.devapi;
const {
    hosts
} = require('../../../config/config').elastic;

const {
    getEsClients
} = require('./es-clients')

// var esclient = new elasticsearch.Client({
//     hosts: [
//         ...hosts
//     ]
// });

const MAX_SEARCH_RESULT = 20;

const createIndex = async (indexName, serviceStackId) => {
    try {
        const esclient =  await getEsClients(serviceStackId)

        const resp = await esclient.indices.create({
            index: indexName,
            body: {
                'settings' : {
                    'analysis':{                                
                        'tokenizer' : {
                            'edge_ngram_tokenizer': {
                                'type': 'edge_ngram',
                                'min_gram': '1',
                                'max_gram': '10',
                                'token_chars': [
                                    "letter",
                                    "digit",
                                    "non_spacing_mark",
                                    "combining_spacing_mark"
                                ]
                            }
                        },
                        'analyzer' : {
                            'name_edge_ngram_analyzer': {
                                'type': 'custom',
                                'tokenizer': 'edge_ngram_tokenizer',
                                'filter': ['lowercase']
                            }
                        }
                    }
                }
                // settings: {
                //     index: {
                //         number_of_replicas: 1
                //     }
                // }
            }
        })
        return resp;
    } catch (err) {
        throw err
    }

    // , function (err, resp, status) {
    //     if (err) {
    //         console.log(err);
    //     } else {
    //         console.log("create", resp);
    //         return true;
    //     }
    // });
}

const deleteIndex = async (indexName, serviceStackId) => {

    try{
        const esclient =  await getEsClients(serviceStackId)
        
        const resp = await esclient.indices.delete({
            index: indexName
        })

        return resp;
    }catch(err){
        throw err
    }
    // esclient.indices.delete({
    //     index: indexName
    // }, function (err, resp, status) {
    //     if (err) {
    //         console.log(err);
    //     } else {
    //         console.log("create", resp);
    //         return true;
    //     }
    // });
}

const putMappings = async (indexName, mappings, serviceStackId) => {
    try {
        const esclient =  await getEsClients(serviceStackId)

        const resp = await esclient.indices.putMapping({
            index: indexName,
            body: {
                properties: mappings
            }
        })
        return resp;

    } catch (err) {
        throw err
    }
    // , function (err, resp, status) {
    //     if (err) {
    //         console.log(err);
    //     } else {
    //         return true;
    //     }
    // });
}

const insertDocument = async (indexName, documentId, documentData, serviceStackId) => {
    try {
        const esclient =  await getEsClients(serviceStackId)

        const resp = await esclient.index({
            index: indexName,
            id: documentId,
            body: documentData
        });
        return resp;
    } catch (err) {
        throw err;
    }
   
}
const updateDocument = async (indexName, documentId, documentData, serviceStackId) => {
    try {
        const esclient =  await getEsClients(serviceStackId)
        console.log(documentData);
        const resp = await esclient.update({
            index: indexName,
            id: documentId,
            body: documentData
        });
        return resp;
    } catch (err) {
        throw err;
    }
}


const getDocument = async (indexName, documentId, serviceStackId) => {
    try {
        const esclient =  await getEsClients(serviceStackId)
        const resp = await esclient.get({
            index: indexName,
            id: String(documentId)
        })
        console.log(resp);
        return resp
    } catch (err) {
        // console.log(err);
        if(err.status==404){
            return false;
        }
        throw err
    }
}

const deleteDocument = async (indexName, documentId, serviceStackId) => {
    try {
        console.log("Deleting document:", { indexName, documentId, serviceStackId });
        const esclient =  await getEsClients(serviceStackId)
        const resp = esclient.delete({
            index: indexName,
            id: documentId
        })
        return resp;
    } catch (err) {
        throw err
    }
}



const searchDocument = async (index,q,  serviceStackId, from=false)=>{
    try{

        const esclient =  await getEsClients(serviceStackId)


        let searchQuery = {
            index,
            // q, // Query Update
            body : q,
            size: paginationLimit
        }
        // console.log(searchQuery)
        if(from){
            searchQuery.from = from;
        }
        const resp = await esclient.search(searchQuery);
        return resp.hits
    }catch(err){
        throw err;
    } 
}
const searchDocumentFullResponse = async (index,q,  serviceStackId, from=false,size=paginationLimit)=>{
    try{

        const esclient =  await getEsClients(serviceStackId)
        let searchQuery = {
            index,
            body : q,
            size: size
        }
        if(from){
            searchQuery.from = from;
        }
        const resp = await esclient.search(searchQuery);
        return resp
    }catch(err){
        throw err;
    } 
}
const customSearch = async (index,q, from= false, serviceStackId)=>{
    try{
        const esclient =  await getEsClients(serviceStackId)

        const searchQuery = {
            index : index,
            body : q,
            size: paginationLimit
        }
        if(from){
            searchQuery.from = from;
        }
        // fs.writeFileSync("searchQuery.json", JSON.stringify(searchQuery));
        const resp = await esclient.search(searchQuery);
        
        return resp.hits;
    }catch(err){
        throw err;
    } 
}

const customSearchAll = async (index,q, from= false, serviceStackId, page = false)=>{
    try{
        const esclient =  await getEsClients(serviceStackId)

        const searchQuery = {
            index : index,
            body : q,
        }
        if(page) {
            searchQuery.size = page;
        }
        if(from){
            searchQuery.from = from;
        }
        const resp = await esclient.search(searchQuery);
        
        return resp.hits;
    }catch(err){
        throw err;
    } 
}


const searchDocuments = async (index, body, from= false, serviceStackId)=>{
    try{
        const esclient =  await getEsClients(serviceStackId)

        const searchQuery = {
            index : index,
            size: 0,
            body
        }
        if (from) {
            searchQuery.from = from;
        }
        // console.log("searching");
        // fs.writeFileSync("searchQuery.json", JSON.stringify(searchQuery));
        const resp = await esclient.search(searchQuery);
        console.log("[resp] ", resp);
        // console.log("found");
        // fs.writeFileSync("response.json", JSON.stringify(resp));
        
        return resp;
    }catch(err){
        throw err;
    } 
}

const checkMappingExist = async (index, serviceStackId)=>{
    try{
        const esclient =  await getEsClients(serviceStackId)
        
        const isMappingExist = await esclient.indices.exists({index})
        return isMappingExist;
    }catch(err){
        console.log(err);
    }
}

const addAuthorSlug = async (index, serviceStackId)=>{
    try{
        const esclient =  await getEsClients(serviceStackId)
        const response = await esclient.updateByQuery({
            index,
            body : {
                query : {match_all : {}},
                script : {
                    lang : 'painless',
                    source : 'if(ctx._source.author !=null){ctx._source.author_slug=ctx._source.author.replace(\u0027 \u0027,\u0027-\u0027)}else{ctx._source.author_slug=\u0027 \u0027}',
                },
            },
        });
        return response;
    }catch(err){    
        return false
    } 
}


const setDefaultPostsMenuOrder = async (index, serviceStackId)=>{
    try{
        const esclient =  await getEsClients(serviceStackId);
        const response = await esclient.updateByQuery({
            index,
            body : {
                query : {
                    bool : {
                        "must_not" : {
                            match : {menu_order : 1000 }
                        }
                    }
                },
            script : {
                lang : 'painless',
                source : 'ctx._source.menu_order=1000',
            },
            },
            
        });
        console.log('response',response);
        return response;
    }catch(err){   
        console.log(err); 
        return false
    } 
}

const writeResToFile = async(result,fileName,index)=>{
    try{
        const resultsFilePath = fileName;
        
        let existingResults = {};
        if (fs.existsSync(resultsFilePath)) {
            const resultsData = fs.readFileSync(resultsFilePath, 'utf8');
            existingResults = JSON.parse(resultsData);
        }
        
        existingResults[index] = result;
        
        const updatedResults = JSON.stringify(existingResults, null, 2);
        
        fs.writeFileSync(resultsFilePath, updatedResults);
        
        return result;
    }
    catch(error){
        console.log(error);
        return false;
    }
}
const updateAuthorsArray = async(index, serviceStackId) => {
    try{
        const esclient =  await getEsClients(serviceStackId)
        const response = await esclient.updateByQuery({
            index,
            body : {
                query : {match_all : {}},
                script : {
                    lang : 'painless',
                    source : 'if(ctx._source.authors !=null){ctx._source.authors_array=ctx._source.authors}else if(ctx._source.authors_arr != null){ctx._source.authors_array=ctx._source.authors_arr}else{ctx._source.authors_array=[]}',
                },
            },
        });
        let result = {
            updated: response.updated || 0,
            total: response.total || 0,
            failures: response.failures || [],
        }
        let datawritten = await writeResToFile(result,'workerlogs.json',index)
        console.log("data written to log file -> ",datawritten);
        console.log("Response: ",response);
        return response;
    }
    catch(error){
        console.log(error);
        let result = {
            updated: 0,
            total: 0,
            failures: [error.body.error],
        }
        let datawritten = await writeResToFile(result,'workerlogs.json',index)
        console.log("data written to log file -> ",datawritten);
        return false;
    }
}

const searchArticles = async (index,q, from= false, serviceStackId)=>{
    try{
        const esclient =  await getEsClients(serviceStackId)

        const searchQuery = {
            index : index,
            body : q,
        }
        if(from){
            searchQuery.from = from;
        }
        const resp = await esclient.search(searchQuery);
        
        return resp.hits;
    }catch(err){
        throw err;
    } 
}


const searchArticlesFullResponse = async (index,q, from= false, serviceStackId)=>{
    try{
        const esclient =  await getEsClients(serviceStackId)

        const searchQuery = {
            index : index,
            body : q,
        }
        if(from){
            searchQuery.from = from;
        }
        const resp = await esclient.search(searchQuery);
        
        return resp;
    }catch(err){
        throw err;
    } 
}
// // Usage example:
// const docId = '651d42d6a69d1a052ee8d9e7-6523aa93d1f55c40335d3615-1716982200';
// const index = 'trending-62318e6c88f1a0778e4fcbc8';
// const platform = { name: 'androidTV', hits: 4 };
// getDocument("trending-62318e6c88f1a0778e4fcbc8","651d42d6a69d1a052ee8d9e7-6523de6b7ca2b17b93481b09-1717065000","626bd60cceca7f370a882eb0").then().catch()


module.exports = {
    createIndex,
    deleteIndex,
    putMappings,
    insertDocument,
    deleteDocument,
    getDocument,
    searchDocument,
    searchDocumentFullResponse,
    customSearch,
    customSearchAll,
    checkMappingExist,
    searchDocuments,
    addAuthorSlug,
    setDefaultPostsMenuOrder,
    updateAuthorsArray,
    updateDocument,
    searchArticles,
    searchArticlesFullResponse
}
