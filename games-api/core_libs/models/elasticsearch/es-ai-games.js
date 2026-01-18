const esobject = require('../../services/elasticsearch/es-head.js');
const moment = require('moment')
const { getEsClients } = require('../../services/elasticsearch/es-clients.js')
const { v4: uuidv4 } = require('uuid');

const index_name_prefix = 'games-'
const mappings = {
    "project_id": {
        "type": "keyword"
    },
    "game_type": {
        "type": "keyword"
    },
    "article_guid": {
        "type": "keyword"
    },
    "custom_quiz_id": {
        "type": "keyword"
    },
    "article_id": {
        "type": "keyword"
    },
    "category_guid": {
        "type": "keyword"
    },
    "status": {
        "type": "boolean"
    },
    "data": {
        "type": "object",   // Defines the field as an object (JSON-like structure)
        "dynamic": "true"
    },
    "created_at": {
        "type": "date",
        "format": "yyyy-MM-dd HH:mm:ss"
    },
    "updated_at": {
        "type": "date",
        "format": "yyyy-MM-dd HH:mm:ss"
    }


}

const createSchema = async (project_id, serviceStackId) => {
    try {
        var index_name = index_name_prefix + project_id;

        const isMappingExist = await esobject.checkMappingExist(index_name, serviceStackId)

        if (!isMappingExist) {
            var index_response = await esobject.createIndex(index_name, serviceStackId);
        }
        if (index_response || isMappingExist) {
            var mappings_response = await esobject.putMappings(index_name, mappings, serviceStackId);
            if (mappings_response) {
                return true;
            }
        }
        return false;
    } catch (err) {
        throw err;
    }
}

const getGames = async (project_id, service_stack_id, filters) => {
    try {
        const { game_type = "", article_guid = "", category_guid = "", game_id = "" } = filters
        const index_name = index_name_prefix + project_id;
        const mustConditions = [];

        mustConditions.push({ term: { "project_id": project_id } })
        // Always fetch only active games
 mustConditions.push({
        bool: {
            should: [
                { term: { status: true } },  // Ensure status is true if it exists
                { bool: { must_not: { exists: { field: "status" } } } }  // If 'status' doesn't exist, include the document
            ],
            minimum_should_match: 1  // Ensure one of the should clauses is matched
        }
    });
        if (game_type) {
            mustConditions.push({ term: { "game_type": game_type } })
        }

        if (article_guid) {
            mustConditions.push({
                term: {
                    "article_guid": article_guid
                }
            });
        }

        if (category_guid) {

            mustConditions.push({
                term: {
                    "category_guid": category_guid
                }
            });
        }
        if (game_id) {

            mustConditions.push({
                term: {
                    "_id": game_id
                }
            });
        }
        const query = {
            query: {
                bool: {
                    must: mustConditions
                }
            },
            sort: [
                { "created_at": { "order": "desc" } }
            ]
        }
        const response = await esobject.searchDocument(index_name, query, service_stack_id);

        const games_details = response?.hits?.map(document => ({
            ...document._source,
            id: document._id
        })) || [];
        const games_count = response?.total?.value || 0;
        return {
            games: games_details,
            count: games_count
        }
    } catch (error) {
        console.error("Error fetching games: ", error)
        return {
            error: error.message
        }
    }
}


const getGamesTypesByFilter = async (project_id, service_stack_id, filters) => {
    try {
        const { game_type = "", article_guid = "", category_guid = "" } = filters;
        const index_name = index_name_prefix + project_id;
        const mustConditions = [];
        
        // Add filters to mustConditions array
        mustConditions.push({ match: { "project_id": project_id } })
        // Always fetch only active games
        mustConditions.push({ term: { status: true } })
        if (game_type) {
            mustConditions.push({ match: { "game_type": game_type } });
        }

        if (article_guid) {
            mustConditions.push({
                terms: {
                    "article_guid": article_guid
                }
            });
        }

        if (category_guid) {
            mustConditions.push({
                terms: {
                    "category_guid": category_guid
                }
            });
        }

        // Elasticsearch query body with dynamic filters and aggregation
        const query = {
            query: {
                bool: {
                    must: mustConditions
                }
            },
            aggs: {
                game_types: {
                    terms: {
                        field: "game_type",
                    }
                }
            },
            sort: [
                { "created_at": { "order": "desc" } }
            ]
        };

        // Execute search query
        const response = await esobject.searchDocumentFullResponse(index_name, query, service_stack_id);
        console.log("Response:", response?.hits);

        // Process the search hits and aggregation results
        const games_details = response?.hits?.hits?.map(document => ({
            ...document._source,
            id: document._id
        })) || [];

        const games_count = response?.hits?.total?.value || 0;

        // Extract aggregation results for unique apps
        const uniqueApps = response?.aggregations?.game_types?.buckets || [];
        
        return {
            games: games_details,
            count: games_count,
            unique_apps: uniqueApps
        };
    } catch (error) {
        console.error("Error fetching games: ", error);
        return {
            error: error.message
        };
    }
};


const insertGame = async (project_id, service_stack_id, article_id, game_details) => {
    try {
        console.log("game_details: ", project_id, game_details);
        var index_name = index_name_prefix + project_id;

        // Decide upsert strategy:
        // - If article_id present, upsert by (project_id, article_id, game_type)
        // - Else if custom_quiz_id present, upsert by (project_id, custom_quiz_id)
        // - Else always insert a new document (no upsert by game_type)

        let existingDoc = null;
        const hasArticleId = !!(game_details.article_id && String(game_details.article_id).trim());
        const hasCustomQuizId = !!(game_details.custom_quiz_id && String(game_details.custom_quiz_id).trim());

        if (hasArticleId) {
            const searchQuery = {
                query: {
                    bool: {
                        must: [
                            { term: { "project_id": project_id } },
                            { term: { "article_id": game_details.article_id } },
                            { term: { "game_type": game_details.game_type } }
                        ]
                    }
                }
            };
            existingDoc = await esobject.searchDocument(index_name, searchQuery, service_stack_id);
        } else if (hasCustomQuizId) {
            const searchQuery = {
                query: {
                    bool: {
                        must: [
                            { term: { "project_id": project_id } },
                            { term: { "custom_quiz_id": game_details.custom_quiz_id } }
                        ]
                    }
                }
            };
            existingDoc = await esobject.searchDocument(index_name, searchQuery, service_stack_id);
        }

        if (existingDoc?.total?.value > 0) {
            console.log("games doc already exists", existingDoc?.hits[0]?._id);
            updatedData = {
                doc: {
                    data: game_details.data,
                    updated_at: moment().format("YYYY-MM-DD HH:mm:ss")
                }
            };
            const update_response = await esobject.updateDocument(index_name, existingDoc?.hits[0]?._id, updatedData, service_stack_id);
            if (update_response) {
                console.log("games doc updated response : ", update_response)
                return {
                    status: true,
                    game_id: existingDoc.hits[0]._id
                };
            }
            else {
                return {
                    status: false,
                    error: "Could not update games_details."
                };
            }
        }
        const game_id = uuidv4();
        console.log("index name and games_id: ", index_name, game_id)
        // Ensure default status true on creation if not supplied
        if (typeof game_details.status === 'undefined') {
            game_details.status = true;
        }
        var insert_response = await esobject.insertDocument(index_name, game_id, game_details, service_stack_id);
        if (insert_response) {
            console.log("New games doc inserted response : ", insert_response)
            return {
                status: true,
                game_id: game_id
            };
        }
        return {
            status: false,
            error: "Could not insert games_details."
        };
    }
    catch (error) {
        console.log(error);
        return {
            status : false,
            error : error.message
        }
    }
}

const getEsGames = async (project_id, service_stack_id, filters = {}, page = 1, size = 10) => {
    try {
        if (!project_id || !service_stack_id) {
            throw new Error("Missing required parameters: project_id or service_stack_id");
        }
        const index_name = index_name_prefix + project_id;
        const from = (page - 1) * size
        const mustConditions = [];
        if (isNaN(page) || page < 1) {
            throw new Error("Invalid page number. Page must be a positive integer.");
        }
        if (project_id) {
            mustConditions.push({ term: { project_id } });
        }
        // Always fetch only active games
        mustConditions.push({ term: { status: true } });
        
        // Handle created_at range filter separately
        const { created_at_from, created_at_to, custom_quiz_id, ...otherFilters } = filters;
        
        if (created_at_from || created_at_to) {
            const rangeCondition = { range: { created_at: {} } };
            if (created_at_from) {
                rangeCondition.range.created_at.gte = created_at_from;
            }
            if (created_at_to) {
                rangeCondition.range.created_at.lte = created_at_to;
            }
            mustConditions.push(rangeCondition);
        }
        
        // Handle custom_quiz_id filter (more specific than game_id)
        if (custom_quiz_id) {
            mustConditions.push({ term: { custom_quiz_id } });
        }
        
        for (const [field, value] of Object.entries(otherFilters)) {
            if (value && field !== 'created_at') {
                mustConditions.push({ term: { [field]: value } });
            }
        }
        const query = {
            query: {
                bool: {
                    must: mustConditions
                }
            },
            sort: [
                { ["created_at"]: { order: "desc" } }
            ],
        };
        const response = await esobject.searchDocumentFullResponse(index_name, query, service_stack_id, from, size)
        if (!response || !response.hits || !response.hits.hits) {
            throw new Error("Invalid response structure from Elasticsearch");
        }
        const games_details = response?.hits?.hits?.map(document => ({
            ...document._source,
            id: document._id
        })) || [];

        const games_count = response?.hits?.total?.value || 0;
        return {
            status: true,
            data: {
                games: games_details,
                count: games_count,
            }

        };

    } catch (err) {
        console.log(err)
        return {
            status: false,
            error: err.message || "An unexpected error occurred",
        }
    }


}

// Update the status of a game document in Elasticsearch
const setGameStatus = async (project_id, service_stack_id, game_id, status) => {
    try {
        const index_name = index_name_prefix + project_id;
        const updatedData = {
            doc: {
                status: !!status,
                updated_at: moment().format("YYYY-MM-DD HH:mm:ss")
            }
        };
        const update_response = await esobject.updateDocument(index_name, game_id, updatedData, service_stack_id);
        if (update_response) {
            return { status: true };
        }
        return { status: false, error: 'Failed to update game status in ES' };
    } catch (error) {
        console.error('setGameStatus error:', error);
        return { status: false, error: error.message };
    }
}

module.exports = {
    createSchema,
    getGames,
    getGamesTypesByFilter,
    insertGame,
    getEsGames,
    setGameStatus,
}




// insertGame(
//      "637dc15acc15bcd09f4203c3",
//    "626bd60cceca7f370a882eb0",
//     "65fae1a54722b34ac09883ef",
//     {
//         project_id: "637dc15acc15bcd09f4203c3",
//         game_type: "quiz",
//         article_id: "65fae1a54722b34ac09883ef",
//         data: {
//             questions :[],
//            testing : "testing",
//            "ok":"ok"
//         }
//     }
// )



// curl -X GET "primary-stack-001.articles-es.sortd-dev.conf:9200/games-637dc15acc15bcd09f4203c3/_mapping?pretty"
// curl -X DELETE "primary-stack-001.turbo-redis.sortd-dev.conf:9200/games-63902ac1c9e143898afaa4bf"

// const insertGameQuiz = async (project_id, service_stack_id, game_details) => {
//     try {
//         console.log("Game details:",game_details);

//         var index_name = index_name_prefix + project_id;
//         var game_id = uuidv4()
//         console.log("index name and games_id: ", index_name, game_id)
//         var insert_response = await esobject.insertDocument(index_name, game_id, game_details, service_stack_id);
//         if (insert_response) {
//             console.log(insert_response)
//             return true;
//         }
//         return false;
//     }
//     catch (error) {
//         console.log(error);
//     }
// }
// const projectId = "637dc15acc15bcd09f4203c3";
// const serviceStackId = "626bd60cceca7f370a882eb0";
// insertGameQuiz(projectId, serviceStackId, {
//     project_id : projectId,
//     game_type : "quiz",
//     article_guid :'',
//     category_guid : '',
//     data : {
//         questions : [
//             {
//               question: 'Who has been chosen by Donald Trump to lead the newly-created Department of Government Efficiency (DOGE)?',
//               a: 'Vivek Ramaswamy',
//               b: 'Elon Musk',
//               c: 'Donald Trump',
//               d: 'None of the above',
//               answer: 'b'
//             },
//             {
//               question: "What is the acronym 'DOGE' symbolic of in terms of President-elect Trump's campaign messaging?",
//               a: 'His support for renewable energy',
//               b: 'His positive stance on cryptocurrencies',
//               c: 'His focus on government efficiency',
//               d: 'His belief in decentralization',
//               answer: 'b'
//             },
//             {
//               question: "Which cryptocurrency is the acronym 'DOGE' directly related to?",
//               a: 'Bitcoin',
//               b: 'Ethereum',
//               c: 'Dogecoin',
//               d: 'Litecoin',
//               answer: 'c'
//             },
//             {
//               question: "What has been the impact of Trump's victory on bitcoin's value?",
//               a: 'It has remained stable',
//               b: 'It has fallen sharply',
//               c: 'It has reached an all-time high',
//               d: 'It has shown no significant changes',
//               answer: 'c'
//             },
//             {
//               question: "What is a key concern regarding Elon Musk's appointment as head of DOGE?",
//               a: 'His lack of experience in government',
//               b: 'His potential conflict of interest',
//               c: 'His controversial public statements',
//               d: 'His lack of support from other advisors',
//               answer: 'b'
//             }
//           ]
//     },
//     created_at : moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
//     updated_at : moment(new Date()).format("YYYY-MM-DD HH:mm:ss")

// }).then(response=> console.log(response)).catch(response=> console.log(response))


// createSchema("637dc15acc15bcd09f4203c3","626bd60cceca7f370a882eb0").then(response=> console.log(response)).catch(response=> console.log(response))


// getGames(projectId, serviceStackId, {}).then(response=> console.log(response)).catch(response=> console.log(response))

// getGamesTypesByFilter(projectId, serviceStackId, {}).then(response=> console.log(response)).catch(response=> console.log(response))



// const createHeadLineShuffleGame = async () => {
//     try{
//         insertGameQuiz(projectId, serviceStackId, {
//             project_id : projectId,
//             game_type : "headline_shuffle",
//             article_guid :'',
//             category_guid : '',
//             data : {
//                 headline : "Commission orders action against farm fire violators, erring officials"
//             },
//             created_at : moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
//             updated_at : moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
        
//         }).then(response=> console.log(response)).catch(response=> console.log(response))
        
//     }catch(err){
//         console.log(err);
//     }
// }

// createHeadLineShuffleGame().then(response => console.log(response)).catch(response => console.log(response));
