const esobject = require('../../services/elasticsearch/es-head.js');
const moment = require('moment');

const INDEX_NAME = 'sortd-games-user';

const MAPPINGS = {
    "user_id": {
        "type": "keyword"
    },
    "user_name": {
        "type": "text"
    },
    "email": {
        "type": "keyword"
    },
    "project_id": {
        "type": "keyword"
    },
    "created_at": {
        "type": "date",
        "format": "yyyy-MM-dd HH:mm:ss"
    },
    "updated_at": {
        "type": "date",
        "format": "yyyy-MM-dd HH:mm:ss"
    },
    "status": {
        "type": "boolean"
    },
    "country": {
        "type": "keyword"
    },
    "city": {
        "type": "keyword"
    },
    "region": {
        "type": "keyword"
    }
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
        throw new Error(`Failed to ensure schema for index ${INDEX_NAME}.`);
    } catch (err) {
        console.error(`Error creating schema for index ${INDEX_NAME}: ${err.message}`, err);
        return false;
    }
};


const insertUserData = async (userData, serviceStackId) => {
    try {
        const { user_id, user_name, project_id, email, ...optionalFields } = userData;

        if (!user_id || !user_name || !project_id) {
            throw new Error("user_id, user_name, and project_id are required.");
        }
        const trimmedUserName = user_name.trim(); const trimmedEmail = (email || "").trim();
        const documentToInsert = {
            user_id: String(user_id),
            user_name: trimmedUserName,
            email: email ?? "",
            project_id: project_id,
            ...optionalFields, // Spread any other provided fields (country, city, region, etc.)
            created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
            status: true
        };

        const insertResponse = await esobject.insertDocument(INDEX_NAME, String(user_id), documentToInsert, serviceStackId);
        if (insertResponse) {
            return true;
        }
        return false;
    } catch (err) {
        console.error(`Error inserting user data for userId: ${userData.user_id}: ${err.message}`, err);
        return false;
    }
};

const updateUserData = async (userId, updateFields, serviceStackId) => {
    try {
        if (Object.keys(updateFields).length === 0) {
            console.log(`No fields to update for userId: ${userId}`);
            return false;
        }

        const documentToUpdate = {
            doc: {
                ...updateFields,
                updated_at: moment().format("YYYY-MM-DD HH:mm:ss")
            }
        };

        const updateResponse = await esobject.updateDocument(INDEX_NAME, String(userId), documentToUpdate, serviceStackId);
        if (updateResponse) {
            return true;
        }
        return false;
    } catch (err) {
        console.error(`Error updating user data for userId:`, err);

        return false;
    }
};

const getUserById = async (userId, serviceStackId) => {
    try {
        const userDocument = await esobject.getDocument(INDEX_NAME, String(userId), serviceStackId);
        if (userDocument && userDocument.found) {
            return userDocument._source;
        }
        return null;
    } catch (err) {

        console.error(`Error retrieving user data for userId: ${userId}`, err);
        return null;
    }
};

const getUsersByIds = async (userIds = [], projectId, serviceStackId) => {
    try {
        if (!Array.isArray(userIds) || userIds.length === 0) return [];
        const must = [{ terms: { user_id: userIds.map(String) } }];
        if (projectId) {
            must.push({ term: { project_id: projectId } });
        }
        const query = {
            size: userIds.length,
            query: { bool: { must } },
            _source: ["user_id", "user_name", "email", "status", "country", "city", "region"]
        };
        const response = await esobject.searchDocument(INDEX_NAME, query, serviceStackId);
        return (response?.hits || []).map(h => h._source);
    } catch (err) {
        console.error('Error retrieving users by ids:', err);
        return [];
    }
};

const getUserByUsernameAndEmailAndProjectId = async (userName, email, projectId, serviceStackId) => {
    try {
        const trimmedUserName = String(userName || "").trim();

        if (!trimmedUserName) {
            return null;
        }
        const query = {
            query: {
                bool: {
                    must: [
                        { match_phrase: { "user_name": trimmedUserName } },
                        { match_phrase: { "email": email } },
                        { term: { "project_id": projectId } },
                        { term: { "status": true } }
                    ]
                }
            }
        };
        const response = await esobject.searchDocument(INDEX_NAME, query, serviceStackId);
        if (response && response.hits && response.hits.length > 0) {
            return response.hits[0]._source;
        }
        return null;
    } catch (err) {
        console.error(`Error retrieving user by username AND email for projectId: ${projectId}`, err);
        return null;
    }
};

// date_histogram aggregation for new users created over time
const getNewUsersHistogram = async (filters, serviceStackId) => {
    try {
        const { project_id, startDate, endDate, interval = 'day' } = filters || {};
        const mustClauses = [];
        if (project_id) {
            mustClauses.push({ term: { project_id } });
        }
        if (startDate && endDate) {
            mustClauses.push({
                range: {
                    created_at: {
                        gte: startDate,
                        lte: endDate,
                        format: "yyyy-MM-dd HH:mm:ss"
                    }
                }
            });
        }

        const query = {
            size: 0,
            query: { bool: { must: mustClauses } },
            aggs: {
                users_over_time: {
                    date_histogram: {
                        field: "created_at",
                        calendar_interval: interval,
                        format: "yyyy-MM-dd"
                    }
                }
            }
        };

        const response = await esobject.searchDocument(INDEX_NAME, query, serviceStackId);
        return response?.aggregations?.users_over_time?.buckets || [];
    } catch (err) {
        console.error('Error in getNewUsersHistogram:', err);
        return [];
    }
};

module.exports = {
    createSchema,
    insertUserData,
    updateUserData,
    getUserById,
    getUserByUsernameAndEmailAndProjectId,
    getNewUsersHistogram,
    getUsersByIds,
};