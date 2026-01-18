const Parser = require('rss-parser');
const axios = require('axios');

const parser = new Parser({
    timeout: 10000,
    customFields: {
        item: [
            ['content:encoded', 'content'],
            ['media:content', 'mediaContent', { keepArray: true }],
            ['media:thumbnail', 'mediaThumbnail', { keepArray: true }],
            ['media:group', 'mediaGroup']
        ]
    }
});

/**
 * Validate RSS feed URL format
 * @param {string} url - RSS feed URL
 * @returns {boolean} - True if URL format is valid
 */
const validateFeedUrl = (url) => {
    try {
        const urlObj = new URL(url);
        return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch (err) {
        return false;
    }
};

/**
 * Fetch feed content via HTTP
 * @param {string} url - RSS feed URL
 * @returns {Promise<string>} - Feed XML content
 */
const fetchFeedContent = async (url) => {
    try {
        const response = await axios.get(url, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; RSS Feed Parser)'
            }
        });
        return response.data;
    } catch (err) {
        if (err.response) {
            throw new Error(`HTTP ${err.response.status}: ${err.response.statusText}`);
        } else if (err.request) {
            throw new Error('Network error: Unable to fetch feed');
        } else {
            throw new Error(`Request error: ${err.message}`);
        }
    }
};

/**
 * Parse RSS feed from URL
 * @param {string} url - RSS feed URL
 * @returns {Promise<Object>} - Parsed feed data
 */
const parseFeed = async (url) => {
    try {
        if (!validateFeedUrl(url)) {
            throw new Error('Invalid feed URL format');
        }

        const feed = await parser.parseURL(url);
        return {
            success: true,
            feed: {
                title: feed.title || '',
                description: feed.description || '',
                link: feed.link || '',
                items: feed.items || []
            }
        };
    } catch (err) {
        console.error('Error parsing feed:', err);
        return {
            success: false,
            error: err.message || 'Failed to parse RSS feed',
            feed: null
        };
    }
};

/**
 * Extract feed articles from parsed feed data
 * @param {Object} feedData - Parsed feed data
 * @param {string} feedId - Feed ID
 * @returns {Array} - Array of feed article objects
 */
const extractFeedArticles = (feedData, feedId) => {
    try {
        if (!feedData || !feedData.feed || !feedData.feed.items) {
            return [];
        }

        const feedArticles = feedData.feed.items.map((item) => {
            // Extract image URL from various possible fields
            let imageUrl = null;
            
            // Debug: Log item structure for first item to help diagnose issues
            if (feedData.feed.items.indexOf(item) === 0) {
                console.log('Sample item structure:', JSON.stringify(Object.keys(item), null, 2));
                if (item.mediaContent) {
                    console.log('mediaContent found:', JSON.stringify(item.mediaContent, null, 2));
                }
                if (item['media:content']) {
                    console.log('media:content found:', JSON.stringify(item['media:content'], null, 2));
                }
            }
            
            // Helper function to extract URL from media content object
            const extractMediaUrl = (mediaObj) => {
                if (!mediaObj) return null;
                if (typeof mediaObj === 'string') return mediaObj;
                // Handle XML attributes (rss-parser stores attributes in $)
                if (mediaObj.$ && mediaObj.$.url) return mediaObj.$.url;
                if (mediaObj.url) return mediaObj.url;
                if (Array.isArray(mediaObj) && mediaObj.length > 0) {
                    // If it's an array, get the first image (prefer image/jpeg or image/png)
                    let firstImage = null;
                    for (const media of mediaObj) {
                        if (typeof media === 'string') {
                            firstImage = media;
                            break;
                        }
                        if (media.$ && media.$.url) {
                            // Prefer image types
                            if (media.$.type && media.$.type.startsWith('image/')) {
                                return media.$.url;
                            }
                            if (!firstImage) firstImage = media.$.url;
                        } else if (media.url) {
                            if (media.type && media.type.startsWith('image/')) {
                                return media.url;
                            }
                            if (!firstImage) firstImage = media.url;
                        }
                    }
                    return firstImage;
                }
                return null;
            };

            // Helper function to extract image URL from HTML content
            const extractImageFromHtml = (htmlContent) => {
                if (!htmlContent || typeof htmlContent !== 'string') return null;
                // Try to find img tags
                const imgMatch = htmlContent.match(/<img[^>]+src=["']([^"']+)["']/i);
                if (imgMatch && imgMatch[1]) return imgMatch[1];
                // Try to find media:content in raw HTML
                const mediaMatch = htmlContent.match(/<media:content[^>]+url=["']([^"']+)["']/i);
                if (mediaMatch && mediaMatch[1]) return mediaMatch[1];
                return null;
            };

            // Helper function to extract numeric ID from URL/GUID
            // Extracts numeric ID from URLs like: https://asharq.com/politics/165186/...
            const extractNumericIdFromUrl = (url) => {
                if (!url || typeof url !== 'string') return null;
                try {
                    // Pattern: match numeric ID that appears after a path segment and before next segment
                    // Examples: 
                    // - https://asharq.com/politics/165186/... -> 165186
                    // - https://asharq.com/category/12345/... -> 12345
                    const match = url.match(/\/(\d+)(?:\/|$)/);
                    if (match && match[1]) {
                        return match[1];
                    }
                    // Fallback: try to find any numeric sequence in the URL path
                    const pathMatch = url.match(/\/[^\/]+\/(\d+)/);
                    if (pathMatch && pathMatch[1]) {
                        return pathMatch[1];
                    }
                } catch (err) {
                    console.error('Error extracting numeric ID from URL:', err);
                }
                return null;
            };

            // Try enclosure first
            if (item.enclosure && item.enclosure.type && item.enclosure.type.startsWith('image/')) {
                imageUrl = item.enclosure.url;
            }
            // Try mediaContent (from customFields mapping)
            else if (!imageUrl && item.mediaContent) {
                imageUrl = extractMediaUrl(item.mediaContent);
            }
            // Try media:content (direct access)
            else if (!imageUrl && item['media:content']) {
                imageUrl = extractMediaUrl(item['media:content']);
            }
            // Try mediaGroup (from customFields mapping)
            else if (!imageUrl && item.mediaGroup) {
                const mediaGroup = item.mediaGroup;
                if (mediaGroup.mediaContent) {
                    imageUrl = extractMediaUrl(mediaGroup.mediaContent);
                } else if (mediaGroup['media:content']) {
                    imageUrl = extractMediaUrl(mediaGroup['media:content']);
                }
            }
            // Try media:group (direct access)
            else if (!imageUrl && item['media:group']) {
                const mediaGroup = item['media:group'];
                if (mediaGroup['media:content']) {
                    imageUrl = extractMediaUrl(mediaGroup['media:content']);
                } else if (mediaGroup.mediaContent) {
                    imageUrl = extractMediaUrl(mediaGroup.mediaContent);
                }
            }
            // Try mediaThumbnail
            else if (!imageUrl && item.mediaThumbnail) {
                imageUrl = extractMediaUrl(item.mediaThumbnail);
            }
            // Try media:thumbnail (direct access)
            else if (!imageUrl && item['media:thumbnail']) {
                imageUrl = extractMediaUrl(item['media:thumbnail']);
            }
            // Try itunes:image
            else if (!imageUrl && item['itunes:image']) {
                const itunesImage = item['itunes:image'];
                if (typeof itunesImage === 'string') {
                    imageUrl = itunesImage;
                } else if (itunesImage.$.href) {
                    imageUrl = itunesImage.$.href;
                } else if (itunesImage.href) {
                    imageUrl = itunesImage.href;
                }
            }
            // Fallback: Try to extract from description/content HTML
            else if (!imageUrl) {
                const htmlContent = item['content:encoded'] || item.content || item.description || '';
                imageUrl = extractImageFromHtml(htmlContent);
            }

            // Extract content
            let content = item['content:encoded'] || item.content || item.contentSnippet || item.description || '';

            // Extract categories/tags
            let categories = [];
            if (item.categories && Array.isArray(item.categories)) {
                categories = item.categories;
            } else if (item.category) {
                categories = Array.isArray(item.category) ? item.category : [item.category];
            }

            // Extract GUID - prefer numeric ID if available in URL
            const rawGuid = item.guid || item.id || item.link || '';
            let guid = rawGuid;
            
            // If GUID is a URL, extract only the numeric ID
            if (rawGuid && (rawGuid.startsWith('http://') || rawGuid.startsWith('https://'))) {
                const numericId = extractNumericIdFromUrl(rawGuid);
                if (numericId) {
                    guid = numericId;
                }
            }

            return {
                feed_id: feedId,
                title: item.title || '',
                description: item.contentSnippet || item.description || '',
                content: content,
                link: item.link || item.guid || '',
                guid: guid,
                author: item.creator || item.author || item['dc:creator'] || '',
                published_date: item.pubDate ? new Date(item.pubDate) : new Date(),
                image_url: imageUrl,
                categories: categories
            };
        });

        return feedArticles;
    } catch (err) {
        console.error('Error extracting feed articles:', err);
        return [];
    }
};

/**
 * Validate RSS format
 * @param {string} xmlData - RSS XML content
 * @returns {boolean} - True if valid RSS format
 */
const validateRSSFormat = (xmlData) => {
    try {
        if (!xmlData || typeof xmlData !== 'string') {
            return false;
        }
        // Basic RSS validation - check for RSS/feed tags
        const rssPattern = /<(rss|feed)[\s>]/i;
        return rssPattern.test(xmlData);
    } catch (err) {
        return false;
    }
};

module.exports = {
    parseFeed,
    extractFeedArticles,
    validateFeedUrl,
    fetchFeedContent,
    validateRSSFormat
};

