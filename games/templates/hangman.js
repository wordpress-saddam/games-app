const fs = require('fs');
const getHangmanGame = async (data,articleData) => {
    try {
        const html = `
        <!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sortd-Hangman</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/css-files/hangman.css">
</head>

<body>
    <div class="quiz-container">

        <div class="quiz-header">
            <div class="quiz-branding">
                <img src="/images/sortd.webp" alt="Sortd Logo" class="sortd-logo">
                <!-- <div class="quiz-tagline">Test your knowledge with fun quizzes!</div> -->
            </div>
            <h1>Hangman - Test Your Vocabulary</h1>
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
            <button class="submit-btn" id="submit-btn">Submit Answer</button>
            <button class="next-btn" id="next-btn">Next Question</button>
        </div>

        <div id="results-container" class="results-card hidden">
            <div class="score-box">
             
              <div class="score">You <span id="score">0</span></div>
              <div class="feedback" id="hangman-feedback"></div>
            </div>
          
            <div class="button-group">
              <button class="button button--secondary replay-btn" id="replay-btn">⏪ Replay</button>
              <button class="button button--primary next-game-btn" id="next-game-btn">Next ⏩</button>
              <button class="button button--secondary session-summary-btn" id="session-summary-btn">Game Details ℹ️</button>
              <a href="#" class="button button--link article-link-btn" id="article-link-btn">📖 Read Article</a>
            </div>
          </div>
          

          <div id="session-summary-container" class="hidden">
            <h2>Game Details</h2>
            <div class="session-stats">
                <div class="total-session-score">Total Score: <span id="total-session-score">0</span><span
                        id="total-session-questions">10</span></div>
                <div class="score-percentage"><span id="session-score-percentage">0</span></div>
            </div>
            <div class="game-scores-container" id="game-scores-container">
                <!-- Game scores will be inserted here -->
            </div>
            <div class="button-group">
                <button class="restart-session-btn" id="restart-session-btn">Restart 🔄</button>
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
                        <p>Guess letters to reveal the hidden word. You can make up to 6
                            incorrect guesses before the game ends.</p>
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
                            <li>You must complete each game to progress</li>
                            <li>Once you submit an answer or guess a letter, you cannot change it</li>
                            <li>Points are awarded for successful word completion inhangman</li>
                            <li>Complete all game sets to view your total session score</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
    window.gameData = ${JSON.stringify(data)}
    window.articleData  = ${JSON.stringify(articleData)}
    </script>
    <script src ="/js-files/hangman.js"></script>
</body>

</html>
`

        // fs.writeFileSync('hangman.html', html);
        return html
    }
    catch (error) {
        console.error("Error generating HTML:", error);
        return `<h1>Error generating the game page. Please try again later.</h1>`;
    }
}

module.exports = {
    getHangmanGame
}

