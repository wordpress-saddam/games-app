const FeedArticlesModel = require('../../../core_libs/models/mongodb/db-feed-articles');
const FeedArticleGamesModel = require('../../../core_libs/models/mongodb/db-feed-article-games');
const apiExceptions = require('../../../config/api-exceptions').admin;

const getFeedArticles = async (req, res) => {
    try {
        const { offset, limit } = req.pagination;
        const filters = {};

        // Filter by feed_id
        if (req.query.feed_id) {
            filters.feed_id = req.query.feed_id;
        }

        // Filter by status
        if (req.query.status !== undefined) {
            filters.status = parseInt(req.query.status);
        }

        // Filter by title (search)
        if (req.query.title) {
            filters.title = { $regex: req.query.title, $options: 'i' }; // Case-insensitive search
        }

        // Filter by date range
        if (req.query.start_date) {
            filters.published_date = { $gte: new Date(req.query.start_date) };
        }
        if (req.query.end_date) {
            if (filters.published_date) {
                filters.published_date.$lte = new Date(req.query.end_date);
            } else {
                filters.published_date = { $lte: new Date(req.query.end_date) };
            }
        }

        const ordering = { published_date: -1 };
        const feedArticles = await FeedArticlesModel.loadAllFeedArticles(filters, ordering, offset, limit);
        
        // Get total count for pagination
        const mongoose = require('../../../core_libs/utils/database-connection').Mongoose;
        const FeedArticleModel = mongoose.model('feedarticles');
        const totalCount = await FeedArticleModel.countDocuments(filters);

        // Fetch games for all articles in batch
        const articleIds = feedArticles.map(article => {
            // Convert article.id to ObjectId if it's a string
            if (typeof article.id === 'string') {
                return new mongoose.Types.ObjectId(article.id);
            }
            return article.id;
        });
        let gamesMap = {};
        
        if (articleIds.length > 0) {
            try {
                const games = await FeedArticleGamesModel.loadAllByFilters(
                    { 
                        article_id: { $in: articleIds },
                        status: true 
                    },
                    null,
                    null,
                    null
                );

                // Group games by article_id (normalize to string for comparison)
                games.forEach(game => {
                    let articleId = game.article_id;
                    // Handle both ObjectId and string formats
                    if (articleId && typeof articleId === 'object' && articleId.toString) {
                        articleId = articleId.toString();
                    } else if (articleId) {
                        articleId = String(articleId);
                    }
                    
                    if (articleId) {
                        if (!gamesMap[articleId]) {
                            gamesMap[articleId] = [];
                        }
                        gamesMap[articleId].push(game.game_type);
                    }
                });
            } catch (gamesError) {
                console.log('Error fetching games for articles:', gamesError);
                // Continue without games if there's an error
            }
        }

        // Add games information to each article
        const feedArticlesWithGames = feedArticles.map(article => {
            // Normalize article.id to string for comparison
            let articleId = article.id;
            if (articleId && typeof articleId === 'object' && articleId.toString) {
                articleId = articleId.toString();
            } else if (articleId) {
                articleId = String(articleId);
            }
            
            const articleGames = gamesMap[articleId] || [];
            return {
                ...article,
                games: articleGames,
                hasGames: articleGames.length > 0
            };
        });

        return global.sendSuccessResponse(res, false, 200, {
            feedArticles: feedArticlesWithGames,
            pagination: {
                offset,
                limit,
                count: feedArticles.length,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limit)
            }
        });
    } catch (err) {
        console.log('Get feed articles error:', err);
        return global.sendErrorResponse(res, false, 200, apiExceptions.feedArticleFetchFailed.code, apiExceptions.feedArticleFetchFailed.msg);
    }
};

const getFeedArticleById = async (req, res) => {
    try {
        const { id } = req.params;
        const mongoose = require('../../../core_libs/utils/database-connection').Mongoose;
        const FeedArticleModel = mongoose.model('feedarticles');
        const feedArticle = await FeedArticleModel.findById(id).populate('feed_id', 'name url').exec();

        if (!feedArticle) {
            return global.sendErrorResponse(res, false, 200, apiExceptions.feedArticleNotFound.code, apiExceptions.feedArticleNotFound.msg);
        }

        return global.sendSuccessResponse(res, false, 200, feedArticle.getPublicObject());
    } catch (err) {
        console.log('Get feed article by id error:', err);
        return global.sendErrorResponse(res, false, 200, apiExceptions.feedArticleNotFound.code, apiExceptions.feedArticleNotFound.msg);
    }
};

const updateFeedArticleStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (status === undefined || ![0, 1, -1].includes(status)) {
            return global.sendErrorResponse(res, false, 200, apiExceptions.validationFailed.code, apiExceptions.validationFailed.msg);
        }

        const feedArticle = await FeedArticlesModel.updateFeedArticleStatus(id, status);

        if (!feedArticle) {
            return global.sendErrorResponse(res, false, 200, apiExceptions.feedArticleNotFound.code, apiExceptions.feedArticleNotFound.msg);
        }

        return global.sendSuccessResponse(res, false, 200, feedArticle);
    } catch (err) {
        console.log('Update feed article status error:', err);
        return global.sendErrorResponse(res, false, 200, apiExceptions.feedArticleUpdateFailed.code, apiExceptions.feedArticleUpdateFailed.msg);
    }
};

const deleteFeedArticle = async (req, res) => {
    try {
        const { id } = req.params;

        const feedArticle = await FeedArticlesModel.updateFeedArticleStatus(id, -1);

        if (!feedArticle) {
            return global.sendErrorResponse(res, false, 200, apiExceptions.feedArticleNotFound.code, apiExceptions.feedArticleNotFound.msg);
        }

        return global.sendSuccessResponse(res, false, 200, { message: 'Feed article deleted successfully' });
    } catch (err) {
        console.log('Delete feed article error:', err);
        return global.sendErrorResponse(res, false, 200, apiExceptions.feedArticleDeleteFailed.code, apiExceptions.feedArticleDeleteFailed.msg);
    }
};

module.exports = {
    getFeedArticles,
    getFeedArticleById,
    updateFeedArticleStatus,
    deleteFeedArticle
};

