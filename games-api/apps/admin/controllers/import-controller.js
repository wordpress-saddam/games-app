const FeedsModel = require('../../../core_libs/models/mongodb/db-feeds');
const FeedArticlesModel = require('../../../core_libs/models/mongodb/db-feed-articles');
const FeedSettingsModel = require('../../../core_libs/models/mongodb/db-feed-settings');
const { parseFeed, extractFeedArticles } = require('../../../core_libs/services/rss/rss-parser-helper');
const { feedArticleIngestionStart } = require('../../../core_libs/helpers/sortd-games-helper');
const apiExceptions = require('../../../config/api-exceptions').admin;

const importFeed = async (req, res) => {
    try {
        const { feedId } = req.params;

        const feed = await FeedsModel.loadOneByFilters({ _id: feedId });

        if (!feed) {
            return global.sendErrorResponse(res, false, 200, apiExceptions.feedNotFound.code, apiExceptions.feedNotFound.msg);
        }

        if (feed.status === 0) {
            return global.sendErrorResponse(res, false, 200, apiExceptions.feedInactive.code, apiExceptions.feedInactive.msg);
        }

        // Get feed settings
        const settings = await FeedSettingsModel.getSettingsByFeedId(feedId);
        const maxFeedArticles = settings.max_feedarticles_per_import || 50;

        // Parse feed
        const parseResult = await parseFeed(feed.url);

        if (!parseResult.success) {
            await FeedsModel.updateLastFetch(feedId, 'failed', parseResult.error);
            return global.sendErrorResponse(res, false, 200, apiExceptions.feedImportFailed.code, parseResult.error);
        }

        // Extract feed articles
        const feedArticles = extractFeedArticles(parseResult, feedId);

        if (feedArticles.length === 0) {
            await FeedsModel.updateLastFetch(feedId, 'success');
            return global.sendSuccessResponse(res, false, 200, {
                message: 'No new feed articles found',
                imported: 0,
                skipped: 0
            });
        }

        // Limit feed articles based on settings
        const limitedFeedArticles = feedArticles.slice(0, maxFeedArticles);

        // Check for duplicates and save new feed articles
        let importedCount = 0;
        let skippedCount = 0;
        const newlyImportedArticleIds = [];

        for (const feedArticleData of limitedFeedArticles) {
            try {
                // Check if feed article already exists by link or guid
                let existingFeedArticle = null;
                if (feedArticleData.link) {
                    existingFeedArticle = await FeedArticlesModel.findByLink(feedArticleData.link);
                }
                if (!existingFeedArticle && feedArticleData.guid) {
                    existingFeedArticle = await FeedArticlesModel.findByGuid(feedArticleData.guid);
                }

                if (!existingFeedArticle) {
                    const newArticle = await FeedArticlesModel.createFeedArticle(feedArticleData);
                    importedCount++;
                    // Store the ID of newly imported article for games generation
                    if (newArticle && newArticle.id) {
                        newlyImportedArticleIds.push(newArticle.id.toString());
                    }
                } else {
                    skippedCount++;
                }
            } catch (err) {
                console.log('Error importing feed article:', err);
                skippedCount++;
            }
        }

        // Trigger games generation for newly imported articles (async, don't wait)
        if (newlyImportedArticleIds.length > 0) {
            console.log(`Triggering games generation for ${newlyImportedArticleIds.length} newly imported articles`);
            // Process games generation asynchronously to not block the import response
            Promise.all(
                newlyImportedArticleIds.map(async (articleId) => {
                    try {
                        await feedArticleIngestionStart({ article_id: articleId });
                    } catch (err) {
                        console.log(`Error generating games for article_id ${articleId}:`, err);
                    }
                })
            ).catch(err => {
                console.log('Error in batch games generation:', err);
            });
        }

        // Update feed statistics
        await FeedsModel.incrementFeedArticleCount(feedId, importedCount);
        await FeedsModel.updateLastFetch(feedId, 'success');
        await FeedSettingsModel.updateNextImportTime(feedId);

        return global.sendSuccessResponse(res, false, 200, {
            message: 'Feed import completed',
            imported: importedCount,
            skipped: skippedCount,
            total: limitedFeedArticles.length
        });
    } catch (err) {
        console.log('Import feed error:', err);
        const feedId = req.params.feedId;
        if (feedId) {
            await FeedsModel.updateLastFetch(feedId, 'failed', err.message);
        }
        return global.sendErrorResponse(res, false, 200, apiExceptions.feedImportFailed.code, apiExceptions.feedImportFailed.msg);
    }
};

const importAllFeeds = async (req, res) => {
    try {
        // Get all active feeds
        const feeds = await FeedsModel.loadAllFeeds({ status: 1 }, null, null, null);

        if (feeds.length === 0) {
            return global.sendSuccessResponse(res, false, 200, {
                message: 'No active feeds found',
                processed: 0
            });
        }

        const results = [];
        let totalImported = 0;
        let totalSkipped = 0;

        for (const feed of feeds) {
            try {
                // Get feed settings
                const settings = await FeedSettingsModel.getSettingsByFeedId(feed.id);
                if (!settings.auto_import) {
                    results.push({
                        feedId: feed.id,
                        feedName: feed.name,
                        status: 'skipped',
                        reason: 'Auto import disabled'
                    });
                    continue;
                }

                const maxFeedArticles = settings.max_feedarticles_per_import || 50;

                // Parse feed
                const parseResult = await parseFeed(feed.url);

                if (!parseResult.success) {
                    await FeedsModel.updateLastFetch(feed.id, 'failed', parseResult.error);
                    results.push({
                        feedId: feed.id,
                        feedName: feed.name,
                        status: 'failed',
                        error: parseResult.error
                    });
                    continue;
                }

                // Extract feed articles
                const feedArticles = extractFeedArticles(parseResult, feed.id);
                const limitedFeedArticles = feedArticles.slice(0, maxFeedArticles);

                let importedCount = 0;
                let skippedCount = 0;
                const newlyImportedArticleIds = [];

                for (const feedArticleData of limitedFeedArticles) {
                    try {
                        let existingFeedArticle = null;
                        if (feedArticleData.link) {
                            existingFeedArticle = await FeedArticlesModel.findByLink(feedArticleData.link);
                        }
                        if (!existingFeedArticle && feedArticleData.guid) {
                            existingFeedArticle = await FeedArticlesModel.findByGuid(feedArticleData.guid);
                        }

                        if (!existingFeedArticle) {
                            const newArticle = await FeedArticlesModel.createFeedArticle(feedArticleData);
                            importedCount++;
                            // Store the ID of newly imported article for games generation
                            if (newArticle && newArticle.id) {
                                newlyImportedArticleIds.push(newArticle.id.toString());
                            }
                        } else {
                            skippedCount++;
                        }
                    } catch (err) {
                        skippedCount++;
                    }
                }

                // Trigger games generation for newly imported articles (async, don't wait)
                if (newlyImportedArticleIds.length > 0) {
                    console.log(`Triggering games generation for ${newlyImportedArticleIds.length} newly imported articles in feed ${feed.id}`);
                    // Process games generation asynchronously to not block the import response
                    Promise.all(
                        newlyImportedArticleIds.map(async (articleId) => {
                            try {
                                await feedArticleIngestionStart({ article_id: articleId });
                            } catch (err) {
                                console.log(`Error generating games for article_id ${articleId}:`, err);
                            }
                        })
                    ).catch(err => {
                        console.log('Error in batch games generation:', err);
                    });
                }

                await FeedsModel.incrementFeedArticleCount(feed.id, importedCount);
                await FeedsModel.updateLastFetch(feed.id, 'success');
                await FeedSettingsModel.updateNextImportTime(feed.id);

                totalImported += importedCount;
                totalSkipped += skippedCount;

                results.push({
                    feedId: feed.id,
                    feedName: feed.name,
                    status: 'success',
                    imported: importedCount,
                    skipped: skippedCount
                });
            } catch (err) {
                console.log(`Error importing feed ${feed.id}:`, err);
                await FeedsModel.updateLastFetch(feed.id, 'failed', err.message);
                results.push({
                    feedId: feed.id,
                    feedName: feed.name,
                    status: 'failed',
                    error: err.message
                });
            }
        }

        return global.sendSuccessResponse(res, false, 200, {
            message: 'Bulk import completed',
            totalFeeds: feeds.length,
            totalImported,
            totalSkipped,
            results
        });
    } catch (err) {
        console.log('Import all feeds error:', err);
        return global.sendErrorResponse(res, false, 200, apiExceptions.feedImportFailed.code, apiExceptions.feedImportFailed.msg);
    }
};

const getImportHistory = async (req, res) => {
    try {
        const { offset, limit } = req.pagination;
        const filters = {};

        if (req.query.feed_id) {
            filters.feed_id = req.query.feed_id;
        }

        // Get feeds with their last fetch info
        const feeds = await FeedsModel.loadAllFeeds(filters, { last_fetched: -1 }, offset, limit);

        const history = feeds.map(feed => ({
            feedId: feed.id,
            feedName: feed.name,
            lastFetched: feed.last_fetched,
            lastFetchStatus: feed.last_fetch_status,
            lastFetchError: feed.last_fetch_error,
            totalFeedArticles: feed.total_feedarticles
        }));

        return global.sendSuccessResponse(res, false, 200, {
            history,
            pagination: {
                offset,
                limit,
                count: history.length
            }
        });
    } catch (err) {
        console.log('Get import history error:', err);
        return global.sendErrorResponse(res, false, 200, apiExceptions.historyFetchFailed.code, apiExceptions.historyFetchFailed.msg);
    }
};

module.exports = {
    importFeed,
    importAllFeeds,
    getImportHistory
};

