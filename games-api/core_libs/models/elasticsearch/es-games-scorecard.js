const esobject = require('../../services/elasticsearch/es-head.js');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const MAX_LEADERBOARD_FETCH_LIMIT = 10000;
const INDEX_NAME = 'asharq-games-scorecard-v2';

const MAPPINGS = {
    "user_id": { "type": "keyword" },
    "user_name": { "type": "text" },
    "email": { "type": "keyword" },
    "project_id": { "type": "keyword" },
    "publisher_id": { "type": "keyword" },
    "game_type": { "type": "keyword" },
    "game_id": { "type": "keyword" },
    "score": { "type": "float" },
    "created_at": {
        "type": "date",
        "format": "yyyy-MM-dd HH:mm:ss"
    },
};

const createSchema = async (serviceStackId) => {
    try {
        const isMappingExist = await esobject.checkMappingExist(INDEX_NAME, serviceStackId);

        let indexCreationResponse = null;
        if (!isMappingExist) {
            indexCreationResponse = await esobject.createIndex(INDEX_NAME, serviceStackId);
        }

        if (indexCreationResponse || isMappingExist) {
            const mappingsResponse = await esobject.putMappings(INDEX_NAME, MAPPINGS, serviceStackId);
            if (mappingsResponse) {
                return true;
            }
        }
        console.error(`Failed to ensure schema for index ${INDEX_NAME}.`);
        return false;
    } catch (err) {
        console.error(`Error creating schema for index ${INDEX_NAME}: ${err.message}`, err);
        throw err;
    }
};

const insertScorecardData = async (scorecardDetails, serviceStackId) => {
    try {
        const scorecardEntryId = uuidv4();
        const document = {
            ...scorecardDetails,
            created_at: moment().format("YYYY-MM-DD HH:mm:ss")
        };

        const insertResponse = await esobject.insertDocument(INDEX_NAME, scorecardEntryId, document, serviceStackId);
        if (insertResponse) {
            console.log(`Scorecard data inserted with ID: ${scorecardEntryId} into index: ${INDEX_NAME}`);
            return true;
        }
        console.log(`Failed to insert scorecard data for ID: ${scorecardEntryId} into index: ${INDEX_NAME}`);
        return false;
    } catch (err) {
        console.error(`Error inserting scorecard data into index: ${INDEX_NAME}: ${err.message}`, err);
        return false;
    }
};


const getLeaderboard = async (filters, serviceStackId) => {
    const {
        project_id,
        game_type,
        game_id,
        startDate,
        endDate,
        sort_order,
        score_type
    } = filters;

    const mustClauses = [
        { term: { project_id } },
        {
            range: {
                created_at: {
                    gte: startDate,
                    lte: endDate,
                    format: "yyyy-MM-dd HH:mm:ss"
                }
            }
        }
    ];

    if (game_type && game_type !== 'all') {
        mustClauses.push({ term: { game_type } });
    }
    if (game_id && game_id !== '') {
        mustClauses.push({ term: { game_id } });
    }

    const validAggs = ['sum', 'avg', 'max', 'min', 'value_count'];
    if (!validAggs.includes(score_type)) {
        console.error(`Invalid score_type: ${score_type}`);
        return [];
    }
    const aggregationMetric = {
        [score_type]: { field: "score" }
    };

    const query = {
        size: 0,
        query: {
            bool: { must: mustClauses }
        },
        aggs: {
            leaderboard: {
                terms: {
                    field: "user_id",
                    size: MAX_LEADERBOARD_FETCH_LIMIT
                },
                aggs: {
                    user_details: {
                        top_hits: {
                            size: 1,
                            _source: ["user_name", "user_id","email"]
                        }
                    },
                    total_score: aggregationMetric,
                    score_sort: {
                        bucket_sort: {
                            sort: [{ "total_score": { order: sort_order } }],
                            size: MAX_LEADERBOARD_FETCH_LIMIT
                        }
                    }
                }
            }
        }
    };
    const response = await esobject.searchDocuments(INDEX_NAME, query, false, serviceStackId);
    return response?.aggregations?.leaderboard?.buckets || [];
};


// Top played games aggregation - counts plays by game_type (or game_id if provided)
const getTopPlayedGames = async (filters, serviceStackId) => {
    const {
        project_id,
        startDate,
        endDate,
        game_type,
        game_id,
        size = 10
    } = filters;

    const mustClauses = [
        { term: { project_id } },
        {
            range: {
                created_at: {
                    gte: startDate,
                    lte: endDate,
                    format: "yyyy-MM-dd HH:mm:ss"
                }
            }
        }
    ];

    if (game_type && game_type !== 'all') {
        mustClauses.push({ term: { game_type } });
    }
    if (game_id && game_id !== '') {
        mustClauses.push({ term: { game_id } });
    }

    const query = {
        size: 0,
        query: {
            bool: { must: mustClauses }
        },
        aggs: {
            games: {
                terms: {
                    field: "game_type",
                    size: Math.max(1, parseInt(size, 10) || 10)
                }
            }
        }
    };

    const response = await esobject.searchDocuments(INDEX_NAME, query, false, serviceStackId);
    return response?.aggregations?.games?.buckets || [];
};


module.exports = {
    createSchema,
    insertScorecardData,
    getLeaderboard,
    getTopPlayedGames,
};