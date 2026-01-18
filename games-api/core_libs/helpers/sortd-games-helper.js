const ProjectGamesConfig = require('../models/mongodb/db-project-games-config.js');
const ProjectGamesModel = require('../models/mongodb/db-project-games.js');
const ProjectsModel = require('../models/mongodb/db-projects.js')
const gamesEsModel = require('../models/elasticsearch/es-ai-games.js')
const esGamesScorecardModel = require('../models/elasticsearch/es-games-scorecard.js');
const esGamesUserModel = require('../models/elasticsearch/es-games-user.js');
const FeedArticlesModel = require('../models/mongodb/db-feed-articles.js');
const GameSettingsModel = require('../models/mongodb/db-game-settings.js');
const FeedArticleGamesModel = require('../models/mongodb/db-feed-article-games.js');

const axios = require('axios');
const moment = require('moment');

const config = require('../../config/config.js');
const envName = config.ENV;


const GENAI_API_DOMAIN = config?.apps?.devapi?.url ?? "http://localhost:5002/";

const OPENAI_API_URL = GENAI_API_DOMAIN + 'v1/genai/games/generate-openai-games';
const VERTEXAI_API_URL = GENAI_API_DOMAIN + 'v1/genai/games/generate-vertexai-games';
const VERTEXAIV2_API_URL = GENAI_API_DOMAIN + 'v1/genai/games/generate-vertexai-v2-games';


const gamesTypeSchema = [
    {
        game_type: 'headline_scramble',
        validate: (game) => !!(game?.status && game.randomized?.length),
    },
    {
        game_type: 'quiz',
        validate: (game) => !!(game?.status && game.data?.questions?.length),
    },
    {
        game_type: 'poll',
        validate: (game) => !!(game?.status && game.data?.polls?.length),
    },
    {
        game_type: 'crossword',
        validate: (game) => !!(game?.status && game.data?.clues?.length),
    },
    {
        game_type: 'hangman',
        validate: (game) => !!(game?.status && game.data?.clue && game.data?.word),
    }
];

// Static games configuration
const GAMES_URL = "https://gameshub.asharq.com"; // Make it dynamic
const staticGames = {
    "xox": {
        "game_id": "7b8d3e24-1d8f-4f5f-b27c-09f3c9ef1234",
        "game_type": "xox",
        "content_type": "static",
        "display_name": "XOX",
        "desc": "The classic game of X and O. Play against a friend or challenge the AI in this strategic battle.",
        "imageUrl": GAMES_URL + "/assets/Xox.jpg",
        "embed_code": `<iframe src='https://gameshub.asharq.com/games/xox?src=article' width='600' height='600' frameborder='0'> </iframe>`
    },
    "hungry-trail": {
        "game_id": "c12d8bc0-2e0b-4b3f-8c10-9ff2e2a9a456",
        "game_type": "hungry-trail",
        "content_type": "static",
        "display_name": "Hungry Trail",
        "desc": "Guide your snake to eat food and grow longer, but be careful not to bite your own tail!",
        "imageUrl": GAMES_URL + "/assets/snake.jpg",
        "embed_code": `<iframe src='https://gameshub.asharq.com/games/hungry-trail?src=article' width='600' height='600' frameborder='0'> </iframe>`
    },
    "card-pair-challenge": {
        "game_id": "0f4ecb22-914b-4c4b-993d-f65a6e6ecbd0",
        "game_type": "card-pair-challenge",
        "content_type": "static",
        "display_name": "Card Pair Challenge",
        "desc": "Test your memory by matching pairs of cards. Can you find them all in the fewest moves?",
        "imageUrl": GAMES_URL + "/assets/memory.jpg",
        "embed_code": `<iframe src='https://gameshub.asharq.com/games/card-pair-challenge?src=article' width='600' height='600' frameborder='0'> </iframe>`
    },
    "grid-logic": {
        "game_id": "5c693dd4-0af5-4b9b-8bb1-1d1017257fd1",
        "game_type": "grid-logic",
        "content_type": "static",
        "display_name": "Number Grid Logic",
        "desc": "Fill the 9x9 grid so that each column, row, and 3x3 box contains digits from 1 to 9.",
        "imageUrl": GAMES_URL + "/assets/sudoku.jpg",
        "embed_code": `<iframe src='https://gameshub.asharq.com/games/grid-logic?src=article' width='600' height='600' frameborder='0'> </iframe>`
    },
    "tile-merge": {
        "game_id": "ae8f3c9b-e22e-45a9-94cb-826f3497f993",
        "game_type": "tile-merge",
        "content_type": "static",
        "display_name": "Tile Merge Puzzle",
        "desc": "Combine tiles to reach 2048 in this addictive puzzle game that tests your strategy",
        "imageUrl": GAMES_URL + "/assets/game2048.jpg",
        "embed_code": `<iframe src='https://gameshub.asharq.com/games/tile-merge?src=article' width='600' height='600' frameborder='0'> </iframe>`
    },
    "5-letter": {
        "game_id": "26e13b67-725d-4c41-b82e-c02be550f67a",
        "game_type": "5-letter",
        "content_type": "static",
        "display_name": "5-Letter Guess",
        "desc": "Guess the 5-letter word in six attempts or less. Each guess reveals color hints for correct letters.",
        "imageUrl": GAMES_URL + "/assets/letter5.jpg",
        "embed_code": `<iframe src='https://gameshub.asharq.com/games/5-letter?src=article' width='600' height='600' frameborder='0'> </iframe>`
    },
    "sky-hopper": {
        "game_id": "8343eabd-0072-4bd0-8fd4-e219d3f5a1f3",
        "game_type": "sky-hopper",
        "content_type": "static",
        "display_name": "Sky Hopper",
        "desc": "Navigate your bird through pipes without touching them. Simple to play, difficult to master!",
        "imageUrl": GAMES_URL + "/assets/Flappy.jpg",
        "embed_code": `<iframe src='https://gameshub.asharq.com/games/sky-hopper?src=article' width='600' height='600' frameborder='0'> </iframe>`
    },
    "block-drop": {
        "game_id": "2e938a61-bf9e-4af6-a0b6-96184c799ad2",
        "game_type": "block-drop",
        "content_type": "static",
        "display_name": "Block Drop Puzzle",
        "desc": "Arrange falling blocks to create complete lines. A timeless classic that never gets old.",
        "imageUrl": GAMES_URL + "/assets/tetris.jpg",
        "embed_code": `<iframe src='https://gameshub.asharq.com/games/block-drop?src=article' width='600' height='600' frameborder='0'> </iframe>`
    },
    "mine-hunt": {
        "game_id": "d52f0dc7-1966-4a4e-bc89-f4e671c8a7cb",
        "game_type": "mine-hunt",
        "content_type": "static",
        "display_name": "Mine Hunt Logic",
        "desc": "Uncover all cells without hitting a mine. Use logic and numbers as clues to clear the field.",
        "imageUrl": GAMES_URL + "/assets/mines.jpg",
        "embed_code": `<iframe src='https://gameshub.asharq.com/games/mine-hunt?src=article' width='600' height='600' frameborder='0'> </iframe>`
    }
};

// Dynamic games configuration
const dynamicGames = {
    "headline_scramble": {
        "game_type": "headline_scramble",
        "content_type": "dynamic",
        "display_name": "Headline Scramble Fix",
        "desc": "Unscramble famous headlines and see if you can put them back in the right order. Test your knowledge of current events in this fast-paced puzzle game!",
        "imageUrl": GAMES_URL + "/assets/scrumble.jpg",
        "embed_code": "<script>(function(){var currentUrl=window.location.href;var script=document.createElement('script');script.src='https://gameshub.asharq.com/widget/game.js?url='+encodeURIComponent(currentUrl)+'&game_type=headline_scramble';script.async=true;document.currentScript.parentNode.insertBefore(script,document.currentScript);})();</script>"
    },
    "quiz": {
        "game_type": "quiz",
        "content_type": "dynamic",
        "display_name": "Quiz",
        "desc": "Answer trivia questions across various topics and challenge yourself to score as high as possible. Perfect for trivia lovers looking to test their knowledge!",
        "imageUrl": GAMES_URL + "/assets/quiz.jpg",
        "embed_code": "<script>(function(){var currentUrl=window.location.href;var script=document.createElement('script');script.src='https://gameshub.asharq.com/widget/game.js?url='+encodeURIComponent(currentUrl)+'&game_type=quiz';script.async=true;document.currentScript.parentNode.insertBefore(script,document.currentScript);})();</script>"
    },
    "hangman": {
        "game_type": "hangman",
        "content_type": "dynamic",
        "display_name": "Hangman",
        "desc": "Guess the letters to figure out the hidden word before you run out of chances. A classic word-guessing game that's fun for all ages!",
        "imageUrl": GAMES_URL + "/assets/hangman.jpg",
        "embed_code": "<script>(function(){var currentUrl=window.location.href;var script=document.createElement('script');script.src='https://gameshub.asharq.com/widget/game.js?url='+encodeURIComponent(currentUrl)+'&game_type=hangman';script.async=true;document.currentScript.parentNode.insertBefore(script,document.currentScript);})();</script>"
    }
};

const validateGamesData = (games) => {
    const results = { validGames: [], invalidGames: [] };

    if (!games || Object.keys(games).length === 0) return results;

    for (const { game_type, validate } of gamesTypeSchema) {
        const game = games[game_type];
        if (game) {
            (validate(game) ? results.validGames : results.invalidGames).push({
                game_type,
                ...(validate(game) ? game : { error: game?.error?.message || `${game_type} failed validation.` })
            });
        }
    }
    return results;
};
const processAPIResponse = (apiName, apiResponse) => {
    if (!apiResponse?.games || !apiResponse?.games?.status) {
        console.log(`${apiName} API response invalid:`, apiResponse);
        return { validGames: [], invalidGames: [] };
    }
    return validateGamesData(apiResponse.games);
};
const callGenAIAPI = async (url, accessKey, secretKey, content) => {
    const config = {
        method: 'post',
        url,
        headers: {
            'Access-Key': accessKey,
            'Secret-Key': secretKey,
            'Content-Type': 'application/json',
        },
        data: JSON.stringify(content),
        maxBodyLength: Infinity,
    };

    try {
        const response = await axios.request(config);
        if (response?.data?.status === false) {
            console.log(`Status False on calling ${url} response issue:`, response.data);
            return response?.data;
        }
        return response?.data?.data ?? {};
    } catch (error) {
        console.log(`Error calling ${url}:`, error);
        return {
            status: false,
            error: {
                message: error.response?.data || error.message
            }
        };
    }
};


const chunkArray = (arr, size) => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
};

const getGames = async (accessKey, secretKey, content) => {

    const openAIGames = [];
    const vertexAIGames = [];

    content.game_types.forEach((game) => {
        // if (game === 'quiz' || game === 'headline_scramble') {
        //     openAIGames.push(game);
        // } else {
        //     vertexAIGames.push(game);
        // }
        vertexAIGames.push(game);
    });

    const openAIContent = { ...content, game_types: openAIGames };
    const vertexAIContent = { ...content, game_types: vertexAIGames };
    let vertexAIResponse = {};  // Initialize it here as an empty object

    try {
        // Process OpenAI content (if there are games for OpenAI)
        const openAIResponse = openAIGames.length
            ? await callGenAIAPI(OPENAI_API_URL, accessKey, secretKey, openAIContent)
            : {};

        // Process VertexAI content in batches of 3 games
        let vertexAIResponses = [];
        if (vertexAIGames.length) {
            // Split the games into chunks of 3
            const vertexGameChunks = chunkArray(vertexAIGames, 3);
            const vertexRequests = vertexGameChunks.map((chunk) => {
                const chunkContent = { ...vertexAIContent, game_types: chunk };
                return callGenAIAPI(VERTEXAI_API_URL, accessKey, secretKey, chunkContent);
            });

            // Wait for all the requests to finish
            vertexAIResponses = await Promise.all(vertexRequests);
            vertexAIResponse = vertexAIResponses.reduce((acc, response) => {
                // Here you can merge the game response into the main response.
                // If needed, you can adjust the merging logic based on your exact response structure
                Object.assign(acc, response);  // Merge each response object into the accumulator
                return acc;
            }, {});
        }

        return {
            openAI: openAIResponse,
            vertexAI: vertexAIResponse
        };
    } catch (error) {
        console.log('Error while combining responses:', error);
        return false;
    }
};



const fetchGameDetails = async (articleId, projectId) => {
    try {
        const projectGamesConfig = await ProjectGamesConfig.findOne({
            project_id: projectId,
            status: true
        });

        if (!projectGamesConfig) {
            console.log(`Games are not enabled for project_id: ${projectId}`);
            return [];
        }

        const projectGames = await ProjectGamesModel.find({
            article_id: articleId,
            project_id: projectId,
            status: true
        }).select('game_id game_type');

        const gameDetails = projectGames.map(game => ({ game_id: game.game_id, game_type: game.game_type }));
        return gameDetails;
    } catch (error) {
        console.log('Error in checkAndInsertGameIds:', error.message);
        return [];
    }
};

const fetchFeedArticleGameDetails = async (articleId, feedId) => {
    try {
        const gameSettings = await GameSettingsModel.getSettingsByFeedId(feedId);

        if (!gameSettings || !gameSettings.enabled) {
            console.log(`Games are not enabled for feed_id: ${feedId}`);
            return [];
        }

        const feedArticleGames = await FeedArticleGamesModel.find({
            article_id: articleId,
            feed_id: feedId,
            status: true
        }).select('game_id game_type');

        const gameDetails = feedArticleGames.map(game => ({ game_id: game.game_id, game_type: game.game_type }));
        return gameDetails;
    } catch (error) {
        console.log('Error in fetchFeedArticleGameDetails:', error.message);
        return [];
    }
};

// Feed Article Games Ingestion - Modified version for feed articles
const feedArticleIngestionStart = async ({ article_id }) => {
    try {
        console.log(`Starting Games ingestion for feed article_id: ${article_id}`);
        
        // Get feed article
        const article = await FeedArticlesModel.findById(article_id);
        if (!article) {
            console.log(`Feed article not found for ID: ${article_id}`);
            return false;
        }

        const feedId = article.feed_id;
        if (!feedId) {
            console.log(`Feed ID not found for article_id: ${article_id}`);
            return false;
        }

        // Get game settings for this feed
        const gameSettings = await GameSettingsModel.getSettingsByFeedId(feedId);
        if (!gameSettings) {
            console.log(`Game settings not found for feed_id: ${feedId}`);
            return false;
        }

        // Check if games generation is enabled
        if (!gameSettings.enabled) {
            console.log(`Games generation is disabled for feed_id: ${feedId}`);
            return false;
        }

        // Check if games are selected
        const game_types = gameSettings.games || [];
        if (!game_types || game_types.length === 0) {
            console.log(`No games selected for feed_id: ${feedId}`);
            return false;
        }

        // Check if API credentials are available
        if (!gameSettings.access_key || !gameSettings.secret_key) {
            console.log(`API credentials not found for feed_id: ${feedId}`);
            return false;
        }

        // Prepare data for games API
        const data = {
            headline: article.title || '',
            content: article.content || article.description || '',
            game_types: game_types,
            language: gameSettings.language || 'Arabic'
        };
//console.log("data: ", data);
        // Call games API
        const apiResponses = await getGames(gameSettings.access_key, gameSettings.secret_key, data);

        // Validate games data
        const openAIResults = validateGamesData(apiResponses.openAI?.status === true ? apiResponses.openAI : {});
        const vertexAIResults = validateGamesData(apiResponses.vertexAI?.status === true ? apiResponses.vertexAI : {});

        const validGames = [...openAIResults.validGames, ...vertexAIResults.validGames];
        const invalidGames = [...openAIResults.invalidGames, ...vertexAIResults.invalidGames];
//console.log("validGames: ", validGames);
        // Use feed_id as project_id for ES operations (to maintain ES structure)
        // Create ES index if it doesn't exist (using feed_id)
        const projectId = config?.projectId ?? '694531970d0532889400d79c'; // Default projectID for feed articles
        const serviceStackId = config?.serviceStackId ?? '626bd60cceca7f370a882eb0'; // Default service stack for feed articles
        const esIndexCreated = await gamesEsModel.createSchema(projectId, serviceStackId);
        if (!esIndexCreated) {
            console.log(`Failed to create ES index for project_id: ${projectId}`);
        }

        // Insert valid games into ElasticSearch
        for (const game of validGames) {
            let gameDataToInsert = {};
            if (game.game_type === "headline_scramble") {
                gameDataToInsert = { headline: article.title, randomized: game.randomized };
            } else {
                gameDataToInsert = game.data;
            }

            // Insert into ES using feed_id as project_id
            const insertedResponse = await gamesEsModel.insertGame(
                projectId, 
                serviceStackId, 
                article_id.toString(), 
                {
                    project_id: projectId, 
                    article_id: article_id.toString(),
                    game_type: game.game_type,
                    article_guid: article.guid || '',
                    category_guid: '',
                    data: gameDataToInsert,
                    created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
                    updated_at: moment().format("YYYY-MM-DD HH:mm:ss")
                }
            );

            if (insertedResponse?.status) {
                console.log("Feed Article Games Inserted/Updated Successfully:", game.game_type);
                // Create mapping in MongoDB
                await FeedArticleGamesModel.insertMapping({
                    feed_id: feedId,
                    article_id: article_id,
                    game_type: game.game_type,
                    article_guid: article.guid || '',
                    category_guid: '',
                    categories: article.categories || [],
                    game_id: insertedResponse.game_id
                });
            }
        }

        if (validGames.length === 0) {
            console.log(`No valid games generated for article_id: ${article_id}`);
            return false;
        }

        // Fetch game details for potential future use
        const gameDetail = await fetchFeedArticleGameDetails(article_id, feedId);
        if (gameDetail?.length) {
            console.log(`Game details fetched for article_id: ${article_id}`, gameDetail.length);
        }

        console.log(`Games ingestion completed successfully for feed article_id: ${article_id}`);
        return true;
    } catch (err) {
        console.log("Error in feedArticleIngestionStart:", err);
        return false;
    }
};


// const ingestionStart = async ({ project_id, article_id }) => {
//     try {
//         console.log(`Starting Games ingestion for article_id: ${article_id} in project_id: ${project_id}`);
//         const [article, project] = await Promise.all([
//             ArticlesModel.findOne({ _id: article_id, project_id }),
//             ProjectGamesConfig.findOne({ status: true, project_id }).populate('project_id', 'language service_stack_id enabled_games publishers_id')
//         ]);

//         if (!article) {
//             console.log(`Article not found for ID: ${article_id}`);
//             return false;
//         }
//         if (!project) {
//             console.log(`Games not enabled for project ID: ${project_id}`);
//             return false;
//         }

//         article.games = article.games || {};

//         const projectCred = await PublisherKeysModel.loadOneByFilters({ project_id, });
//         if (!projectCred) {
//             console.log(`Credentials not found for project ID: ${project_id}`);
//             article.games.status = "failed";
//             article.games.fail_reason = 'Publisher Credentials not found for this project';
//             await article.save();
//             return false;
//         }

//         const game_types = project.enabled_games;
//         if (!game_types || game_types.length === 0) {
//             console.log(`No game types enabled for project ID: ${project_id}`);
//             article.games.status = "failed";
//             article.games.fail_reason = 'No games are selected for this project';
//             await article.save();
//             return false;
//         }

//         const data = {
//             headline: article.title,
//             content: article.body,
//             game_types: game_types,
//             language: project.language
//         };

//         const apiResponses = await getGames(projectCred.access_key, projectCred.secret_key, data);
//         // console.log("Games API Response:", JSON.stringify(apiResponses, undefined, 4));

//         const openAIResults = validateGamesData(apiResponses.openAI?.status === true ? apiResponses.openAI : {});
//         const vertexAIResults = validateGamesData(apiResponses.vertexAI?.status === true ? apiResponses.vertexAI : {});

//         const validGames = [...openAIResults.validGames, ...vertexAIResults.validGames];
//         const invalidGames = [...openAIResults.invalidGames, ...vertexAIResults.invalidGames];

//         // console.log("Valid Games:", validGames);
//         // console.log("Invalid Games:", invalidGames);

//         // Store detailed game statuses in `article.games`
//         article.games.validGames = validGames.map(game => game.game_type);
//         article.games.invalidGames = invalidGames.map(game => ({
//             game_type: game.game_type,
//             reason: game.error
//         }));

//         const serviceStackId = project.project_id.service_stack_id;
//         for (const game of validGames) {
//             let gameDataToInsert = {};
//             if (game.game_type === "headline_scramble") {
//                 gameDataToInsert = { headline: article.title, randomized: game.randomized };
//             } else {
//                 gameDataToInsert = game.data;
//             }

//             const insertedResponse = await gamesEsModel.insertGame(project_id, serviceStackId, article_id, {
//                 project_id,
//                 article_id,
//                 game_type: game.game_type,
//                 article_guid: article.guid,
//                 category_guid: '',
//                 data: gameDataToInsert,
//                 created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
//                 updated_at: moment().format("YYYY-MM-DD HH:mm:ss")
//             });

//             if (insertedResponse?.status) {
//                 console.log("Games Inserted/Updated Successfully:", game.game_type);
//                 await ProjectGamesModel.insertMapping({
//                     project_id,
//                     article_id,
//                     game_type: game.game_type,
//                     article_guid: article.guid,
//                     category_guid: '',
//                     categories: article.categories || [],
//                     game_id: insertedResponse.game_id
//                 });
//             }
//         }

//         if (validGames.length) {
//             const gameDetail = await fetchGameDetails(article_id, project_id);
//             // console.log("gameIds: ", gameIds);
//             if (gameDetail?.length) {
//                /* const response = await articleEsModel.updateGameDetail(article_id, project.project_id.publishers_id, serviceStackId, gameDetail);
//                 if (response?.status) {
//                     console.log("Games IDs updated successfully");
//                     clearGamesCaches(project_id, [
//                         { command: 'clearCache.api.article.all', id: article_id, projectId: project_id },
//                         { command: 'clearCache.turbo.article', projectId: project_id, guid: article.guid }
//                     ]);
//                 } */
//             }
//         }
//         else {
//             article.games.status = "failed";
//             article.games.fail_reason = "None of the Games generated";
//             // console.log("Article to be saved : ", article)
//             await article.save();
//             return true;
//         }

//         // if (invalidGames.length) {
//         //     article.games.status = "failed";
//         //     article.games.fail_reason = 'Some games failed validation';
//         //     await article.save();
//         //     return false;
//         // }

//         article.games.status = "generated";
//         article.games.fail_reason = "";
//         await article.save();
//         return true;
//     } catch (err) {
//         console.log("Error:", err);
//         return false;
//     }
// };

// Common cache clear helper for game-related updates
const clearGamesCaches = (project_id, extraCommands = []) => {
    try {
        const commands = [
            { command: 'clearCache.turbo.home', projectId: project_id },
            { command: 'clearCache.api.article.all', id: project_id, projectId: project_id },
            ...extraCommands,
        ];
        //startClearCache(commands);
    } catch (err) {
        console.log('clearGamesCaches error:', err);
    }
};

// Central helpers
const nowTs = () => moment().format('YYYY-MM-DD HH:mm:ss');

const getInfra = async (projectId) => {
    const project = await ProjectsModel.findById(projectId, 'service_stack_id');
    if (!project) {
        return { error: { code: 1102, message: `Project with ID ${projectId} not found` } };
    }
    return { serviceStackId: project.service_stack_id, indexName: `games-${projectId}` };
};

const ensureGamesIndex = async (projectId) => {
    const infra = await getInfra(projectId);
    if (infra.error) return infra;
    const ok = await gamesEsModel.createSchema(projectId, infra.serviceStackId);
    if (!ok) return { error: { code: 1005, message: `Failed to create ES mapping for project ${projectId}` } };
    return infra;
};

// Create a custom quiz ingestion that persists provided quiz data directly
// const customQuizIngestion = async (params) => {
//     const { project_id: projectId, game_type: gameType, data: quizData } = params;

//     try {
//         if (!projectId || !gameType || !quizData) {
//             return { status: false, error: { code: 1001, message: 'Missing required parameters: project_id, game_type, data' } };
//         }
//         const [projectGameConfig, infra] = await Promise.all([
//             ProjectGamesConfig.findOne({ status: true, project_id: projectId }),
//             ensureGamesIndex(projectId)
//         ]);

//         if (!projectGameConfig) {
//             return { status: false, error: { code: 1002, message: 'Games feature not enabled for this project' } };
//         }
//         if (!projectGameConfig.enable_custom_quiz) {
//             return { status: false, error: { code: 1003, message: 'Custom quiz feature not enabled for this project' } };
//         }
//         if (infra?.error) {
//             return { status: false, error: infra.error };
//         }

//         const timestamp = nowTs();
//         const esInsertResult = await gamesEsModel.insertGame(projectId, infra.serviceStackId, null, {
//             project_id: projectId,
//             game_type: gameType,
//             data: quizData,
//             article_id: '',
//             article_guid: '',
//             category_guid: '',
//             custom_quiz_id: quizData?.quiz_id || '',
//             created_at: timestamp,
//             updated_at: timestamp,
//         });

//         if (!esInsertResult?.status) {
//             return { status: false, error: { code: 1006, message: esInsertResult?.error || 'Failed to insert quiz game in Elasticsearch' } };
//         }

//         await ProjectGamesModel.insertMapping({
//             project_id: projectId,
//             game_type: gameType,
//             game_id: esInsertResult.game_id,
//             article_id: null,
//             article_guid: '',
//             category_guid: '',
//             categories: [],
//             custom_quiz_id: quizData?.quiz_id || '',
//             quiz_title: quizData?.title || '',
//         });

//         clearGamesCaches(projectId);

//         return { status: true, data: { game_id: esInsertResult.game_id } };

//     } catch (error) {
//         console.error('customQuizIngestion error:', error);
//         return { status: false, error: { code: 5001, message: error.message } };
//     }
// };

// Removed updateCustomQuiz as insertGame handles upsert/update for custom quizzes

// Soft-delete a custom quiz by marking mapping as inactive
const deleteCustomQuiz = async (params) => {
    const { project_id: projectId, game_id: gameId } = params || {};
    try {
        if (!projectId || !gameId) {
            return { status: false, error: { code: 1201, message: 'Missing required parameters: project_id, game_id' } };
        }

        const mapping = await ProjectGamesModel.findOneAndUpdate(
            { project_id: projectId, game_id: gameId },
            { $set: { status: false } },
            { new: true }
        );

        if (!mapping) {
            return { status: false, error: { code: 1202, message: `Mapping not found for game_id ${gameId}` } };
        }

        // Update ES status
        const project = await ProjectsModel.findById({ _id: projectId }, 'service_stack_id');
        if (project?.service_stack_id) {
            await gamesEsModel.setGameStatus(projectId, project.service_stack_id, gameId, false);
        }

        clearGamesCaches(projectId);
        return { status: true, data: { game_id: gameId } };
    } catch (error) {
        console.error('deleteCustomQuiz error:', error);
        return { status: false, error: { code: 5201, message: error.message } };
    }
};

// Restore a soft-deleted custom quiz by marking mapping as active (status: true)
const restoreCustomQuiz = async (params) => {
    const { project_id: projectId, game_id: gameId } = params || {};
    try {
        if (!projectId || !gameId) {
            return { status: false, error: { code: 1203, message: 'Missing required parameters: project_id, game_id' } };
        }

        const mapping = await ProjectGamesModel.findOneAndUpdate(
            { project_id: projectId, game_id: gameId },
            { $set: { status: true } },
            { new: true }
        );

        if (!mapping) {
            return { status: false, error: { code: 1204, message: `Mapping not found for game_id ${gameId}` } };
        }

        // Update ES status
        const project = await ProjectsModel.findById({ _id: projectId }, 'service_stack_id');
        if (project?.service_stack_id) {
            await gamesEsModel.setGameStatus(projectId, project.service_stack_id, gameId, true);
        }

        clearGamesCaches(projectId);
        return { status: true, data: { game_id: gameId } };
    } catch (error) {
        console.error('restoreCustomQuiz error:', error);
        return { status: false, error: { code: 5202, message: error.message } };
    }
};

// Set status for a custom quiz mapping (single API to delete/restore)
const setCustomQuizStatus = async (params) => {
    const { project_id: projectId, game_id: gameId, status } = params || {};
    try {
        if (!projectId || !gameId || typeof status === 'undefined') {
            return { status: false, error: { code: 1205, message: 'Missing required parameters: project_id, game_id, status' } };
        }

        const mapping = await ProjectGamesModel.findOneAndUpdate(
            { project_id: projectId, game_id: gameId },
            { $set: { status: !!status } },
            { new: true }
        );

        if (!mapping) {
            return { status: false, error: { code: 1206, message: `Mapping not found for game_id ${gameId}` } };
        }

        // Update ES status
        const project = await ProjectsModel.findById({ _id: projectId }, 'service_stack_id');
        if (project?.service_stack_id) {
            await gamesEsModel.setGameStatus(projectId, project.service_stack_id, gameId, !!status);
        }

        clearGamesCaches(projectId);
        return { status: true, data: { game_id: gameId, status: mapping.status !== false } };
    } catch (error) {
        console.error('setCustomQuizStatus error:', error);
        return { status: false, error: { code: 5203, message: error.message } };
    }
};


const saveGamesConfig = async (formdata) => {
    try {
        const { project_id, status } = formdata

        const project = await ProjectsModel.findById({ _id: project_id }, "service_stack_id")
        if (!project) {
            throw new Error(`Project with ID ${project_id} not found.`);
        }

        const createESMapping = await gamesEsModel.createSchema(project_id, project.service_stack_id)
        if (!createESMapping) {
            throw new Error(`Failed to create Elasticsearch mapping for project ID ${project_id}.`);
        }

        const gamesStatus = await ProjectGamesConfig.saveConfig("status", project_id, status)
        if (!gamesStatus) {
            throw new Error(`Failed to save game status for project ID ${project_id}.`);
        }
        return gamesStatus;
    } catch (error) {
        console.log(`[Save Games Config Error]: ${error}`);
        throw new Error(`Error in saving game configuration: ${error.message}`);
    }
}

const saveProjectGameConfig = async (formdata) => {
    try {
        const { project_id } = formdata;

        const project = await ProjectsModel.findById({ _id: project_id }, "service_stack_id");
        if (!project) {
            throw new Error(`Project with ID ${project_id} not found.`);
        }

        const createESMapping = await gamesEsModel.createSchema(project_id, project.service_stack_id);
        if (!createESMapping) {
            throw new Error(`Failed to create Elasticsearch mapping for project ID ${project_id}.`);
        }

        const response = await ProjectGamesConfig.saveProjectGamesConfig(formdata, project_id);
        if (!response) {
            throw new Error(`Failed to save game configuration for project ID ${project_id}.`);
        }
        return response;
    } catch (error) {
        console.log(`[Save Games Config Error]: ${error}`);
        throw new Error(`Error in saving game configuration: ${error.message}`);
    }

}

const getGamesConfig = async (project_id) => {
    try {
        const filters = {
            project_id,
        }
        const gamesDetails = await ProjectGamesConfig.loadOneByFilters(filters)
        if (!gamesDetails) {
            throw new Error(`No game configuration found for project ID ${project_id}.`);
        }
        return gamesDetails;
    } catch (error) {
        console.log(`[Get Games Config Error]: ${error}`);
        throw new Error(`Error in fetching game configuration: ${error.message}`);
    }

}

const getGamesConfigWithDetails = async (project_id) => {
    try {
        const filters = {
            project_id,
        }
        const gamesDetails = await ProjectGamesConfig.loadOneByFilters(filters)
        if (!gamesDetails) {
            throw new Error(`No game configuration found for project ID ${project_id}.`);
        }

        const enabledGames = gamesDetails.enabled_games || [];
        let hostName = gamesDetails.host_name || GAMES_URL;

        // Ensure host_name has proper protocol
        if (hostName && !hostName.startsWith('http://') && !hostName.startsWith('https://')) {
            hostName = 'https://' + hostName;
        }

        // Return all static games as array with updated URLs and game_url
        const allStaticGames = Object.values(staticGames).map(game => {
            const updatedImageUrl = game.imageUrl.replace(GAMES_URL, hostName);
            const updatedEmbedCode = game.embed_code.replace(GAMES_URL, hostName);

            // Extract game_url from embed_code src attribute
            const srcMatch = updatedEmbedCode.match(/src=['"]([^'"]*)['"]/);
            const game_url = srcMatch ? srcMatch[1] : `${hostName}/games/${game.game_type}`;

            return {
                ...game,
                imageUrl: updatedImageUrl,
                embed_code: updatedEmbedCode,
                game_url: game_url
            };
        });

        // Filter dynamic games based on enabled_games and update URLs
        const enabledDynamicGames = [];

        enabledGames.forEach(gameType => {
            if (dynamicGames[gameType]) {
                const game = { ...dynamicGames[gameType] };
                game.imageUrl = game.imageUrl.replace(GAMES_URL, hostName);
                game.embed_code = game.embed_code.replace(GAMES_URL, hostName);
                enabledDynamicGames.push(game);
            }
        });

        return {
            project_id: gamesDetails.project_id,
            status: gamesDetails.status,
            static_games: allStaticGames,
            dynamic_games: enabledDynamicGames
        };
    } catch (error) {
        console.log(`[Get Games Config With Details Error]: ${error}`);
        throw new Error(`Error in fetching game configuration with details: ${error.message}`);
    }
}

const getGamesData = async (project_id, game_type, service_stack_id, page = 1, limit = 10) => {
    try {
        const filters = {
            project_id
        };

        // Only add game_type filter if it's provided and not empty
        if (game_type && game_type.trim() !== '') {
            filters.game_type = game_type;
        }

        // Get host_name from project games config
        const gamesConfig = await ProjectGamesConfig.loadOneByFilters({ project_id });
        let hostName = gamesConfig?.host_name || GAMES_URL;

        // Ensure host_name has proper protocol
        if (hostName && !hostName.startsWith('http://') && !hostName.startsWith('https://')) {
            hostName = 'https://' + hostName;
        }

        const gamesResult = await gamesEsModel.getEsGames(project_id, service_stack_id, filters, page, limit);

        if (gamesResult.error) {
            throw new Error(`Error fetching games: ${gamesResult.error}`);
        }

        if (!gamesResult.status) {
            throw new Error(`Error fetching games: ${gamesResult.error}`);
        }

        // Extract only the data field from each game and add embedd_code and game_url
        const gamesData = gamesResult.data.games.map(game => {
            // Get game_type from the game data or use the provided game_type parameter
            const gameType = game.data?.game_type || game_type;

            // Generate game_url and embed code with dynamic game_type and host_name
            const game_url = `${hostName}/games/${gameType}?gameid=${game.id}&src=article`;
            const embeddCode = `<iframe src='${game_url}' width='600' height='600' frameborder='0'> </iframe>`;

            return {
                id: game.id,
                embedd_code: embeddCode,
                game_url: game_url,
                data: {
                    ...game.data
                }
            };
        });

        return {
            project_id,
            game_type: game_type || null, // Return null if no game_type provided
            games: gamesData,
            count: gamesResult.data.count,
            page: page,
            limit: limit
        };
    } catch (error) {
        console.log(`[Get Games Data Error]: ${error}`);
        throw new Error(`Error in fetching games data: ${error.message}`);
    }
}


const getEsGames = async (formdata) => {
    const {
        project_id,
        article_id,
        game_id,
        game_type,
        created_at,
        start_date,
        end_date,
        custom_quiz_id,
        page = 1,
        limit = 10,
    } = formdata

    try {
        const projectData = await ProjectsModel.findOne({
            _id: project_id,
            status: 1
        }, "service_stack_id")
        if (!projectData) {
            throw new Error("Project is not active or does not exist.");
        }

        const serviceStackId = projectData.service_stack_id;
        const sanitizedArticleId = article_id ? article_id.trim() : undefined;
        const sanitizedGameId = game_id ? game_id.trim() : undefined;
        const sanitizedCustomQuizId = custom_quiz_id ? custom_quiz_id.trim() : undefined;
        const filters = {
            article_id: sanitizedArticleId,
            _id: sanitizedGameId,
            game_type,
            created_at,
            custom_quiz_id: sanitizedCustomQuizId,
        }

        // Add date range filters if provided
        if (start_date) {
            filters.created_at_from = moment(start_date).startOf('day').format('YYYY-MM-DD HH:mm:ss');
        }
        if (end_date) {
            filters.created_at_to = moment(end_date).endOf('day').format('YYYY-MM-DD HH:mm:ss');
        }

        const gamesData = await gamesEsModel.getEsGames(project_id, serviceStackId, filters, page, limit)

        if (!gamesData || !gamesData.status) {
            return gamesData;
        }

        // Fetch status mapping from MongoDB for all games
        const gameIds = gamesData.data.games.map(g => g.id);
        let statusMap = {};

        if (gameIds.length > 0) {
            try {
                const mappings = await ProjectGamesModel.find({
                    project_id: project_id,
                    game_id: { $in: gameIds }
                }).select('game_id status');

                statusMap = mappings.reduce((acc, m) => {
                    acc[m.game_id] = m.status !== false;
                    return acc;
                }, {});
            } catch (err) {
                console.log('Error fetching status mappings:', err);
            }
        }

        // Merge status into games data
        gamesData.data.games = gamesData.data.games.map(game => ({
            ...game,
            status: statusMap[game.id] !== undefined ? statusMap[game.id] : true
        }));

        return gamesData;

    } catch (error) {
        console.log(error)
        return {
            status: false,
            error: error.message || "An unexpected error occurred",
        }
    }
}

const fetchGames = async (formdata) => {
    const {
        project_id,
        article_id,
        game_id,
        game_type,
        start_date,
        end_date,
        search,
        status_filter,
        page = 1,
        page_size = 10,
    } = formdata;

    try {

        let filters = {};
        if (project_id) filters.project_id = project_id;
        if (article_id) filters.article_id = article_id.trim();
        if (game_id) filters.game_id = game_id.trim();
        if (game_type) filters.game_type = game_type;

        // Status filter: 'active' => true, 'deleted' => false
        if (typeof status_filter === 'string' && status_filter.trim() !== '') {
            if (status_filter === 'active') {
                filters.status = true;
            } else if (status_filter === 'deleted') {
                filters.status = false;
            }
        }

        // Keyword search across quiz_title only (case-insensitive)
        if (typeof search === 'string' && search.trim() !== '') {
            const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(escaped, 'i');
            filters.quiz_title = { $regex: regex };
        }

        if (start_date || end_date) {
            filters.createdAt = {};

            if (start_date) {
                filters.createdAt.$gte = moment(start_date, moment.ISO_8601).startOf('day').toDate();
            }
            if (end_date) {
                filters.createdAt.$lte = moment(end_date, moment.ISO_8601).endOf('day').toDate();
            }
        }
        const offset = (page - 1) * page_size;
        // console.log("filters: ", filters)
        const gamesData = await ProjectGamesModel.loadAllByFilters(

            filters,
            { createdAt: -1 },
            offset,
            page_size
        );
        return gamesData;

    } catch (error) {
        console.log(error);
        return {
            status: false,
            error: error.message || "An unexpected error occurred",
        };
    }
};


// const getArticleTitle = async (projectId, filterData, page, records) => {
//     try {
//         // console.log("getArticleTitle", projectId, filterData, page, records);
//         let offset = records * (page - 1);
//         let filters = {
//             project_id: projectId
//         };
//         let sortBy = { "article_modified_on": -1 }
//         if (filterData) {
//             if (filterData.title) {
//                 const titleregex = new RegExp(filterData.title.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
//                 filters["title"] = { $regex: titleregex };
//             }
//             if (filterData.categoryids && filterData.categoryids.length > 0) {
//                 filters['categories'] = { "$in": filterData.categoryids };
//             }
//             if (filterData.type) {
//                 filters['type'] = filterData.type;
//             }
//             let publishedOnFilter = {};
//             if (filterData.published_on_from_date && filterData.published_on_from_date != "") {

//                 publishedOnFilter["$gte"] = moment(filterData.published_on_from_date).utc().toDate();
//                 filters["article_published_on"] = {
//                     ...publishedOnFilter,
//                 };
//             }
//             if (filterData.published_on_to_date && filterData.published_on_to_date != "") {
//                 publishedOnFilter["$lte"] = moment(filterData.published_on_to_date).utc().toDate();
//                 filters["article_published_on"] = {
//                     ...publishedOnFilter,

//                 };
//             }
//             let modifiedOnFilter = {};

//             if (filterData.modified_on_from_date && filterData.modified_on_from_date !== "") {

//                 modifiedOnFilter["$gte"] = moment(filterData.modified_on_from_date).utc().toDate();
//                 filters["article_modified_on"] = {
//                     ...modifiedOnFilter,
//                 };
//             }
//             if (filterData.modified_on_to_date && filterData.modified_on_to_date !== "") {
//                 modifiedOnFilter["$lte"] = moment(filterData.modified_on_to_date).utc().toDate();
//                 filters["article_modified_on"] = {
//                     ...modifiedOnFilter,
//                 };
//             }
//             if (filterData.order_by) {
//                 if (filterData.order_by === "published_on") {
//                     sortBy = { "article_published_on": -1 };
//                 }
//             }
//         }

//         const articles = await ArticlesModel.getArticleTitle(filters, sortBy, offset, records);
//         const count = await ArticlesModel.countDocuments(filters);
//         if (articles && articles.length > 0) {
//             return {
//                 status: true,
//                 articles: articles,
//                 count: count,
//             };
//         }
//         else {
//             return {
//                 status: true,
//                 articles: [],
//                 count: 0,
//             };
//         }
//     } catch (err) {
//         console.log(err);
//         return {
//             status: false,
//             error: err.message || "An unexpected error occurred",
//         };
//     }
// }


const getLatestArticlesByGameType = async (gameTypes = []) => {
    if (!Array.isArray(gameTypes) || gameTypes.length === 0) {
        console.log("gameTypes must be a non-empty array.");
        return [];
    }

    const pipeline = [
        {
            $match: {
                game_type: { $in: gameTypes },
                status: true
            }
        },
        {
            $sort: { updatedAt: -1 }
        },
        {
            $group: {
                _id: "$game_type",
                doc: {
                    $first: {
                        _id: "$_id",
                        game_type: "$game_type",
                        updatedAt: "$updatedAt",
                        project_id: "$project_id",
                        article_id: "$article_id",
                        article_guid: "$article_guid",
                        category_guid: "$category_guid",
                        categories: "$categories"
                        // add or remove fields as per your actual needs
                    }
                }
            }
        },
        {
            $replaceRoot: { newRoot: "$doc" }
        }
    ];
    console.log("[sortd-games-helper] pipeline : ", JSON.stringify(pipeline, null, 2));

    try {
        const result = await ProjectGamesModel.aggregate(pipeline).exec();
        console.log("[sortd-games-helper] result : ", JSON.stringify(result, null, 2));
        return result;
    } catch (err) {
        console.log("Error in getLatestArticlesByGameType:", err);
        return [];
    }
};

const prepareLeaderboardFilters = (queryParams, pathParams, project_id) => {
    const {
        start_date,
        end_date,
        game_type,
        game_id,
        top_k = 10,
        sort_order = 'desc',
        user_id
    } = queryParams;

    const {
        duration,
    } = pathParams;

    let startDateMoment, endDateMoment;
    const score_type = pathParams.score_type || 'sum';
    const now = moment();

    if (start_date && end_date) {
        startDateMoment = moment(start_date, "YYYY-MM-DD HH:mm:ss", true);
        endDateMoment = moment(end_date, "YYYY-MM-DD HH:mm:ss", true);
        if (!startDateMoment.isValid() || !endDateMoment.isValid()) {
            throw new Error("Invalid custom date range format. Use YYYY-MM-DD HH:mm:ss");
        }
    } else {
        endDateMoment = now;
        const durationValue = (duration || 'month').toLowerCase();

        const subtractMap = {
            day: { amount: 1, unit: 'days' },
            week: { amount: 1, unit: 'weeks' },
            month: { amount: 1, unit: 'months' },
        };

        const { amount, unit } = subtractMap[durationValue] || subtractMap['day'];
        startDateMoment = moment(endDateMoment).subtract(amount, unit);
    }

    return {
        project_id,
        game_type,
        game_id: game_id ? game_id.trim() : undefined,
        startDate: startDateMoment.format("YYYY-MM-DD HH:mm:ss"),
        endDate: endDateMoment.format("YYYY-MM-DD HH:mm:ss"),
        top_k: parseInt(top_k, 10),
        sort_order,
        score_type,
        user_id,
    };
};


const getFormattedLeaderboard = async (filters, serviceStackId) => {

    const rawBuckets = await esGamesScorecardModel.getLeaderboard(filters, serviceStackId);

    let targetUserInfo = null;
    //to find the specific user info in the leaderboard
    if (filters.user_id && rawBuckets.length > 0) {
        for (let i = 0; i < rawBuckets.length; i++) {
            const bucket = rawBuckets[i];
            const userDetails = bucket.user_details?.hits?.hits[0]?._source;
            const currentUserId = userDetails?.user_id || bucket.key;

            if (currentUserId === filters.user_id) {
                targetUserInfo = {
                    email: userDetails?.email || 'nul',
                    user_name: userDetails?.user_name || 'Anonymous',
                    user_id: userDetails?.user_id || 'nil',
                    score: bucket.total_score?.value,
                    rank: i + 1
                };
                break;
            }
        }
    }


    const displayLeaderboardBuckets = rawBuckets.slice(0, filters.top_k);

    const displayLeaderboard = displayLeaderboardBuckets.map((bucket, index) => {
        const userDetails = bucket.user_details?.hits?.hits[0]?._source;
        return {
            email: userDetails?.email || 'nill',
            user_name: userDetails?.user_name || '',
            score: bucket.total_score?.value,
            user_id: userDetails?.user_id || 'nil',
            rank: index + 1
        };
    });

    return {
        leaderboard: displayLeaderboard,
        user_info: targetUserInfo || {}
    };
};



// const getFormattedLeaderboard = async (filters, serviceStackId) => {

//     const { buckets = [], total = 0 } = await esGamesScorecardModel.getLeaderboard(filters, serviceStackId);

//     let targetUserInfo = null;
//     if (filters.user_id && buckets.length > 0) {
//         for (let i = 0; i < buckets.length; i++) {
//             const bucket = buckets[i];
//             const userDetails = bucket.user_details?.hits?.hits[0]?._source;
//             const currentUserId = String(userDetails?.user_id || bucket.key);
//             if (currentUserId === String(filters.user_id)) {
//                 targetUserInfo = {
//                     email: userDetails?.email || 'nul',
//                     user_name: userDetails?.user_name || 'Anonymous',
//                     user_id: currentUserId,
//                     score: bucket.total_score?.value,
//                     rank: (filters.from || 0) + i + 1
//                 };
//                 break;
//             }
//         }
//     }

//     // Build initial rows
//     const rows = buckets.map((bucket, index) => {
//         const userDetails = bucket.user_details?.hits?.hits[0]?._source;
//         return {
//             email: userDetails?.email || 'nill',
//             user_name: userDetails?.user_name || '',
//             score: bucket.total_score?.value,
//             user_id: String(userDetails?.user_id || bucket.key),
//             rank: (filters.from || 0) + index + 1
//         };
//     });

//     // Augment with user status details from users index
//     try {
//         const uniqueUserIds = Array.from(new Set(rows.map(r => r.user_id))).filter(Boolean);
//         if (uniqueUserIds.length > 0) {
//             const users = await esGamesUserModel.getUsersByIds(uniqueUserIds, filters.project_id, serviceStackId);
//             const statusMap = users.reduce((acc, u) => {
//                 acc[String(u.user_id)] = {
//                     status: u.status !== false,
//                     country: u.country || '',
//                     city: u.city || '',
//                     region: u.region || ''
//                 };
//                 return acc;
//             }, {});
//             rows.forEach(r => {
//                 const m = statusMap[r.user_id];
//                 if (m) {
//                     r.status = m.status;
//                     r.country = m.country;
//                     r.city = m.city;
//                     r.region = m.region;
//                 }
//             });
//         }
//     } catch (e) {
//         // ignore augmentation failure; keep base data
//     }

//     return {
//         leaderboard: rows,
//         user_info: targetUserInfo || {},
//         total
//     };
// };

// Charts aggregations
const getLeaderboardCharts = async (filters, serviceStackId) => {
    const { project_id, startDate, endDate, interval = 'day', game_type, game_id } = filters;

    const usersBuckets = await esGamesUserModel.getNewUsersHistogram({ project_id, startDate, endDate, interval }, serviceStackId);
    const gamesBuckets = await esGamesScorecardModel.getTopPlayedGames({ project_id, startDate, endDate, game_type, game_id, size: 10 }, serviceStackId);

    return {
        new_users: usersBuckets,
        top_games: gamesBuckets
    };
};

const getUserDetails = async (projectId, userId, serviceStackId) => {
    const user = await esGamesUserModel.getUserById(userId, serviceStackId);
    if (!user || (projectId && user.project_id !== projectId)) return null;
    return user;
};


module.exports = {
    //ingestionStart,
    feedArticleIngestionStart,
    saveGamesConfig,
    getGamesConfig,
    getGamesConfigWithDetails,
    getGamesData,
    saveProjectGameConfig,
    getEsGames,
    fetchGames,
    //getArticleTitle,
    getLatestArticlesByGameType,
    prepareLeaderboardFilters,
    getFormattedLeaderboard,
    //customQuizIngestion,
    deleteCustomQuiz,
    restoreCustomQuiz,
    setCustomQuizStatus,
    clearGamesCaches,
    getLeaderboardCharts,
    getUserDetails
}


// ingestionStart({
//     project_id: "67a2e5e175fe04b1657affb9",
//     article_id: "67c049ce6522908e899bf1c5",
// }) 
// }) 
