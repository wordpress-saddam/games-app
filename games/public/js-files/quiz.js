/**
        * SessionService class - handles session-wide data and game tracking
        * Manages multiple game sets and keeps track of session progress
        */
class SessionService {
    constructor(quizData) {
        this.quizData = quizData
        this.gameResults = []
        this.currentGameIndex = 0
        this.initSession()
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
                totalQuestions: this.getQuestionsForGame(i).length,
                completed: false,
            })
        }
    }

    /**
     * Get total number of games in the session
     * @returns {Number} Total games count
     */
    getTotalGames() {
        return this.quizData.games.length
    }

    /**
     * Get current game index (0-based)
     * @returns {Number} Current game index
     */
    getCurrentGameIndex() {
        return this.currentGameIndex
    }

    /**
     * Get questions for a specific game
     * @param {Number} gameIndex - Game index (0-based)
     * @returns {Array} Questions for the specified game
     */
    getQuestionsForGame(gameIndex) {
        return this.quizData.games[gameIndex].data.questions
    }

    /**
     * Get current game questions
     * @returns {Array} Current game questions
     */
    getCurrentGameQuestions() {
        return this.getQuestionsForGame(this.currentGameIndex)
    }

    /**
     * Get current game data
     * @returns {Object} Current game data
     */
    getCurrentGameData() {
        return this.quizData.games[this.currentGameIndex]
    }

    /**
     * Move to the next game in the session
     * @returns {Boolean} Whether there is a next game
     */
    nextGame() {
        if (this.hasNextGame()) {
            this.currentGameIndex++
            return true
        }
        return false
    }

    /**
     * Check if there is a next game in the session
     * @returns {Boolean} Whether there is a next game
     */
    hasNextGame() {
        return this.currentGameIndex < this.getTotalGames() - 1
    }

    /**
     * Update a game's result
     * @param {Number} gameIndex - Game index
     * @param {Number} score - Game score
     * @param {Boolean} completed - Whether the game is completed
     */
    updateGameResult(gameIndex, score, completed) {
        this.gameResults[gameIndex] = {
            ...this.gameResults[gameIndex],
            score,
            completed,
        }
    }

    /**
     * Get a specific game's result
     * @param {Number} gameIndex - Game index
     * @returns {Object} Game result object
     */
    getGameResult(gameIndex) {
        return this.gameResults[gameIndex]
    }

    /**
     * Reset a specific game's result
     * @param {Number} gameIndex - Game index to reset
     */
    resetGameResult(gameIndex) {
        this.gameResults[gameIndex] = {
            gameIndex,
            score: 0,
            totalQuestions: this.getQuestionsForGame(gameIndex).length,
            completed: false,
        }
    }

    /**
     * Get total session score
     * @returns {Number} Total score across all games
     */
    getTotalSessionScore() {
        return this.gameResults.reduce((total, game) => total + game.score, 0)
    }

    /**
     * Get total questions across all games
     * @returns {Number} Total questions count
     */
    getTotalSessionQuestions() {
        return this.gameResults.reduce((total, game) => total + game.totalQuestions, 0)
    }

    /**
     * Get session score percentage
     * @returns {Number} Session score percentage
     */
    getSessionScorePercentage() {
        const totalScore = this.getTotalSessionScore()
        const totalQuestions = this.getTotalSessionQuestions()
        return Math.round((totalScore / totalQuestions) * 100) || 0
    }

    /**
     * Check if all games in the session are completed
     * @returns {Boolean} Whether all games are completed
     */
    isSessionComplete() {
        return this.gameResults.every((game) => game.completed)
    }

    /**
     * Reset the entire session
     */
    resetSession() {
        this.currentGameIndex = 0
        this.initSession()
    }
}

/**
 * QuizService class - handles the quiz data management and business logic for a single game
 */
class QuizService {
    constructor(sessionService, gameIndex) {
        this.sessionService = sessionService
        this.gameIndex = gameIndex
        this.questions = this.sessionService.getQuestionsForGame(gameIndex)
        this.currentQuestionIndex = 0
        this.score = 0
        this.userAnswers = []
    }

    /**
     * Get the current question object
     * @returns {Object} Current question
     */
    getCurrentQuestion() {
        return this.questions[this.currentQuestionIndex]
    }

    /**
     * Get total number of questions
     * @returns {Number} Total questions count
     */
    getTotalQuestions() {
        return this.questions.length
    }

    /**
     * Check if the provided answer is correct
     * @param {String} selectedOption - The option selected by user (a, b, c, d)
     * @returns {Boolean} Whether the answer is correct
     */
    checkAnswer(selectedOption) {
        const currentQuestion = this.getCurrentQuestion()
        const isCorrect = selectedOption === currentQuestion.answer

        // Save user's answer
        this.userAnswers[this.currentQuestionIndex] = {
            selectedOption,
            isCorrect,
        }

        // Update score if correct
        if (isCorrect) {
            this.score++
        }

        return isCorrect
    }

    /**
     * Move to the next question
     * @returns {Boolean} Whether there is a next question
     */
    nextQuestion() {
        if (this.hasNextQuestion()) {
            this.currentQuestionIndex++
            return true
        }
        return false
    }

    /**
     * Check if there is a next question
     * @returns {Boolean} Whether there is a next question
     */
    hasNextQuestion() {
        return this.currentQuestionIndex < this.questions.length - 1
    }

    /**
     * Get the current progress percentage
     * @returns {Number} Progress percentage
     */
    getProgress() {
        return ((this.currentQuestionIndex + 1) / this.questions.length) * 100
    }

    /**
     * Get the final score percentage
     * @returns {Number} Score percentage
     */
    getScorePercentage() {
        return Math.round((this.score / this.questions.length) * 100)
    }

    /**
     * Update session with the current game's result
     */
    updateSessionResult() {
        this.sessionService.updateGameResult(
            this.gameIndex,
            this.score,
            true, // Mark as completed
        )
    }

    /**
     * Reset the quiz
     */
    resetQuiz() {
        this.currentQuestionIndex = 0
        this.score = 0
        this.userAnswers = []
    }
}

/**
 * LocalStorageService - handles storing and retrieving data from localStorage
 */
class LocalStorageService {
    constructor() {
        this.lastPlayedKey = "quiz_last_played"
        this.favoritesKey = "quiz_favorites"
    }

    /**
     * Save last played timestamp for a game
     * @param {String} gameId - Game ID
     */
    saveLastPlayed(gameId) {
        const lastPlayed = this.getLastPlayed() || {}
        lastPlayed[gameId] = new Date().toISOString()
        localStorage.setItem(this.lastPlayedKey, JSON.stringify(lastPlayed))
    }

    /**
     * Get last played timestamps for all games
     * @returns {Object} Object with game IDs as keys and timestamps as values
     */
    getLastPlayed() {
        const data = localStorage.getItem(this.lastPlayedKey)
        return data ? JSON.parse(data) : {}
    }

    /**
     * Get last played timestamp for a specific game
     * @param {String} gameId - Game ID
     * @returns {String|null} ISO timestamp or null if not found
     */
    getLastPlayedForGame(gameId) {
        const lastPlayed = this.getLastPlayed()
        return lastPlayed[gameId] || null
    }

    /**
     * Toggle favorite status for a game
     * @param {String} gameId - Game ID
     * @returns {Boolean} New favorite status
     */
    toggleFavorite(gameId) {
        const favorites = this.getFavorites()
        const index = favorites.indexOf(gameId)

        if (index === -1) {
            favorites.push(gameId)
        } else {
            favorites.splice(index, 1)
        }

        localStorage.setItem(this.favoritesKey, JSON.stringify(favorites))
        return index === -1 // Return true if it was added, false if removed
    }

    /**
     * Get all favorite game IDs
     * @returns {Array} Array of favorite game IDs
     */
    getFavorites() {
        const data = localStorage.getItem(this.favoritesKey)
        return data ? JSON.parse(data) : []
    }

    /**
     * Check if a game is favorited
     * @param {String} gameId - Game ID
     * @returns {Boolean} Whether the game is favorited
     */
    isFavorite(gameId) {
        const favorites = this.getFavorites()
        return favorites.includes(gameId)
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
        if (!isoString) return ""

        const date = new Date(isoString)
        const now = new Date()
        const diffMs = now - date
        const diffSec = Math.floor(diffMs / 1000)
        const diffMin = Math.floor(diffSec / 60)
        const diffHour = Math.floor(diffMin / 60)
        const diffDay = Math.floor(diffHour / 24)

        if (diffSec < 60) {
            return "Just now"
        } else if (diffMin < 60) {
            return `${diffMin} ${diffMin === 1 ? "min" : "mins"} ago`
        } else if (diffHour < 24) {
            return `${diffHour} ${diffHour === 1 ? "hr" : "hrs"} ago`
        } else if (diffDay < 30) {
            return `${diffDay} ${diffDay === 1 ? "day" : "days"} ago`
        } else {
            const month = date.toLocaleString("default", { month: "short" })
            const day = date.getDate()
            return `${month} ${day}`
        }
    },

    /**
     * Update URL with game data
     * @param {Number} index - Game index
     * @param {Object} ApiData - API data object
     */
    updateURLWithGameData(index, ApiData) {
        const url = new URL(window.location)
        const currentGameId = url.searchParams.get("game_id")
        const currentArticleGuid = url.searchParams.get("article_guid")
        const newGameId = ApiData.games[index]?.id ?? currentGameId
        const newArticleGuid = ApiData.games[index]?.article_guid ?? currentArticleGuid

        if (currentGameId !== newGameId || currentArticleGuid !== newArticleGuid) {
            url.searchParams.set("game_id", newGameId)
            url.searchParams.set("article_guid", newArticleGuid)
            window.history.pushState({}, "", url)
        }
    },

    /**
     * Check if URL has a specific parameter
     * @param {String} param - Parameter name
     * @returns {Boolean} Whether the parameter exists
     */
    urlHasParam(param) {
        const url = new URL(window.location)
        return url.searchParams.has(param)
    },

    /**
     * Get URL parameter value
     * @param {String} param - Parameter name
     * @returns {String|null} Parameter value or null
     */
    getUrlParam(param) {
        const url = new URL(window.location)
        return url.searchParams.get(param)
    },
}

/**
 * QuizApp class - handles the UI interactions and DOM updates
 */
class QuizApp {
    constructor(sessionService) {
        this.sessionService = sessionService
        this.quizService = null
        this.storageService = new LocalStorageService()
        this.initElements()
        this.initEventListeners()
        this.initCurrentGame()
        //   this.updateGameTitle() 

    }

    /**
     * Initialize DOM element references
     */
    initElements() {
        // Header elements
        this.currentGameElement = document.getElementById("current-game")
        this.totalGamesElement = document.getElementById("total-games")
        this.quizBrandingContainer = document.querySelector(".quiz-header");
        // Question elements
        this.questionContainer = document.getElementById("question-container")
        this.questionElement = document.getElementById("question")
        this.optionsContainer = document.querySelector(".options-container")
        this.optionElements = document.querySelectorAll(".option")
        this.optionInputs = document.querySelectorAll(".option-input")

        // Option text elements
        this.optionAText = document.getElementById("option-a-text")
        this.optionBText = document.getElementById("option-b-text")
        this.optionCText = document.getElementById("option-c-text")
        this.optionDText = document.getElementById("option-d-text")

        // Buttons
        this.submitBtn = document.getElementById("submit-btn")
        // this.nextBtn = document.getElementById("next-btn")
        this.nextGameBtn = document.getElementById("next-game-btn")
        this.replayBtn = document.getElementById("replay-btn")
        this.sessionSummaryBtn = document.getElementById("session-summary-btn")
        this.restartSessionBtn = document.getElementById("restart-session-btn")
        this.articleLinkBtn = document.getElementById("article-link-btn")
        this.summaryArticleLinkBtn = document.getElementById("summary-article-link-btn")
        // this.resultFavoriteToggle = document.getElementById("result-favorite-toggle")

        // Progress elements
        this.progressBar = document.getElementById("progress-bar")
        this.progressText = document.getElementById("progress-text")

        // Feedback and results
        this.feedbackElement = document.getElementById("feedback")
        this.resultsContainer = document.getElementById("results-container")
        this.scoreElement = document.getElementById("score")
        this.totalQuestionsElement = document.getElementById("total-questions")
        this.scorePercentageElement = document.getElementById("score-percentage")
        this.resultMessageElement = document.getElementById("result-message")

        // Result info elements
        // this.resultGameId = document.getElementById("result-game-id")
        // this.resultArticleGuid = document.getElementById("result-article-guid")
        // this.resultUpdatedAt = document.getElementById("result-updated-at")
        // this.resultLastPlayed = document.getElementById("result-last-played")

        // Session summary elements
        this.sessionSummaryContainer = document.getElementById("session-summary-container")
        this.totalSessionScoreElement = document.getElementById("total-session-score")
        this.totalSessionQuestionsElement = document.getElementById("total-session-questions")
        this.sessionScorePercentageElement = document.getElementById("session-score-percentage")
        this.gameScoresContainer = document.getElementById("game-scores-container")
    }

    /**
     * Initialize event listeners
     */
    initEventListeners() {
        // Option selection
        this.optionElements.forEach((option) => {
            option.addEventListener("click", () => {
                this.selectOption(option)
            })
        })

        // Button clicks
        this.submitBtn.addEventListener("click", () => this.submitAnswer())
        // this.nextBtn.addEventListener("click", () => this.loadNextQuestion())
        this.nextGameBtn.addEventListener("click", () => this.loadNextGame())
        this.replayBtn.addEventListener("click", () => this.replayCurrentGame())
        this.sessionSummaryBtn.addEventListener("click", () => this.showSessionSummary())
        this.restartSessionBtn.addEventListener("click", () => this.restartSession())

        // Favorite toggle in results
        // if (this.resultFavoriteToggle) {
        //   this.resultFavoriteToggle.addEventListener("click", () => {
        //     const currentGame = this.sessionService.getCurrentGameData()
        //     if (currentGame && currentGame.id) {
        //       const isFavorite = this.storageService.toggleFavorite(currentGame.id)
        //       this.resultFavoriteToggle.classList.toggle("active", isFavorite)
        //     }
        //   })
        // }

        // Accordion functionality
        const accordionHeaders = document.querySelectorAll(".accordion-header")
        accordionHeaders.forEach((header) => {
            header.addEventListener("click", () => {
                const accordionItem = header.parentElement
                accordionItem.classList.toggle("active")
            })
        })


    }
    /**
     * Hide the quiz header
     */
    hideQuizHeader() {

        // this.quizBrandingContainer.style.display = "none";
        let headerTitle = this.quizBrandingContainer.querySelector("h1");
        if (headerTitle) {
            headerTitle.style.display = "none";
        }
        let progressContainer = this.quizBrandingContainer.querySelector(".progress-container");
        if (progressContainer) {
            progressContainer.style.display = "none";
        }
        let progressText = this.quizBrandingContainer.querySelector(".progress-text");
        if (progressText) {
            progressText.style.display = "none";
        }
    }

    /**
     * Show the quiz header
     */
    showQuizHeader() {
        // this.quizBrandingContainer.style.display = "block"; //this is not working 
        let headerTitle = this.quizBrandingContainer.querySelector("h1");
        if (headerTitle) {
            headerTitle.style.display = "block";
        }
        let progressContainer = this.quizBrandingContainer.querySelector(".progress-container");
        if (progressContainer) {
            progressContainer.style.display = "block";
        }
        let progressText = this.quizBrandingContainer.querySelector(".progress-text");
        if (progressText) {
            progressText.style.display = "block";
        }
    }


    /**
     * Update article link visibility based on URL parameters
     */
    updateArticleLinks() {
        const currentGame = this.sessionService.getCurrentGameData()
        const articleGuid = currentGame?.article_guid || Utils.getUrlParam("article_guid")
        const showArticleLink = Utils.urlHasParam("src") && Utils.getUrlParam("src") === "article"

        // Update main article link
        if (this.articleLinkBtn) {
            if (showArticleLink && articleGuid) {
                this.articleLinkBtn.href = `${articleGuid}`
                this.articleLinkBtn.classList.remove("hidden")
            } else {
                this.articleLinkBtn.classList.add("hidden")
            }
        }

        // Update summary article link
        if (this.summaryArticleLinkBtn) {
            if (showArticleLink && articleGuid) {
                this.summaryArticleLinkBtn.href = `${articleGuid}`
                this.summaryArticleLinkBtn.classList.remove("hidden")
            } else {
                this.summaryArticleLinkBtn.classList.add("hidden")
            }
        }
    }

    /**
    * Update the game title in the quiz branding area
    */
    updateGameTitle() {
        if (!this.quizBrandingContainer) {
            console.error("quizBrandingContainer is null. Cannot update game title.");
            return;
        }

        //1. Find the existing h1 tag within the container
        let titleElement = this.quizBrandingContainer.querySelector("h1");

        // 2. If no h1 exists, create one and append it
        if (!titleElement) {
            titleElement = document.createElement("h1");
            this.quizBrandingContainer.appendChild(titleElement);
        }

        // 3. Get the title text
        const currentGameData = this.sessionService.getCurrentGameData();
        if (currentGameData && currentGameData.data && currentGameData.data.title) {
            titleElement.textContent = currentGameData.data.title;
        } else {
            titleElement.textContent = "Quiz Game"; // Default title
        }
    }


    /**
     * Initialize the current game
     */
    initCurrentGame() {
        const gameIndex = this.sessionService.getCurrentGameIndex()
        this.quizService = new QuizService(this.sessionService, gameIndex)
        const currentGame = this.sessionService.getCurrentGameData()

        // Save last played timestamp
        if (currentGame && currentGame.id) {
            this.storageService.saveLastPlayed(currentGame.id)
        }

        // Update URL with game data
        const ApiData = this.sessionService.quizData
        Utils.updateURLWithGameData(gameIndex, ApiData)

        // Update header info
        this.totalGamesElement.textContent = this.sessionService.getTotalGames()
        this.currentGameElement.textContent = gameIndex + 1

        // Check if we should show the article link
        this.updateArticleLinks()

        // Handle single-set session
        if (this.sessionService.getTotalGames() === 1) {
            this.sessionSummaryBtn.style.display = "none"
        } else {
            this.sessionSummaryBtn.style.display = "block"
        }

        // Update the game title
        this.updateGameTitle();

        // Start the game
        this.startGame()
    }

    /**
     * Update article link visibility based on URL parameters
     */
    /**
     * Start the game by loading the first question
     */
    startGame() {
        // Reset containers visibility
        this.questionContainer.classList.remove("hidden")
        this.resultsContainer.classList.add("hidden")
        this.sessionSummaryContainer.classList.add("hidden")

        // Update total questions
        this.totalQuestionsElement.textContent = this.quizService.getTotalQuestions()

        // Load first question
        this.loadQuestion()
    }

    /**
     * Load the current question and options
     */
    loadQuestion() {
        const currentQuestion = this.quizService.getCurrentQuestion()

        // Reset previous selections and feedback
        this.resetOptions()
        this.hideFeedback()
        this.showQuizHeader()
        // Update question text and options
        this.questionElement.textContent = currentQuestion.question
        this.optionAText.textContent = currentQuestion.a
        this.optionBText.textContent = currentQuestion.b
        this.optionCText.textContent = currentQuestion.c
        this.optionDText.textContent = currentQuestion.d

        // Update progress
        this.updateProgress()

        // Apply fade-in animation
        this.questionContainer.classList.remove("fade-in")
        void this.questionContainer.offsetWidth // Trigger reflow
        this.questionContainer.classList.add("fade-in")

        // Show submit button, hide next button
        this.submitBtn.style.display = "block"
        // this.nextBtn.style.display = "none"
    }

    /**
     * Handle option selection
     */
    selectOption(selectedOption) {
        // Remove selected class from all options
        this.optionElements.forEach((option) => {
            option.classList.remove("selected")
        })

        // Add selected class to clicked option
        selectedOption.classList.add("selected")

        // Check the corresponding radio button
        const optionId = selectedOption.getAttribute("data-option")
        document.getElementById(`option-${optionId}`).checked = true
    }

    /**
     * Reset option styles and selections
     */
    resetOptions() {
        this.optionElements.forEach((option) => {
            option.classList.remove("selected", "correct", "incorrect", "disabled")
            option.style.pointerEvents = "auto"; // Enable pointer events
        })

        this.optionInputs.forEach((input) => {
            input.checked = false
        })
    }

    /**
     * Submit the current answer
     */
    submitAnswer() {
        // Find selected option
        const selectedInput = Array.from(this.optionInputs).find((input) => input.checked)

        if (!selectedInput) {
            // Show error if no option selected
            // this.showFeedback("Please select an answer", "incorrect")
            return
        }

        // Get selected option value (a, b, c, d)
        const selectedOption = selectedInput.id.replace("option-", "")
        const isCorrect = this.quizService.checkAnswer(selectedOption)

        // Show visual feedback
        this.showAnswerFeedback(selectedOption, isCorrect)

        // Disable all options after submitting
        this.disableOptions();

        // Hide submit button, show next button
        this.submitBtn.style.display = "none"

        setTimeout(() => {
            if (this.quizService.hasNextQuestion()) {
                this.quizService.nextQuestion();
                this.loadQuestion();
            } else {
                this.showResults();
            }
        }, 2000); // 1-second delay for feedback
    }


    /**
* Disable all options after submitting an answer
*/
    disableOptions() {
        this.optionElements.forEach((option) => {
            option.classList.add("disabled");
            option.style.pointerEvents = "none"; // Disable pointer events
        });
    }

    /**
     * Show visual feedback for the answer
     */
    showAnswerFeedback(selectedOption, isCorrect) {
        const currentQuestion = this.quizService.getCurrentQuestion()
        const correctOption = currentQuestion.answer

        // Highlight correct and incorrect options
        this.optionElements.forEach((option) => {
            const optionValue = option.getAttribute("data-option")

            if (optionValue === correctOption) {
                option.classList.add("correct")
            } else if (optionValue === selectedOption && !isCorrect) {
                option.classList.add("incorrect")
            }
        })

        // // Show feedback message
        // if (isCorrect) {
        //     this.showFeedback("Correct! Well done!", "correct")
        // } else {
        //     this.showFeedback(`Incorrect. The correct answer is: ${currentQuestion[correctOption]}`, "incorrect")
        // }
    }

    /**
     * Load the next question
     */
    // loadNextQuestion() {
    //     if (this.nextBtn.textContent === "Show Results") {
    //         this.showResults()
    //         return
    //     }

    //     if (this.quizService.nextQuestion()) {
    //         this.loadQuestion()
    //     } else {
    //         this.showResults()
    //     }
    // }

    /**
     * Show the game results
     */
    showResults() {
        // Update session with game results
        this.quizService.updateSessionResult()

        // Get current game data
        const currentGame = this.sessionService.getCurrentGameData()

        // Hide question container, show results
        this.questionContainer.classList.add("hidden")
        this.resultsContainer.classList.remove("hidden")
        this.sessionSummaryContainer.classList.add("hidden")

        // Apply animation
        this.resultsContainer.classList.remove("slide-in")
        void this.resultsContainer.offsetWidth
        this.resultsContainer.classList.add("slide-in")

        // Update score information
        const score = this.quizService.score
        const totalQuestions = this.quizService.getTotalQuestions()
        const percentage = this.quizService.getScorePercentage()

        this.scoreElement.textContent = score
        this.scorePercentageElement.textContent = percentage

        // Update game info in results
        // if (currentGame) {
        //     // Set game ID and article GUID
        //     // this.resultGameId.textContent = currentGame.data?.title ? currentGame.id.substring(0, 8) + "..." : "N/A"
        //     // this.resultArticleGuid.textContent = currentGame.article_guid || "N/A"
        //     // this.resultGameId.textContent = currentGame.data?.title ? currentGame.data?.title : "N/A"

        //     // Set updated timestamp
        //     if (currentGame.updated_at) {
        //         this.resultUpdatedAt.textContent = `Updated ${Utils.formatRelativeTime(currentGame.updated_at)}`
        //     } else {
        //         this.resultUpdatedAt.textContent = "Updated: N/A"
        //     }

        //     // Set last played timestamp
        //     if (currentGame.id) {
        //         const lastPlayed = this.storageService.getLastPlayedForGame(currentGame.id)
        //         if (lastPlayed) {
        //             this.resultLastPlayed.textContent = `Last played ${Utils.formatRelativeTime(lastPlayed)}`
        //         } else {
        //             this.resultLastPlayed.textContent = "Last played: Just now"
        //         }

        //         // Update favorite toggle
        //         // if (this.resultFavoriteToggle) {
        //         //   const isFavorite = this.storageService.isFavorite(currentGame.id)
        //         //   this.resultFavoriteToggle.classList.toggle("active", isFavorite)
        //         // }
        //     }
        // }

        // Show appropriate message based on score
        let message = ""
        if (percentage >= 80) {
            message = "Excellent! You did a great job!"
        } else if (percentage >= 60) {
            message = "Good work! You have a solid understanding."
        } else if (percentage >= 40) {
            message = "Not bad! Keep learning and try again."
        } else {
            message = "Keep studying and try again soon."
        }

        // Set the result message
        this.resultMessageElement.textContent = message

        // Show appropriate buttons based on session status
        if (this.sessionService.hasNextGame()) {
            this.nextGameBtn.style.display = "block"
        } else {
            this.nextGameBtn.style.display = "none"
        }

        // Always show these buttons
        this.replayBtn.style.display = "block"

        // Only show session summary button if there are multiple sets
        if (this.sessionService.getTotalGames() > 1) {
            this.sessionSummaryBtn.style.display = "block"
        } else {
            this.sessionSummaryBtn.style.display = "none"
        }

        this.hideQuizHeader();
        // Update button group layout class based on visible buttons
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

        // Update article link visibility
        this.updateArticleLinks()
    }

    /**
     * Load the next game in the session
     */
    loadNextGame() {
        if (this.sessionService.nextGame()) {
            const gameIndex = this.sessionService.getCurrentGameIndex()
            this.quizService = new QuizService(this.sessionService, gameIndex)

            // Update URL with game data
            const ApiData = this.sessionService.quizData
            Utils.updateURLWithGameData(gameIndex, ApiData)

            // Update current game display
            this.currentGameElement.textContent = gameIndex + 1

            // Update article link
            this.updateArticleLinks()

            // Save last played timestamp
            const currentGame = this.sessionService.getCurrentGameData()
            if (currentGame && currentGame.id) {
                this.storageService.saveLastPlayed(currentGame.id)
            }

            // Update the game title
            this.updateGameTitle();

            // Start the new game
            this.startGame()
        }
    }

    /**
     * Replay the current game
     */
    replayCurrentGame() {
        const gameIndex = this.sessionService.getCurrentGameIndex()

        // Reset game result in session
        this.sessionService.resetGameResult(gameIndex)

        // Create new quiz service for this game
        this.quizService = new QuizService(this.sessionService, gameIndex)

        // Update the game title
        this.updateGameTitle();

        // Start the game again
        this.startGame()
    }

    /**
     * Show the session summary
     */
    showSessionSummary() {
        // Hide other containers
        this.questionContainer.classList.add("hidden")
        this.resultsContainer.classList.add("hidden")
        this.sessionSummaryContainer.classList.remove("hidden")

        // Apply animation
        this.sessionSummaryContainer.classList.remove("slide-in")
        void this.sessionSummaryContainer.offsetWidth
        this.sessionSummaryContainer.classList.add("slide-in")

        // Update session summary stats
        const totalScore = this.sessionService.getTotalSessionScore()
        const totalQuestions = this.sessionService.getTotalSessionQuestions()
        const percentage = this.sessionService.getSessionScorePercentage()

        this.totalSessionScoreElement.textContent = totalScore
        this.totalSessionQuestionsElement.textContent = totalQuestions
        this.sessionScorePercentageElement.textContent = percentage

        this.hideQuizHeader();
        // Update article link
        this.updateArticleLinks()

        // Generate game-by-game breakdown
        this.renderGameScores()
    }

    /**
     * Render individual game scores in the session summary
     */
    renderGameScores() {
        // Clear previous content
        this.gameScoresContainer.innerHTML = ""

        // Get total games
        const totalGames = this.sessionService.getTotalGames()

        // Create game score cards
        for (let i = 0; i < totalGames; i++) {
            const gameResult = this.sessionService.getGameResult(i)
            const gameData = this.sessionService.quizData.games[i]
            const percentage = Math.round((gameResult.score / gameResult.totalQuestions) * 100) || 0

            // Get last played timestamp and format it
            let lastPlayedText = ""
            if (gameData && gameData.id) {
                const lastPlayed = this.storageService.getLastPlayedForGame(gameData.id)
                if (lastPlayed) {
                    lastPlayedText = `Last played ${Utils.formatRelativeTime(lastPlayed)}`
                }
            }

            // Get updated timestamp and format it
            let updatedText = ""
            if (gameData && gameData.updated_at) {
                updatedText = `Updated ${Utils.formatRelativeTime(gameData.updated_at)}`
            }

            // Create game score card
            const gameCard = document.createElement("div")
            gameCard.className = "game-score-card"

            // Add completed badge if game is completed
            if (gameResult.completed) {
                gameCard.classList.add("completed")
            } else {
                gameCard.classList.add("incomplete")
            }
            // Set game card content
            gameCard.innerHTML = `
            <h3>${gameData?.data?.title ?? `Quiz ${i + 1}`}</h3>
            <div class="game-id-display">
             <!-- <span>ID: ${gameData.id ? gameData.id.substring(0, 8) + "..." : "N/A"}</span>
              <span>Article: ${gameData.article_guid || "N/A"}</span>  -->
              <span>${articleData[gameData?.article_guid]?.title || ""}</span>
            </div>
            <div class="game-score-details">
              <div class="game-score"> Score : ${gameResult.score}/${gameResult.totalQuestions}</div>
              <div class="game-percentage">${percentage}%</div>
            </div>
            <div class="game-status badge">${gameResult.completed ? "Completed" : "Not completed"}</div>
            ${updatedText ? `<div class="game-timestamp">${updatedText}</div>` : ""}
            ${lastPlayedText ? `<div class="game-timestamp">${lastPlayedText}</div>` : ""}
            <!-- <button class="favorite-toggle ${this.storageService.isFavorite(gameData.id) ? "active" : ""}" 
                    data-game-id="${gameData.id}">★</button> -->
          `

            // Add click handler to jump to this game
            gameCard.addEventListener("click", (e) => {
                // Don't trigger if clicking the favorite button
                // if (e.target.classList.contains("favorite-toggle")) {
                //   return
                // }

                if (i !== this.sessionService.getCurrentGameIndex()) {
                    // Update current game index in session
                    this.sessionService.currentGameIndex = i

                    // Initialize the selected game
                    this.initCurrentGame()
                } else if (!gameResult.completed) {
                    // If it's the current game but not completed, just restart
                    this.startGame()
                }
            })

            // Add favorite toggle handler
            // const favoriteBtn = gameCard.querySelector(".favorite-toggle")
            // if (favoriteBtn) {
            //   favoriteBtn.addEventListener("click", (e) => {
            //     e.stopPropagation() // Prevent card click
            //     const gameId = e.target.getAttribute("data-game-id")
            //     const isFavorite = this.storageService.toggleFavorite(gameId)
            //     e.target.classList.toggle("active", isFavorite)
            //   })
            // }

            // Add card to container
            this.gameScoresContainer.appendChild(gameCard)
        }
    }

    /**
     * Restart the entire session
     */
    restartSession() {
        this.sessionService.resetSession()
        this.initCurrentGame()
        // Update the game title
        this.updateGameTitle();
    }

    /**
     * Update the progress bar and text
     */
    updateProgress() {
        const currentQuestion = this.quizService.currentQuestionIndex + 1
        const totalQuestions = this.quizService.getTotalQuestions()
        const percentage = this.quizService.getProgress()

        // Update progress bar width
        this.progressBar.style.width = `${percentage}%`

        // Update progress text
        this.progressText.textContent = `Question ${currentQuestion} of ${totalQuestions}`
    }

    /**
     * Show feedback message
     * @param {String} message - Feedback message
     * @param {String} type - Feedback type ('correct' or 'incorrect')
     */
    showFeedback(message, type) {
        this.feedbackElement.textContent = message
        this.feedbackElement.className = `feedback ${type}`
        this.feedbackElement.style.display = "block"
    }

    /**
     * Hide feedback message
     */
    hideFeedback() {
        this.feedbackElement.className = "feedback" // Reset the class name
        this.feedbackElement.style.display = "none"
    }
}

/**
 * Main initialization function
 */
function initQuizApp() {
    // Sample quiz data
    const quizData = window.gameData
    const articleData = window.articleData

    // Initialize services and app
    const sessionService = new SessionService(quizData)
    window.sessionService = sessionService // Make it globally accessible for beforeunload
    const quizApp = new QuizApp(sessionService)
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", initQuizApp)