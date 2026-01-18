const fs = require('fs');
const getHeadlineScrambleGame = (data,articleGuidMap) => {
    // fs.writeFileSync('headline.json', JSON.stringify(data))
    try {
        const html = `
        <!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sortd-Headline Scramble</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/css-files/headline.css">
 
</head>

<body>
    <div class="headline-scramble-container">
        <div class="quiz-container">
            <div class="quiz-header">
                <div class="quiz-branding">
                    <img src="/images/sortd.webp" alt="Sortd Logo" class="sortd-logo">
                    <!-- <div class="quiz-tagline">Test your knowledge with fun quizzes!</div> -->
                </div>
                <h1>Headline Scramble - Master the Headlines </h1>
                <div class="session-info">
                    <span>Game Set: <span id="current-game">1</span>/<span id="total-games">2</span></span>
                </div>
                <div class="progress-container">
                    <div class="progress-bar" id="progress-bar"></div>
                </div>
                <div class="progress-text" id="progress-text">Headline 1/2</div>
            </div>

            <div id="scramble-container">
                <div class="question" id="scramble-instruction">
                    Drag the blocks to form the correct headline:
                </div>
                <div class="sortable-container" id="sortable-container">
                    <!-- Sortable items will be inserted here -->
                </div>
                <button class="submit-btn" id="submit-btn">Check Now</button>
                <button class="next-btn" id="next-btn">Next Headline</button>
            </div>

            <div id="results-container" class="results-card hidden">
                <div class="score-box">

                    <div class="score">You <span id="score">0</span></div>
                    <div class="feedback" id="hangman-feedback"></div>
                </div>

                <div class="button-group">
                    <button class="button button--secondary replay-btn" id="replay-btn">⏪ Replay</button>
                    <button class="button button--primary next-game-btn" id="next-game-btn">Next ⏩</button>
                    <button class="button button--secondary session-summary-btn" id="session-summary-btn">Game Details
                        ℹ️</button>
                    <a href="#" class="button button--link article-link-btn" id="article-link-btn">📖 Read Article</a>
                </div>
            </div>

            <div id="session-summary-container" class="hidden">
                <h2>Game Details</h2>
                <div class="session-stats">
                    <div class="total-session-score">Total Score: <span id="total-session-score"></span><span
                            id="total-session-headlines"></span></div>
                    <div class="score-percentage"><span id="session-score-percentage"></span></div>
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
                            <p>Drag and drop the headline segments to form the correct headline. Once you're satisfied
                                with the order, click "Check Now" to verify your answer.</p>
                            <p>Your score will be calculated based on how accurately you arrange the headline segments.
                            </p>
                        </div>
                    </div>
                    <div class="accordion-item">
                        <div class="accordion-header">
                            <span>Rules</span>
                            <span class="accordion-icon">+</span>
                        </div>
                        <div class="accordion-content">
                            <ul>
                                <li>You must arrange all segments in the correct order</li>
                                <li>Once you submit an answer, you cannot change it</li>
                                <li>Points are awarded for correct arrangements only</li>
                                <li>Complete all headlines to finish a game set</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        window.gameData = ${JSON.stringify(data)}
        window.articleData = ${JSON.stringify(articleGuidMap)}
    </script>
    <script src ="/js-files/headline.js"></script>

</body>

</html>`
        // fs.writeFileSync('headline.html',html)

        return html;
    } catch (error) {
        console.error(`[ERROR] ${error}`);
        return `<h1>${error.message}</h1>`;
    }

};

module.exports = {
    getHeadlineScrambleGame
}
