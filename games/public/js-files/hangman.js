
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
 * Extended SessionService class - handles session-wide data and game tracking
 * Now supports both quiz and hangman game types
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
                passed: false,
                totalQuestions: this.getQuestionsForGame(i).length,
                completed: false,
                gameType: this.getGameType(i),
            })
        }
    }

    /**
     * Get game type for a specific game
     * @param {Number} gameIndex - Game index (0-based)
     * @returns {String} Game type ('quiz' or 'hangman')
     */
    getGameType(gameIndex) {
        return this.quizData.games[gameIndex].game_type || "quiz"
    }

    /**
     * Get current game type
     * @returns {String} Current game type ('quiz' or 'hangman')
     */
    getCurrentGameType() {
        return this.getGameType(this.currentGameIndex)
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
        // For hangman games, return an empty array since they don't have questions
        if (this.getGameType(gameIndex) === "hangman") {
            return []
        }
        return this.quizData.games[gameIndex].data.questions || []
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
    updateGameResult(gameIndex, score, passed, completed) {
        this.gameResults[gameIndex] = {
            ...this.gameResults[gameIndex],
            score,
            passed,
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
            passed: false,
            totalQuestions: this.getQuestionsForGame(gameIndex).length,
            completed: false,
            gameType: this.getGameType(gameIndex),
        }
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
        return this.gameResults.reduce((total, game) => total + game.score, 0)
    }

    /**
     * Get total questions across all games
     * @returns {Number} Total questions count
     */
    getTotalSessionQuestions() {
        return this.gameResults.reduce((total, game) => {
            // For hangman games, use word length as the "question" count
            if (game.gameType === "hangman") {
                const gameData = this.quizData.games[game.gameIndex]
                return total + (gameData.data.word ? gameData.data.word.length : 0)
            }
            return total + game.totalQuestions
        }, 0)
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
        const isCorrect =
            selectedOption === currentQuestion.answer || currentQuestion[selectedOption] === currentQuestion.answer

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
 * HangmanService class - handles the hangman game data management and business logic
 */
class HangmanService {
    constructor(sessionService, gameIndex) {
        this.sessionService = sessionService
        this.gameIndex = gameIndex
        this.gameData = this.sessionService.getCurrentGameData()

        // Game state
        this.word = this.gameData.data.word.toUpperCase()
        this.hint = this.gameData.data.clue
        this.guessedLetters = new Set()
        this.incorrectGuesses = 0
        this.maxIncorrectGuesses = 6
        this.isGameOver = false
        this.isWinner = false
        this.score = 0
        this.passed = false;

    }

    /**
     * Get the current word with only guessed letters revealed
     * @returns {String} Word with unguessed letters as underscores
     */
    getDisplayWord() {
        return this.word
            .split("")
            .map((letter) => (this.guessedLetters.has(letter) ? letter : "_"))
            .join(" ")
    }

    /**
     * Get the hint for the current word
     * @returns {String} Hint text
     */
    getHint() {
        return this.hint
    }

    /**
     * Check if a letter has been guessed
     * @param {String} letter - Letter to check
     * @returns {Boolean} Whether the letter has been guessed
     */
    isLetterGuessed(letter) {
        return this.guessedLetters.has(letter)
    }

    /**
     * Get all guessed letters
     * @returns {Set} Set of guessed letters
     */
    getGuessedLetters() {
        return this.guessedLetters
    }

    /**
     * Get number of incorrect guesses
     * @returns {Number} Incorrect guesses count
     */
    getIncorrectGuesses() {
        return this.incorrectGuesses
    }

    /**
     * Get maximum allowed incorrect guesses
     * @returns {Number} Max incorrect guesses
     */
    getMaxIncorrectGuesses() {
        return this.maxIncorrectGuesses
    }

    /**
     * Check if the game is over (win or loss)
     * @returns {Boolean} Whether the game is over
     */
    checkGameOver() {
        return this.isGameOver
    }

    /**
     * Check if the player has won
     * @returns {Boolean} Whether the player has won
     */
    checkWinner() {
        return this.isWinner
    }

    /**
     * Make a guess with a letter
     * @param {String} letter - Letter to guess
     * @returns {Object} Result of the guess
     */
    guessLetter(letter) {
        letter = letter.toUpperCase()

        // If game is over or letter already guessed, return early
        if (this.isGameOver || this.guessedLetters.has(letter)) {
            return {
                alreadyGuessed: this.guessedLetters.has(letter),
                isCorrect: false,
                isGameOver: this.isGameOver,
                isWinner: this.isWinner,
                displayWord: this.getDisplayWord(),
            }
        }

        // Add letter to guessed letters
        this.guessedLetters.add(letter)

        // Check if letter is in the word
        const isCorrect = this.word.includes(letter)

        // If incorrect, increment incorrect guesses
        if (!isCorrect) {
            this.incorrectGuesses++
        }

        // Check if game is over (win or loss)
        if (this.incorrectGuesses >= this.maxIncorrectGuesses) {
            this.isGameOver = true
            this.passed = false;
        } else if (this.word.split("").every((letter) => this.guessedLetters.has(letter))) {
            this.isGameOver = true
            this.isWinner = true
            this.passed = true;
            // Calculate score based on word length and incorrect guesses
            const baseScore = this.word.length
            const penaltyFactor = 1 - (this.incorrectGuesses / this.maxIncorrectGuesses) * 0.5
            this.score = Math.round(baseScore * penaltyFactor)
        }

        return {
            alreadyGuessed: false,
            isCorrect,
            isGameOver: this.isGameOver,
            isWinner: this.isWinner,
            displayWord: this.getDisplayWord(),
        }
    }

    /**
     * Get the current progress percentage
     * @returns {Number} Progress percentage
     */
    getProgress() {
        // For hangman, progress is based on letters guessed vs total unique letters
        const uniqueLetters = new Set(this.word.split(""))
        const guessedUniqueLetters = [...uniqueLetters].filter((letter) => this.guessedLetters.has(letter)).length

        return (guessedUniqueLetters / uniqueLetters.size) * 100
    }

    /**
     * Get the final score
     * @returns {Number} Final score
     */
    getScore() {
        return this.score
    }

    /**
     * Get the score percentage
     * @returns {Number} Score percentage
     */
    getScorePercentage() {
        // For hangman, percentage is based on score vs word length
        return Math.round((this.score / this.word.length) * 100)
    }

    /**
     * Update session with the current game's result
     */
    updateSessionResult() {
        this.sessionService.updateGameResult(
            this.gameIndex,
            this.score,
            this.passed,
            this.isGameOver, // Mark as completed if game is over
        )
    }

    /**
     * Reset the game
     */
    resetGame() {
        this.guessedLetters = new Set()
        this.incorrectGuesses = 0
        this.isGameOver = false
        this.isWinner = false
        this.score = 0
        this.passed = false;
    }
}

/**
 * HangmanUI class - handles the UI interactions and DOM updates for Hangman game
 */
class HangmanUI {
    constructor(hangmanService, appInstance) {
        this.hangmanService = hangmanService
        this.appInstance = appInstance
        this.initElements()
        this.initEventListeners()
        this.renderGame()
    }

    /**
     * Initialize DOM element references
     */
    initElements() {
        // Reuse existing elements from quiz UI
        this.questionContainer = document.getElementById("question-container")
        this.resultsContainer = document.getElementById("results-container")
        this.sessionSummaryContainer = document.getElementById("session-summary-container")

        // Progress elements
        this.progressBar = document.getElementById("progress-bar")
        this.progressText = document.getElementById("progress-text")

        // Hangman specific elements
        this.hangmanContainer = document.createElement("div")
        this.hangmanContainer.className = "hangman-container"
        this.hangmanContainer.innerHTML = `
        <div class="instruction" id="hangman-instruction">
                    Guess The Correct Letters : 
                </div>
                    <div class="hangman-drawing-container">
                    
                        <div class="hangman-drawing" id="hangman-drawing">
                            <svg width="200" height="160" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
                                <!-- Base -->
                                <line x1="40" y1="140" x2="120" y2="140" stroke="#333" stroke-width="3" />
                                <!-- Vertical pole -->
                                <line x1="60" y1="140" x2="60" y2="20" stroke="#333" stroke-width="3" class="hangman-part" data-part="1" />
                                <!-- Horizontal beam -->
                                <line x1="60" y1="20" x2="100" y2="20" stroke="#333" stroke-width="3" class="hangman-part" data-part="2" />
                                <!-- Rope -->
                                <line x1="100" y1="20" x2="100" y2="40" stroke="#333" stroke-width="3" class="hangman-part" data-part="3" />
                                <!-- Head -->
                                <circle cx="100" cy="50" r="10" stroke="#333" stroke-width="3" fill="none" class="hangman-part" data-part="4" />
                                <!-- Body -->
                                <line x1="100" y1="60" x2="100" y2="90" stroke="#333" stroke-width="3" class="hangman-part" data-part="5" />
                                <!-- Arms -->
                                <line x1="100" y1="70" x2="80" y2="65" stroke="#333" stroke-width="3" class="hangman-part" data-part="6" />
                                <line x1="100" y1="70" x2="120" y2="65" stroke="#333" stroke-width="3" class="hangman-part" data-part="7" />
                                <!-- Legs -->
                                <line x1="100" y1="90" x2="85" y2="110" stroke="#333" stroke-width="3" class="hangman-part" data-part="8" />
                                <line x1="100" y1="90" x2="115" y2="110" stroke="#333" stroke-width="3" class="hangman-part" data-part="9" />
                            </svg>
                        </div>
                    </div>
                    <div class="hangman-word-container">
                        <div class="hangman-word" id="hangman-word"></div>
                        <div class="hangman-hint" id="hangman-hint"></div>
                        <div class="hangman-guesses">
                            <span>Incorrect guesses: </span>
                            <span id="hangman-incorrect-guesses">0</span>
                            <span>/</span>
                            <span id="hangman-max-guesses">6</span>
                        </div>
                    </div>
                    <div class="hangman-keyboard" id="hangman-keyboard">
                        <!-- Keyboard will be generated dynamically -->
                    </div>
                   <!-- <div class="feedback" id="hangman-feedback"></div> -->
                `

        // Replace question container content with hangman container
        this.questionContainer.innerHTML = ""
        this.questionContainer.appendChild(this.hangmanContainer)

        // Get hangman specific elements
        this.hangmanWord = document.getElementById("hangman-word")
        this.hangmanHint = document.getElementById("hangman-hint")
        this.hangmanIncorrectGuesses = document.getElementById("hangman-incorrect-guesses")
        this.hangmanMaxGuesses = document.getElementById("hangman-max-guesses")
        this.hangmanKeyboard = document.getElementById("hangman-keyboard")
        this.hangmanFeedback = document.getElementById("hangman-feedback")
        this.hangmanDrawing = document.getElementById("hangman-drawing")

        // Create keyboard
        this.createKeyboard()
    }

    /**
     * Create the keyboard for letter input
     */
    createKeyboard() {
        const rows = [
            ["A", "B", "C", "D", "E", "F", "G", "H"],
            ["I", "J", "K", "L", "M", "N", "O", "P"],
            ["Q", "R", "S", "T", "U", "V", "W", "X"],
            ["Y", "Z"],
        ]

        rows.forEach((row) => {
            const rowElement = document.createElement("div")
            rowElement.className = "keyboard-row"

            row.forEach((letter) => {
                const key = document.createElement("button")
                key.className = "keyboard-key"
                key.textContent = letter
                key.dataset.letter = letter
                rowElement.appendChild(key)
            })

            this.hangmanKeyboard.appendChild(rowElement)
        })
    }

    /**
     * Initialize event listeners
     */
    initEventListeners() {
        // Keyboard key clicks
        this.hangmanKeyboard.addEventListener("click", (e) => {
            if (e.target.classList.contains("keyboard-key")) {
                const letter = e.target.dataset.letter
                this.handleLetterGuess(letter)
            }
        })

        // Physical keyboard support
        document.addEventListener("keydown", (e) => {
            if (this.hangmanContainer.classList.contains("hidden")) {
                return // Only handle keydown when hangman is visible
            }

            const key = e.key.toUpperCase()
            if (/^[A-Z]$/.test(key)) {
                this.handleLetterGuess(key)
            }
        })
    }

    /**
     * Handle letter guess
     * @param {String} letter - Letter that was guessed
     */
    handleLetterGuess(letter) {
        if (this.hangmanService.checkGameOver()) {
            return // Game is already over
        }

        const result = this.hangmanService.guessLetter(letter)

        if (result.alreadyGuessed) {
            this.showFeedback("You already guessed that letter!", "info")
            return
        }

        // Update keyboard UI
        const keyElement = this.hangmanKeyboard.querySelector(`[data-letter="${letter}"]`)
        if (keyElement) {
            keyElement.classList.add(result.isCorrect ? "correct" : "incorrect")
            keyElement.disabled = true
        }

        // Update word display
        this.hangmanWord.textContent = result.displayWord

        // Update incorrect guesses
        this.hangmanIncorrectGuesses.textContent = this.hangmanService.getIncorrectGuesses()

        // Update hangman drawing
        this.updateHangmanDrawing()

        // Update progress
        // this.updateProgress()

        // Check if game is over
        if (result.isGameOver) {
            this.handleGameOver(result.isWinner)
        }
    }

    /**
     * Update the hangman drawing based on incorrect guesses
     */
    updateHangmanDrawing() {
        const incorrectGuesses = this.hangmanService.getIncorrectGuesses()

        // Show parts based on incorrect guesses (parts 1-3 are always visible)
        const parts = this.hangmanDrawing.querySelectorAll(".hangman-part")
        parts.forEach((part) => {
            const partNum = Number.parseInt(part.dataset.part)
            if (partNum <= incorrectGuesses + 3) {
                part.style.visibility = "visible"
            } else {
                part.style.visibility = "hidden"
            }
        })
    }

    /**
     * Handle game over state
     * @param {Boolean} isWinner - Whether the player won
     */
    handleGameOver(isWinner) {
        // Update session with game results
        this.hangmanService.updateSessionResult()

        // Show appropriate feedback
        if (isWinner) {
            setTimeout(() => {
                this.showFeedback("Congratulations! You guessed the word!", "correct")
                this.appInstance.showResults();
            }, 1000)

        } else {
            setTimeout(() => {
                this.showFeedback(`Game over! The word was: ${this.hangmanService.word}`, "incorrect")
                this.appInstance.showResults();
            }, 1000)

            // Reveal the word
            // this.hangmanWord.textContent = this.hangmanService.word.split("").join(" ")
        }

        // Show results button
        // const resultsButton = document.createElement("button")
        // resultsButton.className = "submit-btn"
        // resultsButton.textContent = "Show Results"
        // resultsButton.addEventListener("click", () => {
        //     this.appInstance.showResults()
        // })

        // this.hangmanContainer.appendChild(resultsButton)
    }

    /**
     * Show feedback message
     * @param {String} message - Feedback message
     * @param {String} type - Feedback type ('correct', 'incorrect', or 'info')
     */
    showFeedback(message, type) {
        this.hangmanFeedback.textContent = message
        this.hangmanFeedback.className = `feedback ${type}`
        this.hangmanFeedback.style.display = "block"
    }

    /**
     * Update the progress bar and text
     */
    updateProgress() {
        const percentage = this.hangmanService.getProgress()

        // Update progress bar width
        this.progressBar.style.width = `${percentage}%`

        // Update progress text
        const incorrectGuesses = this.hangmanService.getIncorrectGuesses()
        const maxGuesses = this.hangmanService.getMaxIncorrectGuesses()
        this.progressText.textContent = `Guesses: ${incorrectGuesses}/${maxGuesses}`
    }

    /**
     * Render the game
     */
    renderGame() {
        // Reset containers visibility
        this.questionContainer.classList.remove("hidden")
        this.resultsContainer.classList.add("hidden")
        this.sessionSummaryContainer.classList.add("hidden")

        // Update word display
        this.hangmanWord.textContent = this.hangmanService.getDisplayWord()

        // Update hint
        this.hangmanHint.textContent = `Hint: ${this.hangmanService.getHint()}`

        // Update incorrect guesses
        this.hangmanIncorrectGuesses.textContent = this.hangmanService.getIncorrectGuesses()
        this.hangmanMaxGuesses.textContent = this.hangmanService.getMaxIncorrectGuesses()

        // Update hangman drawing
        this.updateHangmanDrawing()

        // Update progress
        // this.updateProgress()

        // Apply fade-in animation
        this.questionContainer.classList.remove("fade-in")
        void this.questionContainer.offsetWidth // Trigger reflow
        this.questionContainer.classList.add("fade-in")
    }
}

/**
 * Extended QuizApp class - handles the UI interactions and DOM updates
 * Now supports both quiz and hangman game types
 */
class QuizApp {
    constructor(sessionService) {
        this.sessionService = sessionService
        this.quizService = null
        this.hangmanService = null
        this.hangmanUI = null
        this.storageService = new LocalStorageService()
        this.initElements()
        this.initEventListeners()
        this.initCurrentGame()
    }

    /**
     * Initialize DOM element references
     */
    initElements() {
        // Header elements
        this.currentGameElement = document.getElementById("current-game")
        this.totalGamesElement = document.getElementById("total-games")

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
        this.nextBtn = document.getElementById("next-btn")
        this.nextGameBtn = document.getElementById("next-game-btn")
        this.replayBtn = document.getElementById("replay-btn")
        this.sessionSummaryBtn = document.getElementById("session-summary-btn")
        this.restartSessionBtn = document.getElementById("restart-session-btn")
        this.articleLinkBtn = document.getElementById("article-link-btn")
        this.summaryArticleLinkBtn = document.getElementById("summary-article-link-btn")

        // Progress elements
        this.progressBar = document.getElementById("progress-bar")
        this.progressText = document.getElementById("progress-text")

        // Feedback and results
        this.feedbackElement = document.getElementById("feedback")
        this.resultsContainer = document.getElementById("results-container")
        this.scoreElement = document.getElementById("score")
        this.totalQuestionsElement = document.getElementById("total-questions")
        this.scorePercentageElement = document.getElementById("score-percentage")
        // this.resultMessageElement = document.getElementById("result-message")

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

        // Update header to show game type
        const gameTypeDisplay = document.querySelector(".game-type-display")
        if (gameTypeDisplay) {
            const gameType = this.sessionService.getCurrentGameType()
            gameTypeDisplay.textContent = gameType.charAt(0).toUpperCase() + gameType.slice(1)
        }
    }

    /**
     * Initialize event listeners
     */
    initEventListeners() {
        // Option selection for quiz games
        this.optionElements.forEach((option) => {
            option.addEventListener("click", () => {
                this.selectOption(option)
            })
        })

        // Button clicks
        if (this.submitBtn) {
            this.submitBtn.addEventListener("click", () => this.submitAnswer())
        }
        if (this.nextBtn) {
            this.nextBtn.addEventListener("click", () => this.loadNextQuestion())
        }
        if (this.nextGameBtn) {
            this.nextGameBtn.addEventListener("click", () => this.loadNextGame())
        }
        if (this.replayBtn) {
            this.replayBtn.addEventListener("click", () => this.replayCurrentGame())
        }
        if (this.sessionSummaryBtn) {
            this.sessionSummaryBtn.addEventListener("click", () => this.showSessionSummary())
        }
        if (this.restartSessionBtn) {
            this.restartSessionBtn.addEventListener("click", () => this.restartSession())
        }

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
     * Initialize the current game
     */
    initCurrentGame() {
        const gameIndex = this.sessionService.getCurrentGameIndex()
        const gameType = this.sessionService.getCurrentGameType()

        // Create appropriate service based on game type
        if (gameType === "hangman") {
            this.hangmanService = new HangmanService(this.sessionService, gameIndex)
            this.hangmanUI = new HangmanUI(this.hangmanService, this)
            this.quizService = null // Clear quiz service
        } else {
            // Default to quiz
            this.quizService = new QuizService(this.sessionService, gameIndex)
            this.hangmanService = null
            this.hangmanUI = null
        }

        const currentGame = this.sessionService.getCurrentGameData()

        // Save last played timestamp
        if (currentGame && currentGame.id) {
            this.storageService.saveLastPlayed(currentGame.id)
        }

        // Update URL with game data
        const ApiData = this.sessionService.quizData
        Utils.updateURLWithGameData(gameIndex, ApiData)

        // // Update header info
        // this.totalGamesElement.textContent = this.sessionService.getTotalGames()
        // this.currentGameElement.textContent = gameIndex + 1

        // Update game type in header
        const gameTypeDisplay = document.querySelector(".game-type-display")
        if (gameTypeDisplay) {
            gameTypeDisplay.textContent = gameType.charAt(0).toUpperCase() + gameType.slice(1)
        }

        // Check if we should show the article link
        this.updateArticleLinks()

        // Handle single-set session
        if (this.sessionService.getTotalGames() === 1) {
            this.sessionSummaryBtn.style.display = "none"
        } else {
            this.sessionSummaryBtn.style.display = "block"
        }

        // Start the game
        this.startGame()
    }

    /**
     * Start the game based on its type
     */
    startGame() {
        // Reset containers visibility
        this.questionContainer.classList.remove("hidden")
        this.resultsContainer.classList.add("hidden")
        this.sessionSummaryContainer.classList.add("hidden")

        const gameType = this.sessionService.getCurrentGameType()

        if (gameType === "hangman") {
            // Hangman game is handled by HangmanUI
            // The UI is already initialized in initCurrentGame
        } else {
            // Quiz game
            // Update total questions
            this.totalQuestionsElement.textContent = this.quizService.getTotalQuestions()

            // Load first question
            this.loadQuestion()
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
     * Load the current question and options (for quiz games)
     */
    loadQuestion() {
        if (!this.quizService) return

        const currentQuestion = this.quizService.getCurrentQuestion()

        // Reset previous selections and feedback
        this.resetOptions()
        this.hideFeedback()

        // Update question text and options
        this.questionElement.textContent = currentQuestion.question
        this.optionAText.textContent = currentQuestion.a
        this.optionBText.textContent = currentQuestion.b
        this.optionCText.textContent = currentQuestion.c
        this.optionDText.textContent = currentQuestion.d

        // Update progress
        // this.updateProgress()

        // Apply fade-in animation
        this.questionContainer.classList.remove("fade-in")
        void this.questionContainer.offsetWidth // Trigger reflow
        this.questionContainer.classList.add("fade-in")

        // Show submit button, hide next button
        this.submitBtn.style.display = "block"
        this.nextBtn.style.display = "none"
    }

    /**
     * Handle option selection (for quiz games)
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
     * Reset option styles and selections (for quiz games)
     */
    resetOptions() {
        this.optionElements.forEach((option) => {
            option.classList.remove("selected", "correct", "incorrect")
        })

        this.optionInputs.forEach((input) => {
            input.checked = false
        })
    }

    /**
     * Submit the current answer (for quiz games)
     */
    submitAnswer() {
        if (!this.quizService) return

        // Find selected option
        const selectedInput = Array.from(this.optionInputs).find((input) => input.checked)

        if (!selectedInput) {
            // Show error if no option selected
            this.showFeedback("Please select an answer", "incorrect")
            return
        }

        // Get selected option value (a, b, c, d)
        const selectedOption = selectedInput.id.replace("option-", "")
        const isCorrect = this.quizService.checkAnswer(selectedOption)

        // Show visual feedback
        this.showAnswerFeedback(selectedOption, isCorrect)

        // Hide submit button, show next button
        this.submitBtn.style.display = "none"

        if (this.quizService.hasNextQuestion()) {
            this.nextBtn.style.display = "block"
            this.nextBtn.textContent = "Next Question"
        } else {
            this.nextBtn.style.display = "block"
            this.nextBtn.textContent = "Show Results"
        }
    }

    /**
     * Show visual feedback for the answer (for quiz games)
     */
    showAnswerFeedback(selectedOption, isCorrect) {
        if (!this.quizService) return

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

        // Show feedback message
        if (isCorrect) {
            this.showFeedback("Correct! Well done!", "correct")
        } else {
            this.showFeedback(`Incorrect. The correct answer is: ${currentQuestion[correctOption]}`, "incorrect")
        }
    }

    /**
     * Load the next question (for quiz games)
     */
    loadNextQuestion() {
        if (!this.quizService) return

        if (this.nextBtn.textContent === "Show Results") {
            this.showResults()
            return
        }

        if (this.quizService.nextQuestion()) {
            this.loadQuestion()
        } else {
            this.showResults()
        }
    }

    /**
     * Show the game results
     */
    showResults() {
        // Update session with game results
        if (this.quizService) {
            this.quizService.updateSessionResult()
        } else if (this.hangmanService) {
            this.hangmanService.updateSessionResult()
        }

        // Get current game data
        const currentGame = this.sessionService.getCurrentGameData()
        const gameType = this.sessionService.getCurrentGameType()

        // Hide question container, show results
        this.questionContainer.classList.add("hidden")
        this.resultsContainer.classList.remove("hidden")
        this.sessionSummaryContainer.classList.add("hidden")

        // Apply animation
        this.resultsContainer.classList.remove("slide-in")
        void this.resultsContainer.offsetWidth
        this.resultsContainer.classList.add("slide-in")

        // Update score information
        let score, totalQuestions, percentage

        if (gameType === "hangman") {
            score = this.hangmanService.checkWinner() ? "Passed" : "Failed"
            // totalQuestions = this.hangmanService.word.length // Use word length as "total questions"
            // percentage = this.hangmanService.checkWinner()?"Passed": "Failed"
        } else {
            score = this.quizService.score
            totalQuestions = this.quizService.getTotalQuestions()
            percentage = this.quizService.getScorePercentage()
        }

        this.scoreElement.textContent = score
        // this.totalQuestionsElement.textContent = totalQuestions
        // this.scorePercentageElement.textContent = percentage

        // Update game info in results
        // if (currentGame) {
        //     // Set game ID and article GUID
        //     this.resultGameId.textContent = currentGame.id ? currentGame.id.substring(0, 8) + "..." : "N/A"
        //     this.resultArticleGuid.textContent = currentGame.article_guid || "N/A"

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
        //     }
        // }

        // Show appropriate message based on score
        // let message = "";
        // let passed = false;
        // if (gameType === "hangman") {
        //     passed = this.hangmanService.passed;
        // } else {
        //     passed = this.quizService.getPassed();
        // }

        // if (passed) {
        //     message = "Hurray! You Passed!";
        // } else {
        //     message = "Try Again!";
        // }

        // // Set the result message
        // this.resultMessageElement.textContent = message;

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

            // Initialize the new game
            this.initCurrentGame()
        }
    }

    /**
     * Replay the current game
     */
    replayCurrentGame() {
        const gameIndex = this.sessionService.getCurrentGameIndex()
        const gameType = this.sessionService.getCurrentGameType()

        // Reset game result in session
        this.sessionService.resetGameResult(gameIndex)

        // Create new service for this game based on type
        if (gameType === "hangman") {
            this.hangmanService = new HangmanService(this.sessionService, gameIndex)
            this.hangmanUI = new HangmanUI(this.hangmanService, this)
            this.quizService = null
        } else {
            this.quizService = new QuizService(this.sessionService, gameIndex)
            this.hangmanService = null
            this.hangmanUI = null
        }

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
        const totalPassedGames = this.sessionService.getTotalPassedGames();
        const totalFailedGames = this.sessionService.getTotalFailedGames();

        this.totalSessionScoreElement.textContent = `Passed: ${totalPassedGames} | Failed: ${totalFailedGames}`;
        this.totalSessionQuestionsElement.textContent = "";
        this.sessionScorePercentageElement.textContent = "";

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
            const gameType = this.sessionService.getGameType(i)

            let totalQuestions = gameResult.totalQuestions
            if (gameType === "hangman" && gameData.data.word) {
                totalQuestions = gameData.data.word.length
            }

            const percentage = Math.round((gameResult.score / totalQuestions) * 100) || 0

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
                    <h3>Game ${i + 1}</h3>
                    <div class="game-id-display">
                      <!--  <span>ID: ${gameData.id ? gameData.id.substring(0, 8) + "..." : "N/A"}</span>
                        <span>Article: ${gameData.article_guid || "N/A"}</span> -->
                     <span>${articleData[gameData?.article_guid]?.title || ""}</span>

                    </div>
                     <div class="game-status badge">${gameResult.completed ? gameResult.passed ? "Passed" : "Failed" : "Incomplete"}</div>
                    ${updatedText ? `<div class="game-timestamp">${updatedText}</div>` : ""}
                    ${lastPlayedText ? `<div class="game-timestamp">${lastPlayedText}</div>` : ""}
                    `

            // Add click handler to jump to this game
            gameCard.addEventListener("click", (e) => {
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
    }

    /**
     * Update the progress bar and text
     */
    updateProgress() {
        const gameType = this.sessionService.getCurrentGameType()
        let percentage, progressText

        if (gameType === "hangman" && this.hangmanService) {
            percentage = this.hangmanService.getProgress()
            const incorrectGuesses = this.hangmanService.getIncorrectGuesses()
            const maxGuesses = this.hangmanService.getMaxIncorrectGuesses()
            progressText = `Guesses: ${incorrectGuesses}/${maxGuesses}`
        } else if (this.quizService) {
            const currentQuestion = this.quizService.currentQuestionIndex + 1
            const totalQuestions = this.quizService.getTotalQuestions()
            percentage = this.quizService.getProgress()
            progressText = `Question ${currentQuestion} of ${totalQuestions}`
        } else {
            return
        }

        // Update progress bar width
        this.progressBar.style.width = `${percentage}%`

        // Update progress text
        this.progressText.textContent = progressText
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
function initApp() {
    // Sample data with both quiz and hangman games
    const gameData = window.gameData
    const articleData  = window.articleData;

    // Initialize services and app
    const sessionService = new SessionService(gameData);
    window.sessionService = sessionService; // Make it globally accessible for beforeunload
    const quizApp = new QuizApp(sessionService);
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", initApp);