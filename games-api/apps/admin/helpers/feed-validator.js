const { validateFeedUrl, parseFeed } = require('../../../core_libs/services/rss/rss-parser-helper');

/**
 * Validate feed URL format
 * @param {string} url - Feed URL to validate
 * @returns {Object} - { isValid: boolean, error: string }
 */
const validateFeedUrlFormat = (url) => {
    if (!url || typeof url !== 'string') {
        return { isValid: false, error: 'Feed URL is required' };
    }

    if (!validateFeedUrl(url)) {
        return { isValid: false, error: 'Invalid feed URL format. Must be a valid HTTP or HTTPS URL' };
    }

    return { isValid: true, error: null };
};

/**
 * Validate RSS format by attempting to parse
 * @param {string} url - Feed URL to validate
 * @returns {Promise<Object>} - { isValid: boolean, error: string, feed: Object }
 */
const validateRSSFormat = async (url) => {
    try {
        const result = await parseFeed(url);
        if (result.success && result.feed) {
            return {
                isValid: true,
                error: null,
                feed: result.feed
            };
        } else {
            return {
                isValid: false,
                error: result.error || 'Invalid RSS feed format',
                feed: null
            };
        }
    } catch (err) {
        return {
            isValid: false,
            error: err.message || 'Failed to validate RSS feed',
            feed: null
        };
    }
};

module.exports = {
    validateFeedUrlFormat,
    validateRSSFormat
};

