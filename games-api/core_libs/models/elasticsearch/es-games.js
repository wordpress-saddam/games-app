const esobject = require('../../services/elasticsearch/es-head.js');
const moment = require('moment')
const { getEsClients } = require('../../services/elasticsearch/es-clients.js')
const { v4: uuidv4 } = require('uuid');
const { filter } = require('async');

const index_name_prefix = 'games-'
const mappings = {
    "project_id": {
        "type": "keyword"
    },
    "type": {
        "type": "keyword"
    },
    "article_guids": {
        "type": "keyword"
    },
    "category_guids": {
        "type": "keyword"
    },
    "questions": {
        "type": "nested",
        "properties": {
            "question": {
                "type": "text"
            },
            "options": {
                "type": "keyword"
            },
            "answer_index": {
                "type": "integer"
            },
            "answer": {
                "type": "keyword"
            }
        }
    },
    "data": {
        "properties": {
            "word": {
                "type": "keyword"
            },
            "desc": {
                "type": "text"
            }
        }
    },
    "questions_count": {
        "type": "long"
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
        const { type = "", article_guids = "", category_guids = "" } = filters
        const index_name = index_name_prefix + project_id;
        const mustConditions = [];
        if (type) {
            mustConditions.push({ match: { "type": type } })
        }

        if (article_guids) {
            const articleGuidsArray = article_guids.split(",").map(guid => guid.trim());

            mustConditions.push({
                terms: {
                    "article_guids": articleGuidsArray
                }
            });
        }

        if (category_guids) {
            const categoryGuidsArray = category_guids.split(",").map(guid => guid.trim());

            mustConditions.push({
                terms: {
                    "category_guids": categoryGuidsArray
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


module.exports = {
    createSchema,
    getGames,
}

// curl -X GET "primary-stack-001.turbo-redis.sortd-dev.conf:9200/games-637dc15acc15bcd09f4203c3/_mapping?pretty"
// curl -X DELETE "primary-stack-001.turbo-redis.sortd-dev.conf:9200/games-63902ac1c9e143898afaa4bf"
// const insertGameQuiz = async (project_id, service_stack_id, game_details) => {
//     try {
//         var index_name = index_name_prefix + project_id;
//         var game_id = uuidv4()
//         console.log("index anme and games_id: ", index_name, game_id)
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
// insertGameQuiz("637dc15acc15bcd09f4203c3", "626bd60cceca7f370a882eb0", game_details)