const cron = require('node-cron');
const FeedsModel = require('../../../core_libs/models/mongodb/db-feeds');
const FeedSettingsModel = require('../../../core_libs/models/mongodb/db-feed-settings');
const FeedArticlesModel = require('../../../core_libs/models/mongodb/db-feed-articles');
const { parseFeed, extractFeedArticles } = require('../../../core_libs/services/rss/rss-parser-helper');
const { feedArticleIngestionStart } = require('../../../core_libs/helpers/sortd-games-helper');

const scheduledJobs = new Map();

/**
 * Import a single feed
 * @param {string} feedId - Feed ID
 */
const importFeed = async (feedId) => {
    try {
        const feed = await FeedsModel.loadOneByFilters({ _id: feedId });

        if (!feed || feed.status === 0) {
            console.log(`Feed ${feedId} is inactive or not found, skipping import`);
            return;
        }

        // Get feed settings
        const settings = await FeedSettingsModel.getSettingsByFeedId(feedId);
        if (!settings.auto_import) {
            console.log(`Auto import disabled for feed ${feedId}, skipping`);
            return;
        }

        const maxFeedArticles = settings.max_feedarticles_per_import || 50;

        // Parse feed
        const parseResult = await parseFeed(feed.url);

        if (!parseResult.success) {
            await FeedsModel.updateLastFetch(feedId, 'failed', parseResult.error);
            console.log(`Failed to parse feed ${feedId}: ${parseResult.error}`);
            return;
        }

        // Extract feed articles
        const feedArticles = extractFeedArticles(parseResult, feedId);
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
                console.log(`Error importing feed article for feed ${feedId}:`, err);
                skippedCount++;
            }
        }

        // Trigger games generation for newly imported articles (async, don't wait)
        if (newlyImportedArticleIds.length > 0) {
            console.log(`Triggering games generation for ${newlyImportedArticleIds.length} newly imported articles in feed ${feedId}`);
            // Process games generation asynchronously to not block the scheduler
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

        console.log(`Feed ${feedId} imported: ${importedCount} new, ${skippedCount} skipped`);
    } catch (err) {
        console.error(`Error importing feed ${feedId}:`, err);
        await FeedsModel.updateLastFetch(feedId, 'failed', err.message);
    }
};

/**
 * Schedule import for a single feed
 * @param {string} feedId - Feed ID
 * @param {number} intervalMinutes - Interval in minutes
 */
const scheduleFeedImport = (feedId, intervalMinutes) => {
    // Unschedule existing job if any
    unscheduleFeedImport(feedId);

    if (intervalMinutes < 5) {
        console.log(`Interval ${intervalMinutes} minutes is too short, minimum is 5 minutes`);
        return;
    }

    // Calculate cron expression (every N minutes)
    // Cron format: minute hour day month dayOfWeek
    // For every N minutes, we use: */N * * * *
    const cronExpression = `*/${intervalMinutes} * * * *`;

    const job = cron.schedule(cronExpression, async () => {
        console.log(`Running scheduled import for feed ${feedId}`);
        await importFeed(feedId);
    }, {
        scheduled: true,
        timezone: 'UTC'
    });

    scheduledJobs.set(feedId, job);
    console.log(`Scheduled import for feed ${feedId} every ${intervalMinutes} minutes`);
};

/**
 * Unschedule import for a feed
 * @param {string} feedId - Feed ID
 */
const unscheduleFeedImport = (feedId) => {
    const job = scheduledJobs.get(feedId);
    if (job) {
        job.stop();
        scheduledJobs.delete(feedId);
        console.log(`Unscheduled import for feed ${feedId}`);
    }
};

/**
 * Start scheduler - load all active feeds and schedule them
 */
const startScheduler = async () => {
    try {
        console.log('Starting feed scheduler...');

        // Load all active feeds
        const feeds = await FeedsModel.loadAllFeeds({ status: 1 }, null, null, null);

        for (const feed of feeds) {
            try {
                const settings = await FeedSettingsModel.getSettingsByFeedId(feed.id);

                if (settings.auto_import && settings.import_interval_minutes >= 5) {
                    scheduleFeedImport(feed.id, settings.import_interval_minutes);
                } else {
                    console.log(`Skipping feed ${feed.id}: auto_import=${settings.auto_import}, interval=${settings.import_interval_minutes}`);
                }
            } catch (err) {
                console.error(`Error scheduling feed ${feed.id}:`, err);
            }
        }

        console.log(`Scheduler started with ${scheduledJobs.size} active jobs`);
    } catch (err) {
        console.error('Error starting scheduler:', err);
    }
};

/**
 * Stop all scheduled jobs
 */
const stopScheduler = () => {
    scheduledJobs.forEach((job, feedId) => {
        job.stop();
        console.log(`Stopped scheduled import for feed ${feedId}`);
    });
    scheduledJobs.clear();
    console.log('Scheduler stopped');
};

/**
 * Refresh scheduler - reload all feeds and reschedule
 */
const refreshScheduler = async () => {
    stopScheduler();
    await startScheduler();
};

module.exports = {
    startScheduler,
    stopScheduler,
    refreshScheduler,
    scheduleFeedImport,
    unscheduleFeedImport,
    importFeed
};

