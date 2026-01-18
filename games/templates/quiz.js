const fs = require('fs');
const getQuizGame = (data,articleGuidMap) => {
    try {
        const html = `
        <!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interactive Quiz</title>
    <!-- <link rel="stylesheet" href="quiz.css"> -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/css-files/quiz.css">
   
</head>

<body>
    <div class="quiz-container">
       

        <div class="quiz-header">
            <div class="quiz-branding">
                <img src="/images/sortd.webp" alt="Sortd Logo" class="sortd-logo">
                <!-- <div class="quiz-tagline">Test your knowledge with fun quizzes!</div> -->
            </div>
            <h1>Test your knowledge with fun quizzes!</h1>
            <div class="session-info">
                <span>Quiz Set: <span id="current-game">1</span>/<span id="total-games">2</span></span>
            </div>
            <div class="progress-container">
                <div class="progress-bar" id="progress-bar"></div>
            </div>
            <div class="progress-text" id="progress-text">Question 1/5</div>
        </div>

        <div id="question-container">
            <div class="question" id="question">Question text will appear here</div>
            <div class="options-container">
                <div class="option" data-option="a">
                    <input type="radio" name="option" id="option-a" class="option-input">
                    <label for="option-a" class="option-label" id="option-a-text">Option A</label>
                </div>
                <div class="option" data-option="b">
                    <input type="radio" name="option" id="option-b" class="option-input">
                    <label for="option-b" class="option-label" id="option-b-text">Option B</label>
                </div>
                <div class="option" data-option="c">
                    <input type="radio" name="option" id="option-c" class="option-input">
                    <label for="option-c" class="option-label" id="option-c-text">Option C</label>
                </div>
                <div class="option" data-option="d">
                    <input type="radio" name="option" id="option-d" class="option-input">
                    <label for="option-d" class="option-label" id="option-d-text">Option D</label>
                </div>
            </div>
            <button class="submit-btn" id="submit-btn">Submit</button>
            <div class="feedback" id="feedback"></div>
            <!-- <button class="next-btn" id="next-btn">Next Question</button> -->
        </div>

        <div id="results-container" class="results-card hidden">
            <div class="score-box">
                <h2 class="score-heading">Your Score</h2>
                <div class="score-number">
                    <span id="score">0</span> / <span id="total-questions">5</span>
                </div>
                <div class="score-percentage">(<span id="score-percentage">0</span>%)</div>
                <p class="score-message" id="result-message">Keep studying and try again soon.</p>
            </div>

            <div class="button-group">
                <button class="button button--secondary" id="replay-btn">⏪ Replay Quiz</button>
                <button class="button button--primary" id="next-game-btn">Next Quiz ⏩</button>
                <button class="button button--secondary" id="session-summary-btn">More Quizzes ℹ️</button>
                <a href="#" class="button button--link" id="article-link-btn">📖 Read Article</a>

            </div>
        </div>


        <div id="session-summary-container" class="hidden">
            <h2>Game Details</h2>
            <div class="session-stats">
                <h2>Total Score</h2>
                <div class="total-session-score">
                    <span id="total-session-score">1</span>/<span id="total-session-questions">4</span>
                    (<span id="session-score-percentage">25</span>%)
                </div>
            </div>

            <div class="game-scores-container" id="game-scores-container">
                <!-- Game scores will be inserted here -->
            </div>
            <div class="button-group">
                <button class="button button--primary" id="restart-session-btn">Restart🔄 </button>
            </div>
        </div>

        <div class="quiz-info-section">
            <div class="accordion-container">
                <div class="accordion-item">
                    <div class="accordion-header">
                        <span>How to Play</span>
                        <span class="accordion-icon">+</span>
                    </div>
                    <div class="accordion-content">
                        <p>Select the correct answer from the available options. Submit your answer and proceed to the
                            next question. Complete all questions to finish the game set.</p>
                        <p>Your score will be calculated at the end of each game set.</p>
                    </div>
                </div>
                <div class="accordion-item">
                    <div class="accordion-header">
                        <span>Rules</span>
                        <span class="accordion-icon">+</span>
                    </div>
                    <div class="accordion-content">
                        <ul>
                            <li>You must answer all questions to complete a game set</li>
                            <li>Once you submit an answer, you cannot change it</li>
                            <li>Points are awarded for correct answers only</li>
                            <li>Complete all game sets to view your total session score</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        window.gameData = ${JSON.stringify(data)}
        window.articleData = ${JSON.stringify(articleGuidMap)}
    </script>
    <script src ="/js-files/quiz.js"></script>

</body>

</html>`
        // fs.writeFileSync('quiz.html', html);
        return html;
    } catch (error) {
        console.error(`[ERROR] ${error}`);
        return `<h1>${error.message}</h1>`;
    }

};

module.exports = {
    getQuizGame
}
