// const fs = require('fs');
const getHeadlineScrambleGame = (data) => {
    // console.log(data)
    try {
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Headline Scramble fix Game</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Sortable/1.14.0/Sortable.min.js"></script>
    <style>
        /* General Styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            background-color: #f9f9f9;
        }

        h1,
        h2 {
            color: #333;
        }

        button {
            padding: 12px 34px;
            background-color: #000;
            color: white;
            border: none;
            border-radius: 7px;
            cursor: pointer;
            transition: background-color 0.3s;
            font-size: 16px;
        }

        button:hover {
            background-color: #FF4500;
        }

        .container {
            width: 90%;
            margin: 0 auto;
            padding: 20px;
        }

        .featured-banner {
            background: url(/images/headline_scramble_banner.png) no-repeat;
            background-size: contain;
            background-position: center;
            height: 218px;
            color: white;
            text-align: left;
            margin: 2% 0;
        }

        .row {
            display: grid;
            grid-template-columns: 1fr 2fr 1fr;
            gap: 20px;
            margin-top: 30px;
            justify-items: space-between;
        }

        .column {
            background-color: #fff;
            padding: 20px;
            border-radius: 25px;
            box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
            border: 1px solid #ddd;
            min-height: fit-content;
        }

        .left h2 {
            margin-bottom: 5px;
            font-size: 13px;
            font-weight: bold;
        }

        .difficulty {
            display: flex;
            gap: 20px;
            align-items: center;
        }

        .difficulty label {
            display: flex;
            align-items: center;
            border: 1px solid #ddd;
            padding: 4px 9px;
            border-radius: 10px;
        }

        .difficulty input {
            margin-left: 10px;
        }

        .timer {
            margin: 18px 0;
            font-size: 13px;
        }

        /* Right Column: More Games */
        .right h2 {
            margin-bottom: 2px;
            text-align: center;
            font-size: 19px;
        }

        .games-list {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
        }

        .game-card {
            text-align: center;
            transition: transform 0.3s;
            padding: 10px;
            border-radius: 8px;
            background-color: #fff;
        }

        .game-card img {
            width: 60%;
            height: auto;
            border-radius: 28px;
            box-shadow: 0px 3px 6px rgba(0, 0, 0, 0.1);
        }

        .game-card:hover {
            transform: scale(1.05);
        }

        .game-card h3 {
            font-size: 14px;
            font-weight: 400;
            color: #333;
            margin-top: 0px;
            margin: 0 7%;
            width: 100%;
        }



        /* Style for the switch */
        .switch {
            position: relative;
            display: inline-block;
            width: 47px;
            height: 20px;
            /* float: right; */
            margin: 3px;
            right: 0px;
        }

        .switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }

        span.word-btn {
            padding: 7px 15px;
            border: 1px solid #d2d1d1;
            border-radius: 5px;
            float: left;
            margin: 0 7px 12px 0px;
            font-size: 15px;
        }

        .word-btn.dragging {
            opacity: 0.5;
            transform: scale(1.05);
            /* Slight zoom effect during drag */
        }

        button.check-btn {
            padding: 12px 12px;
            background-color: #008000;
            color: white;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            transition: background-color 0.3s;
            font-size: 16px;
            margin-bottom: 14px;
        }

        .slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #ccc;
            transition: .4s;
            border-radius: 34px;
        }

        .slider:before {
            position: absolute;
            content: "";
            height: 18px;
            width: 18px;
            border-radius: 50%;
            left: 1px;
            bottom: 1px;
            background-color: white;
            transition: .4s;
        }

        input:checked+.slider {
            background-color: #32CD32;
        }

        input:checked+.slider:before {
            transform: translateX(26px);
        }

        .switch-label {
            font-size: 14px;
            margin-left: 0;
            vertical-align: middle;
        }

        .game-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    pointer-events: none;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 0 10px;
    transition: opacity 0.4s ease;
}

.game-modal.show {
    opacity: 1;
    pointer-events: auto;
    transition: opacity 0.4s 0.4s ease;
}

.game-modal .content {
    padding: 30px;
    max-width: 420px;
    width: 100%;
    border-radius: 10px;
    background: #fff;
    text-align: center;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.game-modal img {
    max-width: 130px;
    margin-bottom: 20px;
}

.game-modal img[src="/images/victory.gif"] {
    margin-left: -10px;
}

.game-modal h4 {
    font-size: 1.53rem;
}

.game-modal p {
    font-size: 1.15rem;
    margin: 15px 0 30px;
    font-weight: 500;
}

.game-modal p b {
    color: #5E63BA;
    font-weight: 600;
}

.game-modal button {
    padding: 12px 23px;
}



        /* Responsive Design */
        @media (max-width: 1280px) {
            .row {
                grid-template-columns: 1fr 2fr;
                justify-items: center
            }

            .how-to-play {
                transform: translate(0%, 70%);

            }
        }

        @media (max-width: 768px) {
            .container {
                width: 100%;
                padding: 10px;
            }

            .row {
                grid-template-columns: 1fr;
                justify-items: center
            }

            .column {
                width: 100% !important;
            }

            .right {
                margin-top: 70px;
            }

            .featured-banner {
                height: 105px;
            }

            .games-list {
                grid-template-columns: repeat(2, 1fr);
            }

            .game-card h3 {
                font-size: 18px;
                margin: 0 0%;
            }
            .game-modal img {
        max-width: 120px;
    }

    .game-modal h4 {
        font-size: 1.45rem;
    }

    .game-modal p {
        font-size: 1.1rem;
    }

    .game-modal button {
        padding: 10px 18px;
    }
        }

        @media (max-width: 480px) {
            .banner-content h1 {
                font-size: 28px;
            }

            .banner-content p {
                font-size: 16px;
            }

            .difficulty label,
            .game-card {
                font-size: 14px;
            }

            .games-list {
                grid-template-columns: 1fr;
            }

            .game-card h3 {
                font-size: 14px;
            }
        }


        /* new headline css */

        .game-container {
            max-width: 600px;
            margin: auto;
            padding: 20px;
            border-radius: 10px;
            background: white;
        }

        .sortable-list {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            padding: 10px;
            background: white;
            border-radius: 5px;
            min-height: 50px;
            justify-content: center;
        }

        .sortable-item {
            padding: 10px 15px;
            background: #007bff;
            color: white;
            border-radius: 5px;
            cursor: grab;
            user-select: none;
            transition: background 0.3s ease;
        }

        .sortable-item:hover {
            background: #0056b3;
        }

        .sortable-item:active {
            cursor: grabbing;
        }

        .correct {
            background: #28a745 !important;
        }

        .incorrect {
            background: #dc3545 !important;
        }
    </style>
</head>

<body>
    <main>
        <div class="container">
            <nav>
                <p> <a href="/" style="text-decoration:none;color:#000;">Home </a> / Headline Scramble Fix </p>
            </nav>
            <header class="featured-banner">
                <!-- <div class="banner-content">
                  <h1>Quiz Game</h1>
                  <p>Trivia and Fun</p>
                  <p>Answer trivia questions across various topics and challenge yourself to score as high as possible. Perfect for trivia lovers!</p>
                  </div> -->
            </header>
            <div class="row">
                <div id="col-left" class="column left">
                    <h2>Your Game Preferences</h2>
                    <div class="difficulty">
                        <label>Easy <input type="radio" name="difficulty" value="easy" checked> </label>
                        <label>Medium<input type="radio" name="difficulty" value="medium"> </label>
                        <label>Hard<input type="radio" name="difficulty" value="hard"> </label>
                    </div>
                    <div class="timer">
                        <span class="switch-label">Turn on this for a time-based quiz</span>
                        <label class="switch">
                            <input type="checkbox">
                            <span class="slider"></span>
                        </label>
                    </div>
                    <button class="save-btn">Save</button>
                </div>
                <!-- Center Column: headline Question -->
                 <div id="headline-scramble" class="headline-scramble column center">
                    <div class="quiz-question">
                        <div class="game-container text-center">
                            <h4 class="mb-3">Headline Scramble</h4>
                            <div id="sortableContainer" class="sortable-list border p-2"></div>
                            <div class="mt-3">
                                <button class="btn btn-success" onclick="checkOrder()">Check Now</button>
                            </div>
                        </div>

<div class="game-modal">
                            <div class="content">
                                <img src="#" alt="gif">
                                <h4>Game Over!</h4>
                                <p class="score">Your score was: <b>rainbow</b></p>
                                <p class="correct-line">The correct word was: <b>rainbow</b></p>
                                <button class="play-again" onclick="retryGame()">Play Again</button>
                            </div>
                        </div>
                    </div>
                </div>
               
                <!-- Right Column: More Games -->
                <div class="column right">
                    <h2>More Games</h2>
                    <div class="games-list">
                        <div class="game-card">
                            <img src="/images/quiz_mobile.png" alt="Quiz">
                            <h3><a href="/play/quiz">Quiz</a></h3>
                        </div>
                        <div class="game-card">
                            <img src="/images/hangman_mobile.png" alt="Hangman">
                            <h3><a href="/play/hangman">Hangman</a></h3>
                        </div>
                       
                    </div>
                </div>
            </div>
        </div>
    </main>
    <script>
            const gameModal = document.querySelector('.game-modal')

         let correctOrder = ${JSON.stringify(data?.randomized)};
        let shuffledOrder = [];
        let sortableInstance; // Declare a global variable for the sortable instance

        function shuffleArray(array) {
            let shuffled;
            do {
                shuffled = [...array].sort(() => Math.random() - 0.5);
            } while (shuffled.join() === array.join());
            return shuffled;
        }
    
        function initializeGame() {
            // Clear previous items
            const container = document.getElementById("sortableContainer");
            container.innerHTML = "";
    
            // Shuffle the order of the words
            shuffledOrder = shuffleArray(correctOrder);
    
            // Add shuffled words back to the container
            shuffledOrder.forEach(text => {
                let div = document.createElement("div");
                div.className = "sortable-item";
                div.innerText = text;
                container.appendChild(div);
            });
    
            // If the sortable instance already exists, destroy it to avoid duplicates
            if (sortableInstance) {
                sortableInstance.destroy(); // Destroy the previous instance
            }
    
            // Create a new sortable instance
            sortableInstance = new Sortable(container, {
                animation: 200,
                ghostClass: 'bg-light',
                onStart: function (evt) {
                    evt.item.style.transform = "scale(1.1)";
                },
                onEnd: function (evt) {
                    evt.item.style.transform = "scale(1)";
                }
            });
        }
    
        function checkOrder() {
            let words = document.querySelectorAll(".sortable-item");
            let userOrder = Array.from(words).map(word => word.innerText);
            let correctCount = 0;
    
            words.forEach((word, index) => {
                if (userOrder[index] === correctOrder[index]) {
                    word.classList.add("correct");
                    word.classList.remove("incorrect");
                    correctCount++;
                } else {
                    word.classList.add("incorrect");
                    word.classList.remove("correct");
                }
            });
    
            let totalWords = correctOrder.length;
            let score = Math.round((correctCount / totalWords) * 100);

            gameOver(score)
    
            // Corrected emoji handling:
            // let emoji = score === 100 ? "🎉" : score >= 50 ? "🤔" : "❌";
            // let message = \`\${emoji} Your Score: <strong>\${score}%</strong><br>Correct Order:<br>\${correctOrder.join(" ")}\`; // Fixed string template
            
            // document.getElementById("resultMessage").innerHTML = message;
    
            // let modal = new bootstrap.Modal(document.getElementById('resultModal'));
            // modal.show();
        }

        const gameOver = (score) => {
            // After game completion, showing modal with relevant details
            let modalText = ''
            if(score >= 90) modalText = \`Great Job !! You scored \${score}\`
            else if(score >= 70) modalText = \`Well Played !! You scored \${score}\`
            else if(score >= 50) modalText = \`Keep it Up !! You scored \${score}\`
            else if(score >= 30) modalText = \`Let's Try Again !! You scored \${score}\`
            else modalText = \`Ohh NOO !! You scored \${score}\`

            gameModal.querySelector("img").src = \`/images/\${score > 40 ? 'victory' : 'lost'}.gif\`;
            gameModal.querySelector("h4").innerText = score > 40 ? 'Congrats!' : 'Game Over!';
            gameModal.querySelector(".score").innerHTML = \`\${modalText}\`;
            gameModal.querySelector(".correct-line").innerHTML = \`Correct line was: <b> \${correctOrder.join(' ')} </b>\`;
            gameModal.classList.add("show");    
        };
    
        function retryGame() {
            // Re-initialize the game (clear and restart)
            gameModal.classList.remove('show')
            
            initializeGame();
        }
    
        document.addEventListener("DOMContentLoaded", initializeGame);
    </script>
</body>

</html>`;
        // fs.writeFileSync('headline2.html',html)

        return html;
    } catch (error) {
        console.error(`[ERROR] ${error}`);
        return `<h1>${error.message}</h1>`;
    }

};

module.exports = {
    getHeadlineScrambleGame
}
