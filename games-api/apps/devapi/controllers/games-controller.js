const esGamesModel = require('../../../core_libs/models/elasticsearch/es-games');
const esAIGamesModel = require('../../../core_libs/models/elasticsearch/es-ai-games');
const esGamesUserModel = require('../../../core_libs/models/elasticsearch/es-games-user');
const esGamesScorecardModel = require('../../../core_libs/models/elasticsearch/es-games-scorecard');
const apiExceptions = require("../../../config/api-exceptions").devapi;
const gamesHelper = require('../../../core_libs/helpers/sortd-games-helper');
const GamesUser = require('../../../core_libs/models/mongodb/db-games-users');
const FeedArticlesModel = require('../../../core_libs/models/mongodb/db-feed-articles');
//const esArticleModel = require('../../../core_libs/models/elasticsearch/es-articles');
//const ProjectDomainsModel = require('../../../core_libs/models/mongodb/db-project-domains');
//const { formatArticleObject } = require("../helpers/article-helper");
const { serverError } = require('../../../config/api-exceptions').request;

const GamesType = [
    {
        game_type: 'headline_scramble',
        game_code: 'headline_scramble',
        display_name: 'Headline Scramble Fix',
        desc: 'Unscramble famous headlines and see if you can put them back in the right order. Test your knowledge of current events in this fast-paced puzzle game!',
        asset_obj: {}
    },
    {
        game_type: 'quiz',
        game_code: 'quiz',
        display_name: 'Quiz',
        desc: 'Answer trivia questions across various topics and challenge yourself to score as high as possible. Perfect for trivia lovers looking to test their knowledge!',
        asset_obj: {}
    },
    {
        game_type: 'hangman',
        game_code: 'hangman',
        display_name: 'Hangman',
        desc: 'Guess the letters to figure out the hidden word before you run out of chances. A classic word-guessing game that’s fun for all ages!',
        asset_obj: {}
    }
];

async function addArticleDetailsToGames(req, gameResponse) {
    if (gameResponse && gameResponse.games && gameResponse.games.length > 0) {
        const article_guids = [...new Set(gameResponse.games.map(game => game.article_guid).filter(guid => guid))];
        const article_data = await FeedArticlesModel.find({ guid: { $in: article_guids } });

        if (article_data && article_data.length > 0) {
            const articleMap = new Map(
                article_data.map(article => [String(article.guid), article])
            );
            const finalResponse = gameResponse.games.map(game => ({
                ...game,
                article_detail: articleMap.get(String(game.article_guid)) || null
            }));
            return { ...gameResponse, games: finalResponse };
        }else{
            return { ...gameResponse, games: null };
        }
          
        // implement the logic to get the article details for the games

        // const gamesWithDetails = gameResponse.games.map(game => ({
        //     ...game,
        //     article_detail: article_data[game.article_id] || null
        // }));

        // return { ...gameResponse, games: gamesWithDetails };


        // const articleIds = [...new Set(gameResponse.games.map(game => game.article_id).filter(id => id))];
        // if (articleIds.length > 0) {
        //     try {
        //         const { publisherId, project_id, serviceStackId } = req;

        //         const projectDomain = await ProjectDomainsModel.findOne({ project_id });
        //         let domainName = "";
        //         if (projectDomain) {
        //             domainName = projectDomain.cdn_url ? `https://${projectDomain.cdn_url}` : projectDomain.demo_host;
        //             if (projectDomain.status == 4) {
        //                 domainName = "https://" + projectDomain.public_host;
        //             }
        //         } else {
        //             console.log(`Project domain not found for project_id: ${project_id}. Article URLs might be incomplete.`);
        //         }

        //         const articlesData = await esArticleModel.getArticlesByArticleIds(
        //             publisherId,
        //             project_id,
        //             serviceStackId,
        //             1,
        //             articleIds
        //         );

        //         const articlesMap = {};
        //         if (articlesData && articlesData.articles && articlesData.articles.length > 0) {
        //             articlesData.articles.forEach(articleDoc => {
        //                 if (articleDoc && articleDoc._source) {
        //                     articlesMap[articleDoc._source.article_id] = formatArticleObject(articleDoc._source, "full", domainName);
        //                 }
        //             });
        //         }

        //         // implement the logic to get the article details for the games

        //         const gamesWithDetails = gameResponse.games.map(game => ({
        //             ...game,
        //             article_detail: articlesMap[game.article_id] || null
        //         }));

        //         return { ...gameResponse, games: gamesWithDetails };

        //     } catch (articleError) {
        //         console.log("Error fetching or processing article details for games:", articleError);
        //         const gamesWithNullDetails = gameResponse.games.map(game => ({
        //             ...game,
        //             article_detail: null
        //         }));
        //         return { ...gameResponse, games: gamesWithNullDetails };
        //     }
        // }
        return gameResponse;
    }
    return gameResponse;
}

const getGames = async (req, res) => {
    try {
        const { project_id, serviceStackId, publisherId } = req;
        const { type } = req.params;
        const { article_guids, category_guids } = req.query;

        if (!project_id || !publisherId) {
            return global.sendErrorResponse(
                res,
                false,
                400,
                apiExceptions.invalidQueryString.code,
                apiExceptions.invalidQueryString.msg
            );
        }

        const filters = {
            game_type: type,
            article_guids,
            category_guids
        };

        const gameResponse = await esAIGamesModel.getGames(project_id, serviceStackId, filters);

        if (gameResponse && gameResponse.games) {
            const finalResponseData = await addArticleDetailsToGames(req, gameResponse);
            global.sendSuccessResponse(res, false, 200, finalResponseData);
        } else {
            global.sendErrorResponse(res, false, 200, 404, (gameResponse && gameResponse.error) || "No games found.");
        }
    } catch (error) {
        console.log("Error in getGames:", error);
        global.sendErrorResponse(res, false, 500, serverError.code, serverError.msg);
    }
};

const getAIGames = async (req, res) => {
    try {
        const { project_id, serviceStackId, publisherId } = req;
        const { game_type } = req.params;
        const { article_guid, category_guid, game_id } = req.query;

        if (!project_id || !publisherId) {
            return global.sendErrorResponse(
                res,
                false,
                400,
                apiExceptions.invalidQueryString.code,
                apiExceptions.invalidQueryString.msg
            );
        }

        const filters = {
            game_type,
            article_guid,
            category_guid,
            game_id,
        };

        const gameResponse = await esAIGamesModel.getGames(project_id, serviceStackId, filters);

        if (gameResponse && gameResponse.games) {
            const finalResponseData = await addArticleDetailsToGames(req, gameResponse);
            global.sendSuccessResponse(res, false, 200, finalResponseData);
        } else {
            global.sendErrorResponse(res, false, 200, 404, (gameResponse && gameResponse.error) || "No games found.");
        }
    } catch (error) {
        console.log("Error in getAIGames:", error);
        global.sendErrorResponse(res, false, 500, serverError.code, serverError.msg);
    }
};
const getGamesConfig = async (req, res) => {
    try {
        const { project_id } = req;
        if (!project_id) {
            return global.sendErrorResponse(
                res,
                false,
                400,
                apiExceptions.invalidQueryString.code,
                apiExceptions.invalidQueryString.msg
            );
        }

        const gameTypesArray = GamesType.map(game => game.game_type);
        const latestArticles = await gamesHelper.getLatestArticlesByGameType(gameTypesArray);
        console.log("[games-controller] latestArticles : ", JSON.stringify(latestArticles, null, 2));

        const latestArticlesMap = latestArticles.reduce((map, article) => {
            map[article.game_type] = article;
            return map;
        }, {});

        const combinedResult = GamesType.map(game => ({
            ...game,
            latest_article: latestArticlesMap[game.game_type] || null,
        }));

        // Check if combinedResult is empty
        if (combinedResult.length === 0) {
            return global.sendSuccessResponse(res, false, 404, []);
        }

        return global.sendSuccessResponse(res, false, 200, combinedResult);
    } catch (error) {
        console.log("Error in getGamesConfig:", error);
        return global.sendErrorResponse(res, false, 500, serverError.code, serverError.msg);
    }
};


const getGamesConfigByFilter = async (req, res) => {
    try {
        const { project_id, serviceStackId } = req
        const { topic, article_guid, category_guid } = req.query
        if (!project_id) {
            return global.sendErrorResponse(
                res,
                false,
                400,
                apiExceptions.invalidQueryString.code,
                apiExceptions.invalidQueryString.msg
            );
        }

        const filters = {
            topic,
            article_guid,
            category_guid
        }

        const response = await esAIGamesModel.getGamesTypes(project_id, serviceStackId, filters);

        if (response && response.game_types) {
            return global.sendSuccessResponse(res, false, 200, GamesType);
        } else {
            return global.sendErrorResponse(res, false, 200, 404, response.error);
        }
    } catch (error) {
        console.log(error)
        global.sendErrorResponse(res, false, 500, serverError.code, serverError.msg)

    }
}

const registerGamesUser = async (req, res) => {
    try {
        const { project_id: projectIdFromReq, serviceStackId: serviceStackId } = req;
        let { user_id, user_name, email, ...allOptionalData } = req.body;
        const project_id = projectIdFromReq;
        if (!user_id || !user_name || !email || !project_id) {
            return global.sendErrorResponse(
                res,
                false,
                400,
                401,
                "user_id, user_name, email, and project_id are required."
            );
        }
        user_name = user_name.trim();
        email = String(email).trim().toLowerCase();


        const existingUser = await esGamesUserModel.getUserByUsernameAndEmailAndProjectId(user_name, email, project_id, serviceStackId);
        if (existingUser) {
            const message = "User with same name and email already exists for this project.";
            return global.sendErrorResponse(
                res,
                false,
                409,
                409,
                message
            );
        }

        const userDataToInsert = {
            user_id,
            user_name,
            email,
            project_id,
            ...allOptionalData
        };
        const success = await esGamesUserModel.insertUserData(userDataToInsert, serviceStackId);

        if (success) {
            return global.sendSuccessResponse(res, false, 200, { message: "User registered successfully." });
        } else {
            return global.sendErrorResponse(
                res,
                false,
                500,
                serverError.code,
                "Failed to register user."
            );
        }
    } catch (error) {
        console.log("Error in registerGamesUser:", error);
        return global.sendErrorResponse(res, false, 500, serverError.code, serverError.msg);
    }
};
const updateGamesUser = async (req, res) => {
    try {
        const { serviceStackId } = req;
        const { user_id, ...updateFields } = req.body;

        if (!user_id) {
            return global.sendErrorResponse(
                res,
                false,
                400,
                apiExceptions.invalidRequestBody.code,
                "user_id is required."
            );
        }

        if (Object.keys(updateFields).length === 0) {
            return global.sendErrorResponse(
                res,
                false,
                400,
                apiExceptions.invalidRequestBody.code,
                "No fields provided for update."
            );
        }

        const success = await esGamesUserModel.updateUserData(user_id, updateFields, serviceStackId);

        if (success) {
            return global.sendSuccessResponse(res, false, 200, { message: "User updated successfully." });
        } else {
            return global.sendErrorResponse(
                res,
                false,
                500,
                501,
                "Failed to update user. User might not exist or an internal error occurred."
            );
        }
    } catch (error) {
        console.log("Error in updateGamesUser:", error);
        return global.sendErrorResponse(res, false, 500, serverError.code, serverError.msg);
    }
};

const updateUserContinueGames = async (req, res) => {
    try {
        const { user_id, continue_games } = req.body;
        if (!user_id || !continue_games) {
            return global.sendErrorResponse(
                res,
                false,
                400,
                apiExceptions.invalidRequestBody.code,
                "user_id and continue_games are required."
            );
        }

        const success = await GamesUser.updateUserContinuousGames(user_id, continue_games);
        if (success) {
            return global.sendSuccessResponse(res, false, 200, { message: "User continue games updated successfully." });
        } else {
            return global.sendErrorResponse(res, false, 500, 501, "Failed to update user continue games.");
        }
    } catch (error) {
        console.log("Error in updateUserContinueGames:", error);
        return global.sendErrorResponse(res, false, 500, serverError.code, serverError.msg);
    }
};

const getContinueGames = async (req, res) => {
    try {
        const { user_id } = req.body;
        if (!user_id) {
            return global.sendErrorResponse(res, false, 400, apiExceptions.invalidRequestBody.code, "user_id is required.");
        }
        const continuousGames = await GamesUser.getContinueGames(user_id);
        console.log("[Saddam] success", continuousGames);
        if (continuousGames !== null) {
            return global.sendSuccessResponse(res, false, 200, { 
                continuous_games: continuousGames || [],
                message: "User continue games fetched successfully." 
            });
        } else {
            return global.sendErrorResponse(res, false, 500, 501, "Failed to fetch user continue games.");
        }
    }
    catch (error) {
        console.log("Error in getContinueGames:", error);
        return global.sendErrorResponse(res, false, 500, serverError.code, serverError.msg);
    }
};

const deleteGamesUser = async (req, res) => {
    try {
        const { serviceStackId } = req;
        const { user_id } = req.body;

        if (!user_id) {
            return global.sendErrorResponse(
                res,
                false,
                400,
                apiExceptions.invalidRequestBody.code,
                "user_id is required."
            );
        }

        const existingUser = await esGamesUserModel.getUserById(user_id, serviceStackId);
        if (!existingUser) {
            return global.sendErrorResponse(
                res,
                false,
                404, // Not Found
                404,
                "User not found."
            );
        }

        const success = await esGamesUserModel.updateUserData(user_id, { status: false }, serviceStackId);

        if (success) {
            return global.sendSuccessResponse(res, false, 200, { message: "User status updated to false (deactivated)." });
        } else {
            return global.sendErrorResponse(res, false, 500, 501, "Failed to update user status.");
        }
    } catch (error) {
        console.log("Error in deleteGamesUser:", error);
        return global.sendErrorResponse(res, false, 500, serverError.code, serverError.msg);
    }
};

const insertGameScore = async (req, res) => {
    try {
        const { project_id, publisherId: publisher_id, serviceStackId } = req;
        const { user_id, game_type, score, game_id, user_name,email } = req.body;

        if (!user_id || !game_type || score === undefined || !project_id || !publisher_id) {
            return global.sendErrorResponse(
                res,
                false,
                400,
                401,
                "user_id, game_type, score, project_id, and publisher_id,email are required."
            );
        }

        // const userData = await esGamesUserModel.getUserById(user_id, serviceStackId);
        // if (!userData || !userData.user_name) {
        //     return global.sendErrorResponse(
        //         res,
        //         false,
        //         404,
        //         apiExceptions.userNotFound.code || 'USER_NOT_FOUND', // Add userNotFound to apiExceptions if not present
        //         "User not found or user_name is missing."
        //     );
        // }

        // await esGamesScorecardModel.createSchema(serviceStackId);

        const scorecardDetails = {
            user_id,
            user_name: user_name || "",
            email,
            project_id,
            publisher_id,
            game_type,
            score: parseFloat(score),
            game_id: game_id || null,
        };

        const success = await esGamesScorecardModel.insertScorecardData(scorecardDetails, serviceStackId);

        if (success) {
            return global.sendSuccessResponse(res, false, 201, { message: "Game score inserted successfully." });
        } else {
            return global.sendErrorResponse(
                res,
                false,
                500,
                serverError.code,
                "Failed to insert game score."
            );
        }
    } catch (error) {
        console.log("Error in insertGameScore:", error);
        return global.sendErrorResponse(res, false, 500, serverError.code, serverError.msg);
    }
};

const getGameLeaderboard = async (req, res) => {
    try {
        const { project_id, serviceStackId } = req;
        const queryParams = req.query;
        const pathParams = req.params;

        const filters = gamesHelper.prepareLeaderboardFilters(queryParams, pathParams, project_id);
        const leaderboardData = await gamesHelper.getFormattedLeaderboard(filters, serviceStackId);

        return global.sendSuccessResponse(res, false, 200, leaderboardData);

    } catch (error) {
        console.log("Error in getGameLeaderboard:", error);
        const code = error.message.includes("Invalid custom date range format") ? 400 : 500;
        return global.sendErrorResponse(res, false, code, code, error.message);
    }
};

module.exports = {
    getGames,
    getGamesConfig,
    getGamesConfigByFilter,
    getAIGames,
    registerGamesUser,
    updateGamesUser,
    updateUserContinueGames,
    getContinueGames,
    insertGameScore,
    getGameLeaderboard,
    deleteGamesUser,
};
