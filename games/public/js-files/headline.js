/**
* Custom Sortable class for drag and drop functionality
*/
class CustomSortable {
    constructor(element, options = {}) {
        this.element = element;
        this.options = options;
        this.draggingElement = null;
        this.clone = null;
        this.placeholder = null;
        this.offsetX = 0;
        this.offsetY = 0;
        this.items = [];
        this.ghostClass = options.ghostClass || 'ghost';

        this.init();
    }

    init() {
        this.items = Array.from(this.element.querySelectorAll('.sortable-item'));

        this.items.forEach(item => {
            item.addEventListener('mousedown', this.onMouseDown.bind(this));
            item.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
            item.setAttribute('draggable', 'false');
        });

        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
        document.addEventListener('mouseup', this.onMouseUp.bind(this));
        document.addEventListener('touchend', this.onTouchEnd.bind(this));
    }

    onMouseDown(e) {
        this.startDrag(e.target, e.pageX, e.pageY);
        e.preventDefault();
    }

    onTouchStart(e) {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            this.startDrag(e.target, touch.pageX, touch.pageY);
            e.preventDefault();
        }
    }

    startDrag(target, pageX, pageY) {
        if (!target.classList.contains('sortable-item')) {
            target = target.closest('.sortable-item');
        }
        if (!target) return;

        this.draggingElement = target;
        const rect = target.getBoundingClientRect();

        this.offsetX = pageX - rect.left - window.scrollX;
        this.offsetY = pageY - rect.top - window.scrollY;

        // Create placeholder
        this.placeholder = document.createElement('div');
        this.placeholder.className = 'sortable-item ' + this.ghostClass;
        this.placeholder.style.height = `${rect.height}px`;
        this.placeholder.style.width = `${rect.width}px`;
        this.placeholder.style.opacity = '0.3';

        // Create clone for dragging
        this.clone = this.draggingElement.cloneNode(true);
        this.clone.classList.add('dragging');
        this.clone.style.position = 'absolute';
        this.clone.style.pointerEvents = 'none';
        this.clone.style.width = `${rect.width}px`;
        this.clone.style.height = `${rect.height}px`;
        this.clone.style.zIndex = '1000';

        document.body.appendChild(this.clone);
        this.setPosition(this.clone, pageX, pageY);

        this.draggingElement.style.opacity = '0'; // Hide the real one
        this.element.insertBefore(this.placeholder, this.draggingElement);

        if (this.options.onStart) {
            this.options.onStart({ item: this.draggingElement });
        }

        this.updateItems();
    }

    onMouseMove(e) {
        if (!this.clone) return;
        this.moveDrag(e.pageX, e.pageY);
    }

    onTouchMove(e) {
        if (!this.clone || e.touches.length !== 1) return;
        const touch = e.touches[0];
        this.moveDrag(touch.pageX, touch.pageY);
        e.preventDefault();
    }

    moveDrag(pageX, pageY) {
        this.setPosition(this.clone, pageX, pageY);

        const rect = this.clone.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        let closestItem = null;
        let minDistance = Infinity;

        this.items.forEach(item => {
            if (item === this.draggingElement || item === this.placeholder) return;

            const itemRect = item.getBoundingClientRect();
            const itemCenterX = itemRect.left + itemRect.width / 2;
            const itemCenterY = itemRect.top + itemRect.height / 2;

            const distance = Math.sqrt(
                Math.pow(centerX - itemCenterX, 2) +
                Math.pow(centerY - itemCenterY, 2)
            );

            if (distance < minDistance) {
                minDistance = distance;
                closestItem = item;
            }
        });

        if (closestItem && minDistance < 50) {
            const closestRect = closestItem.getBoundingClientRect();
            if (centerY < closestRect.top + closestRect.height / 2) {
                this.element.insertBefore(this.placeholder, closestItem);
            } else {
                this.element.insertBefore(this.placeholder, closestItem.nextSibling);
            }
        }

        this.updateItems();
    }

    onMouseUp() {
        this.endDrag();
    }

    onTouchEnd() {
        this.endDrag();
    }

    endDrag() {
        if (!this.clone || !this.draggingElement) return;

        this.clone.remove();
        this.clone = null;

        this.draggingElement.style.opacity = '1';

        if (this.placeholder && this.placeholder.parentNode) {
            this.element.insertBefore(this.draggingElement, this.placeholder);
            this.element.removeChild(this.placeholder);
        }

        if (this.options.onEnd) {
            this.options.onEnd({ item: this.draggingElement });
        }

        this.draggingElement = null;
        this.placeholder = null;
        this.updateItems();
    }

    setPosition(element, pageX, pageY) {
        element.style.left = `${pageX - this.offsetX}px`;
        element.style.top = `${pageY - this.offsetY}px`;
    }

    updateItems() {
        this.items = Array.from(this.element.querySelectorAll('.sortable-item'));
    }

    destroy() {
        this.items.forEach(item => {
            item.removeEventListener('mousedown', this.onMouseDown);
            item.removeEventListener('touchstart', this.onTouchStart);
        });

        this.endDrag();
    }
}


/**
 * SessionService class - handles session-wide data and game tracking
 * Manages multiple game sets and keeps track of session progress
 */
class SessionService {
    constructor(gameData) {
        this.gameData = gameData;
        this.gameResults = [];
        this.currentGameIndex = 0;
        this.initSession();
    }

    /**
     * Initialize the session with empty results for each game
     */
    initSession() {
        // Create empty results for each game
        for (let i = 0; i < this.getTotalGames(); i++) {
            this.gameResults.push({
                gameIndex: i,
                score: 0,
                passed: false,
                totalHeadlines: this.getHeadlinesForGame(i).length,
                completed: false,
            });
        }
    }

    /**
     * Get total number of games in the session
     * @returns {Number} Total games count
     */
    getTotalGames() {
        return this.gameData.length;
    }

    /**
     * Get current game index (0-based)
     * @returns {Number} Current game index
     */
    getCurrentGameIndex() {
        return this.currentGameIndex;
    }

    /**
     * Get headlines for a specific game
     * @param {Number} gameIndex - Game index (0-based)
     * @returns {Array} Headlines for the specified game
     */
    getHeadlinesForGame(gameIndex) {
        return [this.gameData[gameIndex]]; // Each game has one headline
    }

    /**
     * Get current game headlines
     * @returns {Array} Current game headlines
     */
    getCurrentGameHeadlines() {
        return this.getHeadlinesForGame(this.currentGameIndex);
    }

    /**
     * Get current game data
     * @returns {Object} Current game data
     */
    getCurrentGameData() {
        return this.gameData[this.currentGameIndex];
    }

    /**
     * Move to the next game in the session
     * @returns {Boolean} Whether there is a next game
     */
    nextGame() {
        if (this.hasNextGame()) {
            this.currentGameIndex++;
            return true;
        }
        return false;
    }

    /**
     * Check if there is a next game in the session
     * @returns {Boolean} Whether there is a next game
     */
    hasNextGame() {
        return this.currentGameIndex < this.getTotalGames() - 1;
    }

    /**
     * Update a game's result
     * @param {Number} gameIndex - Game index
     * @param {Number} score - Game score
     * @param {Boolean} completed - Whether the game is completed
     */
    updateGameResult(gameIndex, score, passed, completed) {
        this.gameResults[gameIndex] = {
            ...this.gameResults[gameIndex],
            score,
            passed,
            completed,
        };
    }

    /**
     * Get a specific game's result
     * @param {Number} gameIndex - Game index
     * @returns {Object} Game result object
     */
    getGameResult(gameIndex) {
        return this.gameResults[gameIndex];
    }

    /**
     * Reset a specific game's result
     * @param {Number} gameIndex - Game index to reset
     */
    resetGameResult(gameIndex) {
        this.gameResults[gameIndex] = {
            gameIndex,
            score: 0,
            passed: false,
            totalHeadlines: this.getHeadlinesForGame(gameIndex).length,
            completed: false,
        };
    }
    /**
        * Get total passed games
        * @returns {Number} Total passed games
        */
    getTotalPassedGames() {
        return this.gameResults.filter((game) => game.passed && game.completed).length;
    }

    /**
     * Get total failed games
     * @returns {Number} Total failed games
     */
    getTotalFailedGames() {
        return this.gameResults.filter((game) => !game.passed && game.completed).length;
    }
    /**
     * Get total session score
     * @returns {Number} Total score across all games
     */
    getTotalSessionScore() {
        return this.gameResults.reduce((total, game) => total + game.score, 0);
    }

    /**
     * Get total headlines across all games
     * @returns {Number} Total headlines count
     */
    getTotalSessionHeadlines() {
        return this.gameResults.reduce((total, game) => total + game.totalHeadlines, 0);
    }

    /**
     * Get session score percentage
     * @returns {Number} Session score percentage
     */
    getSessionScorePercentage() {
        const totalScore = this.getTotalSessionScore();
        const totalHeadlines = this.getTotalSessionHeadlines();
        return Math.round((totalScore / totalHeadlines) * 100) || 0;
    }

    /**
     * Check if all games in the session are completed
     * @returns {Boolean} Whether all games are completed
     */
    isSessionComplete() {
        return this.gameResults.every((game) => game.completed);
    }

    /**
     * Reset the entire session
     */
    resetSession() {
        this.currentGameIndex = 0;
        this.initSession();
    }
}

/**
 * HeadlineScrambleService class - handles the headline scramble game logic
 */
class HeadlineScrambleService {
    constructor(sessionService, gameIndex) {
        this.sessionService = sessionService;
        this.gameIndex = gameIndex;
        this.headlines = this.sessionService.getHeadlinesForGame(gameIndex);
        this.currentHeadlineIndex = 0;
        this.score = 0;
        this.userAnswers = [];
        this.sortable = null;
    }

    /**
     * Get the current headline object
     * @returns {Object} Current headline
     */
    getCurrentHeadline() {
        return this.headlines[this.currentHeadlineIndex];
    }

    /**
     * Get total number of headlines
     * @returns {Number} Total headlines count
     */
    getTotalHeadlines() {
        return this.headlines.length;
    }

    /**
     * Check if the current arrangement is correct
     * @returns {Boolean} Whether the arrangement is correct
     */
    checkArrangement() {
        const currentHeadline = this.getCurrentHeadline();
        const correctHeadline = currentHeadline.data.headline;

        // Get the current arrangement from the DOM
        const sortableContainer = document.getElementById('sortable-container');
        const items = Array.from(sortableContainer.querySelectorAll('.sortable-item'));
        const userArrangement = items.map(item => item.textContent).join(' ').trim();

        // Remove extra spaces and normalize
        const normalizedUserArrangement = userArrangement.replace(/\s+/g, ' ');
        const normalizedCorrectHeadline = correctHeadline.replace(/\s+/g, ' ');

        const isCorrect = normalizedUserArrangement === normalizedCorrectHeadline;

        // Save user's answer
        this.userAnswers[this.currentHeadlineIndex] = {
            arrangement: normalizedUserArrangement,
            isCorrect,
        };

        // Update score if correct
        if (isCorrect) {
            this.score++;
            this.passed = true;
        } else {
            this.passed = false; // Set passed to false if incorrect
        }

        return { isCorrect, items };
    }

    /**
     * Move to the next headline
     * @returns {Boolean} Whether there is a next headline
     */
    nextHeadline() {
        if (this.hasNextHeadline()) {
            this.currentHeadlineIndex++;
            return true;
        }
        return false;
    }

    /**
     * Check if there is a next headline
     * @returns {Boolean} Whether there is a next headline
     */
    hasNextHeadline() {
        return this.currentHeadlineIndex < this.headlines.length - 1;
    }

    /**
     * Get the current progress percentage
     * @returns {Number} Progress percentage
     */
    getProgress() {
        return ((this.currentHeadlineIndex + 1) / this.headlines.length) * 100;
    }

    /**
     * Get the final score percentage
     * @returns {Number} Score percentage
     */
    getScorePercentage() {
        return Math.round((this.score / this.headlines.length) * 100);
    }

    /**
     * Update session with the current game's result
     */
    updateSessionResult() {
        this.sessionService.updateGameResult(
            this.gameIndex,
            this.score,
            this.passed,
            true, // Mark as completed
        );
    }

    /**
     * Reset the game
     */
    resetGame() {
        this.currentHeadlineIndex = 0;
        this.score = 0;
        this.userAnswers = [];

        if (this.sortable) {
            this.sortable.destroy();
            this.sortable = null;
        }
    }

    /**
     * Initialize the sortable container with headline segments
     */
    initSortable() {
        const currentHeadline = this.getCurrentHeadline();
        const sortableContainer = document.getElementById('sortable-container');

        // Clear previous content
        sortableContainer.innerHTML = '';

        // **Shuffle the randomized array before creating sortable items**
        const shuffledSegments = this.shuffleArray([...currentHeadline.data.randomized]);



        // Create sortable items from randomized headline segments
        shuffledSegments.forEach((segment, index) => {
            const item = document.createElement('div');
            item.className = 'sortable-item';
            item.textContent = segment;
            item.setAttribute('data-index', index);
            sortableContainer.appendChild(item);
        });

        // Initialize the sortable functionality
        this.sortable = new CustomSortable(sortableContainer, {
            ghostClass: 'sortable-ghost',
            onEnd: () => {
                // Optional callback when sorting ends
            }
        });
    }

    /**
     * Shuffles array in place. ES6 version
     * @param {Array} a items An array containing the items.
     */
    shuffleArray(a) {
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }
}

/**
 * LocalStorageService - handles storing and retrieving data from localStorage
 */
class LocalStorageService {
    constructor() {
        this.lastPlayedKey = "headline_scramble_last_played";
        this.favoritesKey = "headline_scramble_favorites";
    }

    /**
     * Save last played timestamp for a game
     * @param {String} gameId - Game ID
     */
    saveLastPlayed(gameId) {
        const lastPlayed = this.getLastPlayed() || {};
        lastPlayed[gameId] = new Date().toISOString();
        localStorage.setItem(this.lastPlayedKey, JSON.stringify(lastPlayed));
    }

    /**
     * Get last played timestamps for all games
     * @returns {Object} Object with game IDs as keys and timestamps as values
     */
    getLastPlayed() {
        const data = localStorage.getItem(this.lastPlayedKey);
        return data ? JSON.parse(data) : {};
    }

    /**
     * Get last played timestamp for a specific game
     * @param {String} gameId - Game ID
     * @returns {String|null} ISO timestamp or null if not found
     */
    getLastPlayedForGame(gameId) {
        const lastPlayed = this.getLastPlayed();
        return lastPlayed[gameId] || null;
    }

    /**
     * Toggle favorite status for a game
     * @param {String} gameId - Game ID
     * @returns {Boolean} New favorite status
     */
    toggleFavorite(gameId) {
        const favorites = this.getFavorites();
        const index = favorites.indexOf(gameId);

        if (index === -1) {
            favorites.push(gameId);
        } else {
            favorites.splice(index, 1);
        }

        localStorage.setItem(this.favoritesKey, JSON.stringify(favorites));
        return index === -1; // Return true if it was added, false if removed
    }

    /**
     * Get all favorite game IDs
     * @returns {Array} Array of favorite game IDs
     */
    getFavorites() {
        const data = localStorage.getItem(this.favoritesKey);
        return data ? JSON.parse(data) : [];
    }

    /**
     * Check if a game is favorited
     * @param {String} gameId - Game ID
     * @returns {Boolean} Whether the game is favorited
     */
    isFavorite(gameId) {
        const favorites = this.getFavorites();
        return favorites.includes(gameId);
    }
}

/**
 * Utility functions
 */
const Utils = {
    /**
     * Format a relative timestamp
     * @param {String} isoString - ISO timestamp string
     * @returns {String} Formatted relative time
     */
    formatRelativeTime(isoString) {
        if (!isoString) return "";

        const date = new Date(isoString);
        const now = new Date();
        const diffMs = now - date;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);

        if (diffSec < 60) {
            return "Just now";
        } else if (diffMin < 60) {
            return `${diffMin} ${diffMin === 1 ? "min" : "mins"} ago`;
        } else if (diffHour < 24) {
            return `${diffHour} ${diffHour === 1 ? "hr" : "hrs"} ago`;
        } else if (diffDay < 30) {
            return `${diffDay} ${diffDay === 1 ? "day" : "days"} ago`;
        } else {
            const month = date.toLocaleString("default", { month: "short" });
            const day = date.getDate();
            return `${month} ${day}`;
        }
    },

    /**
     * Update URL with game data
     * @param {Number} index - Game index
     * @param {Object} ApiData - API data object
     */
    updateURLWithGameData(index, ApiData) {
        const url = new URL(window.location);
        const currentGameId = url.searchParams.get("game_id");
        const currentArticleGuid = url.searchParams.get("article_guid");
        const newGameId = ApiData[index]?.id ?? currentGameId;
        const newArticleGuid = ApiData[index]?.article_guid ?? currentArticleGuid;

        if (currentGameId !== newGameId || currentArticleGuid !== newArticleGuid) {
            url.searchParams.set("game_id", newGameId);
            url.searchParams.set("article_guid", newArticleGuid);
            window.history.pushState({}, "", url);
        }
    },

    /**
     * Check if URL has a specific parameter
     * @param {String} param - Parameter name
     * @returns {Boolean} Whether the parameter exists
     */
    urlHasParam(param) {
        const url = new URL(window.location);
        return url.searchParams.has(param);
    },

    /**
     * Get URL parameter value
     * @param {String} param - Parameter name
     * @returns {String|null} Parameter value or null
     */
    getUrlParam(param) {
        const url = new URL(window.location);
        return url.searchParams.get(param);
    },
};

/**
 * HeadlineScrambleApp class - handles the UI interactions and DOM updates
 */
class HeadlineScrambleApp {
    constructor(sessionService) {
        this.sessionService = sessionService;
        this.gameService = null;
        this.storageService = new LocalStorageService();
        this.initElements();
        this.initEventListeners();
        this.initCurrentGame();
    }

    /**
     * Initialize DOM element references
     */
    initElements() {
        // Header elements
        this.currentGameElement = document.getElementById("current-game");
        this.totalGamesElement = document.getElementById("total-games");

        // Scramble elements
        this.scrambleContainer = document.getElementById("scramble-container");
        this.scrambleInstruction = document.getElementById("scramble-instruction");
        this.sortableContainer = document.getElementById("sortable-container");

        // Buttons
        this.submitBtn = document.getElementById("submit-btn");
        this.nextBtn = document.getElementById("next-btn");
        this.nextGameBtn = document.getElementById("next-game-btn");
        this.replayBtn = document.getElementById("replay-btn");
        this.sessionSummaryBtn = document.getElementById("session-summary-btn");
        this.restartSessionBtn = document.getElementById("restart-session-btn");
        this.articleLinkBtn = document.getElementById("article-link-btn");
        this.summaryArticleLinkBtn = document.getElementById("summary-article-link-btn");

        // Progress elements
        this.progressBar = document.getElementById("progress-bar");
        this.progressText = document.getElementById("progress-text");

        // Feedback and results
        this.feedbackElement = document.getElementById("hangman-feedback");
        this.resultsContainer = document.getElementById("results-container");
        this.scoreElement = document.getElementById("score");
        this.totalHeadlinesElement = document.getElementById("total-headlines");
        this.scorePercentageElement = document.getElementById("score-percentage");
        // this.resultMessageElement = document.getElementById("result-message");

        // Result info elements
        // this.resultGameId = document.getElementById("result-game-id");
        // this.resultArticleGuid = document.getElementById("result-article-guid");
        // this.resultUpdatedAt = document.getElementById("result-updated-at");
        // this.resultLastPlayed = document.getElementById("result-last-played");

        // Session summary elements
        this.sessionSummaryContainer = document.getElementById("session-summary-container");
        this.totalSessionScoreElement = document.getElementById("total-session-score");
        this.totalSessionHeadlinesElement = document.getElementById("total-session-headlines");
        this.sessionScorePercentageElement = document.getElementById("session-score-percentage");
        this.gameScoresContainer = document.getElementById("game-scores-container");
    }

    /**
     * Initialize event listeners
     */
    initEventListeners() {
        // Button clicks
        this.submitBtn.addEventListener("click", () => this.submitArrangement());
        this.nextBtn.addEventListener("click", () => this.loadNextHeadline());
        this.nextGameBtn.addEventListener("click", () => this.loadNextGame());
        this.replayBtn.addEventListener("click", () => this.replayCurrentGame());
        this.sessionSummaryBtn.addEventListener("click", () => this.showSessionSummary());
        this.restartSessionBtn.addEventListener("click", () => this.restartSession());

        // Accordion functionality
        const accordionHeaders = document.querySelectorAll(".accordion-header");
        accordionHeaders.forEach((header) => {
            header.addEventListener("click", () => {
                const accordionItem = header.parentElement;
                accordionItem.classList.toggle("active");
            });
        });
    }

    /**
     * Update article link visibility based on URL parameters
     */
    updateArticleLinks() {
        const currentGame = this.sessionService.getCurrentGameData();
        const articleGuid = currentGame?.article_guid || Utils.getUrlParam("article_guid");
        const showArticleLink = Utils.urlHasParam("src") && Utils.getUrlParam("src") === "article";

        // Update main article link
        if (this.articleLinkBtn) {
            if (showArticleLink && articleGuid) {
                this.articleLinkBtn.href = `${articleGuid}`;
                this.articleLinkBtn.classList.remove("hidden");
            } else {
                this.articleLinkBtn.classList.add("hidden");
            }
        }

        // Update summary article link
        if (this.summaryArticleLinkBtn) {
            if (showArticleLink && articleGuid) {
                this.summaryArticleLinkBtn.href = `${articleGuid}`;
                this.summaryArticleLinkBtn.classList.remove("hidden");
            } else {
                this.summaryArticleLinkBtn.classList.add("hidden");
            }
        }
    }

    /**
     * Initialize the current game
     */
    initCurrentGame() {
        const gameIndex = this.sessionService.getCurrentGameIndex();
        this.gameService = new HeadlineScrambleService(this.sessionService, gameIndex);
        const currentGame = this.sessionService.getCurrentGameData();

        // Save last played timestamp
        if (currentGame && currentGame.id) {
            this.storageService.saveLastPlayed(currentGame.id);
        }

        // Update URL with game data
        const ApiData = this.sessionService.gameData;
        Utils.updateURLWithGameData(gameIndex, ApiData);

        // Update header info
        this.totalGamesElement.textContent = this.sessionService.getTotalGames();
        this.currentGameElement.textContent = gameIndex + 1;

        // Check if we should show the article link
        this.updateArticleLinks();

        // Handle single-set session
        if (this.sessionService.getTotalGames() === 1) {
            this.sessionSummaryBtn.style.display = "none";
        } else {
            this.sessionSummaryBtn.style.display = "block";
        }

        // Start the game
        this.startGame();
    }

    /**
     * Start the game by loading the first headline
     */
    startGame() {
        // Reset containers visibility
        this.scrambleContainer.classList.remove("hidden");
        this.resultsContainer.classList.add("hidden");
        this.sessionSummaryContainer.classList.add("hidden");

        // Update total headlines
        // this.totalHeadlinesElement.textContent = this.gameService.getTotalHeadlines();

        // Load first headline
        this.loadHeadline();
    }

    /**
     * Load the current headline and segments
     */
    loadHeadline() {
        // Reset previous feedback
        this.hideFeedback();

        // Initialize sortable with current headline segments
        this.gameService.initSortable();

        // Update progress
        this.updateProgress();

        // Apply fade-in animation
        this.scrambleContainer.classList.remove("fade-in");
        void this.scrambleContainer.offsetWidth; // Trigger reflow
        this.scrambleContainer.classList.add("fade-in");

        // Show submit button, hide next button
        this.submitBtn.style.display = "block";
        this.nextBtn.style.display = "none";
    }

    /**
     * Submit the current arrangement
     */
    submitArrangement() {
        const { isCorrect, items } = this.gameService.checkArrangement();

        // Show visual feedback
        this.showArrangementFeedback(isCorrect, items)


        setTimeout(() => { this.loadNextHeadline() }, 2000)


        //  Hide submit button, show next button
        this.submitBtn.style.display = "none";

        // if (this.gameService.hasNextHeadline()) {
        //     this.nextBtn.style.display = "block";
        //     this.nextBtn.textContent = "Next Headline";
        // } else {
        //     this.nextBtn.style.display = "block";
        //     this.nextBtn.textContent = "Show Results";
        // }
    }

    /**
     * Show visual feedback for the arrangement
     */
    showArrangementFeedback(isCorrect, items) {
        const currentHeadline = this.gameService.getCurrentHeadline();
        const correctHeadline = currentHeadline.data.headline;
        const correctSegments = correctHeadline.split(" ");
        // Add visual feedback to sortable container
        const sortableContainer = document.getElementById('sortable-container');

        if (isCorrect) {
            sortableContainer.classList.add("correct-arrangement");
            items.forEach(item => item.classList.add("correct"));
            this.showFeedback("Excellent! You have a great eye for headlines!", "correct");

        } else {
            sortableContainer.classList.add("incorrect-arrangement");
            items.forEach((item, index) => {
                const itemText = item.textContent;
                if (itemText === correctSegments[index]) {
                    item.classList.add("correct");
                } else {
                    item.classList.add("incorrect");
                }
            });
            const userHeadline = items.map(item => item.textContent).join(' ').trim();
            this.showFeedback(`Incorrect. The correct headline is: "${correctHeadline}"`, "incorrect", correctHeadline, userHeadline);
        }
    }

    /**
     * Load the next headline
     */
    loadNextHeadline() {
        // Reset sortable container classes
        const sortableContainer = document.getElementById('sortable-container');
        sortableContainer.classList.remove("correct-arrangement", "incorrect-arrangement");

        if (this.nextBtn.textContent === "Show Results") {
            this.showResults();
            return;
        }

        if (this.gameService.nextHeadline()) {
            this.loadHeadline();
        } else {
            this.showResults();
        }
    }

    /**
     * Show the game results
     */
    showResults() {
        // Update session with game results
        this.gameService.updateSessionResult();

        // Get current game data
        const currentGame = this.sessionService.getCurrentGameData();

        // Hide scramble container, show results
        this.scrambleContainer.classList.add("hidden");
        this.resultsContainer.classList.remove("hidden");
        this.sessionSummaryContainer.classList.add("hidden");

        // Apply animation
        this.resultsContainer.classList.remove("slide-in");
        void this.resultsContainer.offsetWidth;
        this.resultsContainer.classList.add("slide-in");

        // Update score information
        const passed = this.gameService.passed;
        // const score = this.gameService.score;
        // const totalHeadlines = this.gameService.getTotalHeadlines();
        // const percentage = this.gameService.getScorePercentage();

        this.scoreElement.textContent = passed ? "Passed" : "Failed";
        // this.scorePercentageElement.textContent = score?"Passed":"Failed";

        // Update game info in results
        // if (currentGame) {
        //     // Set game ID and article GUID
        //     this.resultGameId.textContent = currentGame.id ? currentGame.id.substring(0, 8) + "..." : "N/A";
        //     this.resultArticleGuid.textContent = currentGame.article_guid || "N/A";

        //     // Set updated timestamp
        //     if (currentGame.updated_at) {
        //         this.resultUpdatedAt.textContent = `Updated ${Utils.formatRelativeTime(currentGame.updated_at)}`;
        //     } else {
        //         this.resultUpdatedAt.textContent = "Updated: N/A";
        //     }

        //     // Set last played timestamp
        //     if (currentGame.id) {
        //         const lastPlayed = this.storageService.getLastPlayedForGame(currentGame.id);
        //         if (lastPlayed) {
        //             this.resultLastPlayed.textContent = `Last played ${Utils.formatRelativeTime(lastPlayed)}`;
        //         } else {
        //             this.resultLastPlayed.textContent = "Last played: Just now";
        //         }
        //     }
        // }

        // Show appropriate message based on score
        // let message = "";
        // if (percentage >= 80) {
        //     message = "Excellent! You have a great eye for headlines!";
        // } else if (percentage >= 60) {
        //     message = "Good work! You have a solid understanding of headline structure.";
        // } else if (percentage >= 40) {
        //     message = "Not bad! Keep practicing your headline unscrambling skills.";
        // } else {
        //     message = "Keep practicing and try again soon.";
        // }

        // // Set the result message
        // this.resultMessageElement.textContent = message;

        const buttonGroup = document.querySelector('.button-group')
        const visibleButtons = buttonGroup.querySelectorAll('button:not([style*="display: none"]), a:not(.hidden)')

        buttonGroup.classList.remove('one-button', 'three-buttons', 'four-buttons')

        switch (visibleButtons.length) {
            case 1:
                buttonGroup.classList.add('one-button')
                break
            case 3:
                buttonGroup.classList.add('three-buttons')
                break
            case 4:
                buttonGroup.classList.add('four-buttons')
                break
        }

        // Show appropriate buttons based on session status
        if (this.sessionService.hasNextGame()) {
            this.nextGameBtn.style.display = "block";
        } else {
            this.nextGameBtn.style.display = "none";
        }

        // Always show these buttons
        this.replayBtn.style.display = "block";

        // Only show session summary button if there are multiple sets
        if (this.sessionService.getTotalGames() > 1) {
            this.sessionSummaryBtn.style.display = "block";
        } else {
            this.sessionSummaryBtn.style.display = "none";
        }

        // Update article link visibility
        this.updateArticleLinks();
    }

    /**
     * Load the next game in the session
     */
    loadNextGame() {
        if (this.sessionService.nextGame()) {
            const gameIndex = this.sessionService.getCurrentGameIndex();
            this.gameService = new HeadlineScrambleService(this.sessionService, gameIndex);

            // Update URL with game data
            const ApiData = this.sessionService.gameData;
            Utils.updateURLWithGameData(gameIndex, ApiData);

            // Update current game display
            this.currentGameElement.textContent = gameIndex + 1;

            // Update article link
            this.updateArticleLinks();

            // Save last played timestamp
            const currentGame = this.sessionService.getCurrentGameData();
            if (currentGame && currentGame.id) {
                this.storageService.saveLastPlayed(currentGame.id);
            }

            // Start the new game
            this.startGame();
        }
    }

    /**
     * Replay the current game
     */
    replayCurrentGame() {
        const gameIndex = this.sessionService.getCurrentGameIndex();

        // Reset game result in session
        this.sessionService.resetGameResult(gameIndex);

        // Create new game service for this game
        this.gameService = new HeadlineScrambleService(this.sessionService, gameIndex);

        // Start the game again
        this.startGame();
    }

    /**
     * Show the session summary
     */
    showSessionSummary() {
        // Hide other containers
        this.scrambleContainer.classList.add("hidden");
        this.resultsContainer.classList.add("hidden");
        this.sessionSummaryContainer.classList.remove("hidden");

        // Apply animation
        this.sessionSummaryContainer.classList.remove("slide-in");
        void this.sessionSummaryContainer.offsetWidth;
        this.sessionSummaryContainer.classList.add("slide-in");

        // Update session summary stats
        // Update session summary stats
        const totalPassedGames = this.sessionService.getTotalPassedGames();
        const totalFailedGames = this.sessionService.getTotalFailedGames();


        // const totalScore = this.sessionService.getTotalSessionScore();
        // const totalHeadlines = this.sessionService.getTotalSessionHeadlines();
        // const percentage = this.sessionService.getSessionScorePercentage();

        this.totalSessionScoreElement.textContent = `Passed: ${totalPassedGames} | Failed: ${totalFailedGames}`;
        // this.totalSessionHeadlinesElement.textContent = totalHeadlines;
        // this.sessionScorePercentageElement.textContent = percentage;

        // Update article link
        this.updateArticleLinks();

        // Generate game-by-game breakdown
        this.renderGameScores();
    }

    /**
     * Render individual game scores in the session summary
     */
    renderGameScores() {
        // Clear previous content
        this.gameScoresContainer.innerHTML = "";

        // Get total games
        const totalGames = this.sessionService.getTotalGames();

        // Create game score cards
        for (let i = 0; i < totalGames; i++) {
            const gameResult = this.sessionService.getGameResult(i);
            const gameData = this.sessionService.gameData[i];
            // const percentage = Math.round((gameResult.score / gameResult.totalHeadlines) * 100) || 0;

            // Get last played timestamp and format it
            let lastPlayedText = "";
            if (gameData && gameData.id) {
                const lastPlayed = this.storageService.getLastPlayedForGame(gameData.id);
                if (lastPlayed) {
                    lastPlayedText = `Last played ${Utils.formatRelativeTime(lastPlayed)}`;
                }
            }

            // Get updated timestamp and format it
            let updatedText = "";
            if (gameData && gameData.updated_at) {
                updatedText = `Updated ${Utils.formatRelativeTime(gameData.updated_at)}`;
            }

            // Create game score card
            const gameCard = document.createElement("div");
            gameCard.className = "game-score-card";

            // Add completed badge if game is completed
            if (gameResult.completed) {
                gameCard.classList.add("completed");
            } else {
                gameCard.classList.add("incomplete");
            }

            // Set game card content
            gameCard.innerHTML = `
                    <h3>Game ${i + 1}</h3>
                    <div class="game-id-display">
                      <!--  <span>ID: ${gameData.id ? gameData.id.substring(0, 8) + "..." : "N/A"}</span>
                        <span>Article: ${gameData.article_guid || "N/A"}</span> -->
                    <!-- <span>${articleData[gameData?.article_guid]?.title || ""}</span> -->

                    </div>
                     <div class="game-status badge">${gameResult.completed ? gameResult.passed ? "Passed" : "Failed" : "Incomplete"}</div>
                    ${updatedText ? `<div class="game-timestamp">${updatedText}</div>` : ""}
                    ${lastPlayedText ? `<div class="game-timestamp">${lastPlayedText}</div>` : ""}
                    `

            // Add click handler to jump to this game
            gameCard.addEventListener("click", (e) => {
                if (i !== this.sessionService.getCurrentGameIndex()) {
                    // Update current game index in session
                    this.sessionService.currentGameIndex = i;

                    // Initialize the selected game
                    this.initCurrentGame();
                } else if (!gameResult.completed) {
                    // If it's the current game but not completed, just restart
                    this.startGame();
                }
            });

            // Add card to container
            this.gameScoresContainer.appendChild(gameCard);
        }
    }

    /**
     * Restart the entire session
     */
    restartSession() {
        this.sessionService.resetSession();
        this.initCurrentGame();
    }

    /**
     * Update the progress bar and text
     */
    updateProgress() {
        const currentHeadline = this.gameService.currentHeadlineIndex + 1;
        const totalHeadlines = this.gameService.getTotalHeadlines();
        const percentage = this.gameService.getProgress();

        // Update progress bar width
        this.progressBar.style.width = `${percentage}%`;

        // Update progress text
        this.progressText.textContent = `Headline ${currentHeadline} of ${totalHeadlines}`;
    }

    /**
  * Show feedback message
  * @param {String} message - Feedback message
  * @param {String} type - Feedback type ('correct' or 'incorrect')
  * @param {String} correctHeadline - The correct headline
  * @param {String} userHeadline - The user's headline (optional)
  */
    showFeedback(message, type, correctHeadline, userHeadline) {
        this.feedbackElement.innerHTML = ""; // Clear previous content



        if (type === "incorrect" && userHeadline) {
            const userHeadlineContainer = document.createElement("p");
            const yourHeadlineText = document.createElement("span");
            yourHeadlineText.textContent = "Your headline: ";
            userHeadlineContainer.appendChild(yourHeadlineText);

            const userHeadlineElement = document.createElement("span");
            userHeadlineElement.textContent = userHeadline;
            userHeadlineElement.style.textDecoration = "line-through";
            userHeadlineContainer.appendChild(userHeadlineElement);

            this.feedbackElement.appendChild(userHeadlineContainer);

            const correctHeadlineElement = document.createElement("p");
            correctHeadlineElement.textContent = `Correct headline: ${correctHeadline}`;
            this.feedbackElement.appendChild(correctHeadlineElement);
        }
        else {
            const messageElement = document.createElement("p");
            messageElement.textContent = message;
            this.feedbackElement.appendChild(messageElement);
        }

        this.feedbackElement.className = `feedback ${type}`;
        this.feedbackElement.style.display = "block";
    }


    /**
     * Hide feedback message
     */
    hideFeedback() {
        this.feedbackElement.className = "feedback"; // Reset the class name
        this.feedbackElement.style.display = "none";
    }
}

/**
 * Main initialization function
 */
function initHeadlineScrambleApp() {
    // Sample headline scramble data
    const gameData = window.gameData
    const articleData  = window.articleData

    // Initialize services and app
    const sessionService = new SessionService(gameData);
    window.sessionService = sessionService; // Make it globally accessible for beforeunload
    const headlineScrambleApp = new HeadlineScrambleApp(sessionService);
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", initHeadlineScrambleApp);

