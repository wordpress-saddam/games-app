const axios = require('axios');
console.log("---------------[saddam]---------------");
const DEV_API_DOMAIN = process.env.DEV_API_DOMAIN || 'http://localhost:5002';
const getGameTypeHTML = async (req, res) => {
  try {
    const response = await axios.get(`${DEV_API_DOMAIN}/v1/games/get-games-config/token/8d668570-9cd8-11ef-8d2c-b123aaffcb77`);  // Example API
    console.log("Response:", response);

    if (response && response.data && response.data.status) {
      const data = response.data.data;

      // Start building the HTML content
      let htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Asharq Games</title>
          <style>
            body {
              font-family: 'Roboto', sans-serif;
              margin: 0;
              padding: 0;
              background-color: #1995AD;
              height: 100vh; /* Ensure the body takes full height */
              display: flex;
              justify-content: center;
              align-items: center; /* Center the container vertically */
            }
            .container {
              display: flex;
              flex-direction: column; /* Stack cards vertically */
              justify-content: center;
              align-items: center; /* Center the cards horizontally */
              gap: 20px;
              width: 100%;
              padding: 20px;
            }
            .card {
              background: #fff;
              border-radius: 10px;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
              width: 60%; /* Ensure the card takes up most of the screen width */
              padding: 20px;
              text-align: center;
              transition: transform 0.2s ease-in-out;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              height: auto; /* Let the card height adjust based on content */
            }
            .card:hover {
              transform: translateY(-5px);
            }
            .card h3 {
              margin: 0;
              font-size: 1.5em;
            }
            .card p {
              font-size: 1em;
              color: #666;
              margin: 10px 0;
              flex-grow: 1; /* Ensures the description area takes the available space */
            }
            .play-button {
              display: inline-block;
              background-color: #1995AD;
              color: white;
              font-size: 14px; /* Reduced font size */
              padding: 8px 16px; /* Smaller padding */
              width: 150px; /* Fixed width for the button */
              border-radius: 50px;
              text-decoration: none;
              margin-top: 15px;
              transition: background-color 0.3s;
              align-self: center;
            }
            .play-button:hover {
              background-color: #45a049;
            }
            .play-button:active {
              background-color: #388e3c;
            }

            /* Mobile responsiveness */
            @media (max-width: 768px) {
              .container {
                padding: 10px;
              }

              .card h3 {
                font-size: 1.2em; /* Slightly smaller title */
              }

              .card p {
                font-size: 0.9em; /* Smaller font size for description */
              }

              .play-button {
                font-size: 12px; /* Smaller button text */
                padding: 6px 12px; /* Smaller padding */
                width: 120px; /* Reduced width on mobile */
              }
            }

            /* Additional responsiveness for very small screens (phones in portrait) */
            @media (max-width: 480px) {
              .container {
                padding: 10px;
              }

              .play-button {
                font-size: 12px; /* Consistent smaller button text */
                padding: 6px 10px; /* Even smaller button padding */
                width: 100px; /* Further reduced width for very small screens */
              }
            }
          </style>
        </head>
        <body>
          <div class="container">`;

      // Loop through the data and create the HTML for each card
      data.forEach(post => {
        htmlContent += `
          <div class="card">
            <h3>${post.display_name}</h3>
            <p>${post.desc || ''}</p>
            <a href="/play/${post.game_type}" class="play-button">Play</a>
          </div>`;
      });

      // Close the container and HTML tags
      htmlContent += `
          </div>
        </body>
        </html>`;

      // Send the constructed HTML content as the response
      return res.send(htmlContent);
    }

    return res.send("<h1>Games not available</h1>");
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Something went wrong');
  }
};
const getGameData = async (req, res) => {
  try{
    const response = await axios.get(`${DEV_API_DOMAIN}/v1/games/get-games/token/8d668570-9cd8-11ef-8d2c-b123aaffcb77/gametype/${req.params.code}`);
    return response.data;
  }catch(err){
    console.log("Error in API:",err);
    return false;
  }
}

const getQuizGame = async (req, res) => {
  let questions = [];
  let correctAnswers = 0;
  let wrongAnswers = 0;
  let unattemptedAnswers = 0;
  let currentQuestionIndex = 0;

  try {
    const response = await axios.get(`${DEV_API_DOMAIN}/v1/games/get-games/token/8d668570-9cd8-11ef-8d2c-b123aaffcb77/gametype/${req.params.code}`);

    if (!response || !response.data || !response.data.status) {
      return "<h1>No questions available!</h1>";
    }

    questions = response.data.data.games?.[0]?.["data"]?.["questions"];
    console.log("Questions:", questions);
    if(!questions) return res.send("<h2 style='align:center'>No Questions found for game.</h2>")
    unattemptedAnswers = questions.length; // All questions are unattempted initially.

    let htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sortd Game</title>
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Roboto', sans-serif;
            background-color: #1995AD; /* Sky Blue background for the page */
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
          }
          .game-container {
            background-color: #F1F1F2; /* Purple-Blue for the game container */
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            padding: 30px;
            width: 600px;
            transition: all 0.3s ease;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          }
          h1 {
            text-align: center;
            font-size: 28px;
            margin-bottom: 20px;
            // color: white;
          }
          .question {
            font-size: 20px;
            font-weight: bold;
            margin-top: 20px;
            color: #333;
          }
          .options {
            margin-top: 20px;
            list-style: none;
            padding: 0;
          }
          .options li {
            background-color: #f1f1f1;
            padding: 12px;
            margin-bottom: 12px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          .options li:hover {
            background-color: #e0e0e0;
          }
          .options li.correct {
            background-color: #4CAF50;
            color: white;
          }
          .options li.incorrect {
            background-color: #f44336;
            color: white;
          }
          .btn-next, .btn-finish {
            display: block;
            width: 100%;
            padding: 12px;
            background-color: #4CAF50;
            color: white;
            font-size: 16px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            margin-top: 20px;
          }
          .btn-next:disabled, .btn-finish:disabled {
            background-color: #ccc;
            cursor: not-allowed;
          }
          .question-navigation {
            text-align: center;
            margin-top: 30px;
          }
          .question-navigation button {
            margin: 5px;
            padding: 10px 20px;
            background-color: #007BFF;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
          }
          .question-navigation button:disabled {
            background-color: #ddd;
            cursor: not-allowed;
          }
          .scorecard {
            display: none;
            text-align: center;
            margin-top: 30px;
          }
          .scorecard h2 {
            font-size: 32px;
            margin-bottom: 20px;
            color: #333;
          }
          .scorecard .score {
            font-size: 20px;
            margin: 10px 0;
            color: #555;
          }
          .scorecard .correct {
            color: #4CAF50;
            font-weight: bold;
          }
          .scorecard .wrong {
            color: #f44336;
            font-weight: bold;
          }
          .scorecard .unattempted {
            color: #ff9800;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="game-container" id="gameContainer">
          <h1>Quiz Game</h1>
          <div id="questions-container">
            ${questions.map((question, index) => `
              <div class="question-section" id="question-${index}" style="display: ${index === 0 ? 'block' : 'none'};">
                <div class="question">${question.question}</div>
                <ul class="options" id="options-${index}">
                  <li onclick="selectOption(${index}, '${question.a}', '${question[question.answer]}')">${question.a}</li>
                  <li onclick="selectOption(${index}, '${question.b}', '${question[question.answer]}')">${question.b}</li>
                  <li onclick="selectOption(${index}, '${question.c}', '${question[question.answer]}')">${question.c}</li>
                  <li onclick="selectOption(${index}, '${question.d}', '${question[question.answer]}')">${question.d}</li>
                </ul>
              </div>
            `).join('')}
          </div>

          <!-- Navigation buttons -->
          <div class="question-navigation">
            <button id="prevBtn" onclick="navigateQuestion('prev')" disabled>Previous</button>
            <button id="nextBtn" onclick="navigateQuestion('next')">Next</button>
            <button id="finishBtn" onclick="finishQuiz()" style="display: none;" class="btn-finish">Finish</button>
          </div>
        </div>

        <div class="scorecard" id="scorecard">
          <h2>Quiz Finished!</h2>
          <div class="score">
            <p>You got <span class="correct">${correctAnswers}</span> Correct!</p>
            <p>You got <span class="wrong">${wrongAnswers}</span> Wrong!</p>
            <p>You left <span class="unattempted">${unattemptedAnswers}</span> Unattempted!</p>
            <p><strong>Total Score: ${correctAnswers} / ${questions.length}</strong></p>
          </div>
        </div>

        <script>
          let correctAnswers = 0;
          let wrongAnswers = 0;
          let unattemptedAnswers = ${questions.length}; // Initial unattempted count
          let currentQuestionIndex = 0;
          let totalQuestions = ${questions.length}; // Total questions

          function selectOption(questionIndex, selectedOption, correctAnswer) {
            const options = document.getElementById('options-' + questionIndex).children;
            for (let i = 0; i < options.length; i++) {
              options[i].style.pointerEvents = 'none'; // Disable clicking
              if (options[i].innerText === correctAnswer) {
                options[i].classList.add('correct');
              } else if (options[i].innerText === selectedOption) {
                options[i].classList.add('incorrect');
              }
            }

            // Update score and unattempted count
            if (selectedOption === correctAnswer) {
              correctAnswers++;
            } else {
              wrongAnswers++;
            }

            unattemptedAnswers--; // Reduce unattempted answers when a choice is made

            // Enable the Next button after selecting an answer
            document.getElementById('nextBtn').disabled = false;
            if (currentQuestionIndex === totalQuestions - 1) {
              document.getElementById('finishBtn').style.display = 'block';
            }
          }

          function navigateQuestion(direction) {
            if (direction === 'next' && currentQuestionIndex < totalQuestions - 1) {
              currentQuestionIndex++;
            } else if (direction === 'prev' && currentQuestionIndex > 0) {
              currentQuestionIndex--;
            }

            // Hide all question sections and show the current one
            for (let i = 0; i < totalQuestions; i++) {
              document.getElementById('question-' + i).style.display = 'none';
            }
            document.getElementById('question-' + currentQuestionIndex).style.display = 'block';

            // Enable or disable navigation buttons
            document.getElementById('prevBtn').disabled = currentQuestionIndex === 0;
            document.getElementById('nextBtn').disabled = currentQuestionIndex === totalQuestions - 1;
          }

          function finishQuiz() {
            // Hide the game container and show the scorecard
            document.getElementById('gameContainer').style.display = 'none';
            document.getElementById('scorecard').style.display = 'block';
            document.getElementById('nextBtn').style.display = 'none';
            document.getElementById('prevBtn').style.display = 'none';
            document.getElementById('finishBtn').style.display = 'none';
          }
        </script>
      </body>
      </html>
    `;
    return res.send(htmlContent);
  } catch (error) {
    console.error('Error fetching questions:', error);
    return res.status(500).send("Error fetching questions.");
  }
};

const getHeadlineShuffleGame = async (req, res) => {
  try {
    const gameData = await getGameData(req, res);
    if (!gameData || !gameData.status || !gameData.data.games || !gameData.data.games?.[0]?.data?.headline) {
      return res.send("<h2 style='align:center'>No game data found</h2>");
    }
    const headline = gameData.data.games[0].data.headline;

    const safeHeadline = JSON.stringify(headline);
    const words = JSON.stringify(gameData.data.games[0].data.randomized);

    let htmlContent = `<!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Headline Scramble</title>
          <style>
            /* Body Background */
            body {
                font-family: 'Roboto', sans-serif;
                margin: 0;
                padding: 0;
                background-color: #1995AD;
                height: 100vh; /* Ensure the body takes full height */
                display: flex;
                justify-content: center;
                align-items: center; /* Center the container vertically */
            }

            /* Card Styling */
            .card {
              background-color: #ffffff; /* White background for the card */
              border-radius: 15px; /* Rounded corners for the card */
              box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1); /* Slightly stronger shadow for depth */
              padding: 30px;
              width: 80%;
              max-width: 650px; /* Max width for the card */
              text-align: center;
              overflow: hidden;
              transition: opacity 0.3s ease-in-out;
            }

            h1 {
              font-size: 30px;
              margin-bottom: 20px;
              color: #333;
            }

            /* Badge Styling (Uniform color and smaller font) */
            .badge {
              display: inline-block;
              color: white;
              padding: 8px 16px;
              margin: 5px;
              border-radius: 20px;
              cursor: grab;
              font-size: 14px; /* Smaller font size */
              background-color: #3498db; /* Single uniform color */
              transition: background-color 0.3s ease, transform 0.3s ease;
            }

            .badge.dragging {
              opacity: 0.5;
              transform: scale(1.05); /* Slight zoom effect during drag */
            }

            /* Button Styling */
            .controls {
              margin-top: 25px;
            }

            .controls button {
              padding: 12px 30px;
              font-size: 20px;
              background-color: #1995AD; /* Match body background color */
              color: white;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              transition: background-color 0.3s ease;
            }

            .controls button:hover {
              background-color: #168ea5; /* Slightly darker shade for hover effect */
            }

            /* Score Container Styling */
            .score-container {
              margin-top: 20px;
              font-size: 24px;
              font-weight: bold;
              color: #4CAF50;
            }

            /* Instructions Styling */
            #instructions {
              font-size: 18px;
              margin: 15px 0;
              color: #666;
            }

            /* Container for both headlines */
            .headlines-container {
              margin-top: 30px;
              display: flex;
              flex-direction: column; /* Stack them vertically */
              gap: 20px;
              visibility: hidden; /* Hide headlines initially */
            }

            /* Individual Headline Boxes */
            .headline-box {
              background-color: #f1f1f1;
              padding: 20px;
              border-radius: 10px;
              width: 100%; /* Full width */
              text-align: left;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }

            /* Correct Headline Box */
            .correct-headline-box {
              background-color: #d4f7d4; /* Light green for the correct headline */
            }

            /* User Headline Box */
            .user-headline-box {
              background-color: #fff3cd; /* Light yellow for the user's headline */
            }

            /* Styles for Struck-out Text */
            .struck-through {
              text-decoration: line-through;
              color: #f44336; /* Red for incorrect words */
            }
          </style>
        </head>
        <body>

          <div class="card">
            <h1>Headline Scramble</h1>

            <!-- Instructions only visible before submission -->
            <div id="instructions">
              <p>Drag and drop the words to reorder them. Click 'Submit' to see your score!</p>
            </div>

            <!-- Headline area where words will appear -->
            <div class="headline" id="headline">
              <!-- Words will appear here -->
            </div>

            <!-- Submit button -->
            <div class="controls">
              <button id="submitBtn">Submit</button>
            </div>

            <!-- Parent container for both headlines -->
            <div class="headlines-container" id="headlinesContainer">
              <!-- Correct Headline -->
              <div class="headline-box correct-headline-box" id="correctHeadline">
                <h3>Correct Headline</h3>
                <p></p>
              </div>

              <!-- User's Headline -->
              <div class="headline-box user-headline-box" id="userHeadline">
                <h3>Your Headline</h3>
                <p></p>
              </div>
            </div>

            <!-- Score label -->
            <div class="score-container" id="scoreLabel">
              <!-- The score will be shown here -->
            </div>
          </div>

          <script>
            // The original headline, safely escaped
            const headline = ${safeHeadline};
            const correctWords = headline.split(' ');
            const shuffledWords = ${words};

            // Shuffle function
            function shuffleWords(words) {
              for (let i = words.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [words[i], words[j]] = [words[j], words[i]];
              }
            }
            shuffleWords(shuffledWords);

            // DOM elements
            const headlineElement = document.getElementById('headline');
            const submitButton = document.getElementById('submitBtn');
            const scoreLabel = document.getElementById('scoreLabel');
            const correctHeadlineElement = document.getElementById('correctHeadline').querySelector('p');
            const userHeadlineElement = document.getElementById('userHeadline').querySelector('p');
            const headlinesContainer = document.getElementById('headlinesContainer');
            const instructionsContainer = document.getElementById('instructions');

            // Detect if device is touch-enabled
            const isTouchDevice = 'ontouchstart' in document.documentElement;

            // Create badge elements for each word
            shuffledWords.forEach((word, index) => {
              const badge = document.createElement('div');
              badge.classList.add('badge');
              badge.textContent = word;
              headlineElement.appendChild(badge);

              // Handling dragstart for mouse devices
              if (!isTouchDevice) {
                badge.setAttribute('draggable', true);

                badge.addEventListener('dragstart', (e) => {
                  e.dataTransfer.setData('text/plain', word);
                  badge.classList.add('dragging');
                });

                badge.addEventListener('dragend', () => {
                  badge.classList.remove('dragging');
                });

                headlineElement.addEventListener('dragover', (e) => {
                  e.preventDefault();
                  const draggingBadge = document.querySelector('.badge.dragging');
                  const closestBadge = getClosestBadge(e.clientX, e.clientY);
                  if (closestBadge && closestBadge !== draggingBadge) {
                    headlineElement.insertBefore(draggingBadge, closestBadge);
                  }
                });
              }

              // Handling touch events for mobile devices
              if (isTouchDevice) {
                let draggedWord = null;

                badge.addEventListener('touchstart', (e) => {
                  draggedWord = badge;
                  draggedWord.style.position = 'absolute';
                  draggedWord.style.zIndex = '1000';
                  draggedWord.style.transition = 'none'; // Disable transition during drag
                });

                badge.addEventListener('touchmove', (e) => {
                  const touch = e.touches[0];
                  draggedWord.style.left = touch.pageX - draggedWord.offsetWidth / 2 + 'px';
                  draggedWord.style.top = touch.pageY - draggedWord.offsetHeight / 2 + 'px';
                });

                badge.addEventListener('touchend', () => {
                  draggedWord.style.position = 'relative';
                  draggedWord.style.left = '0';
                  draggedWord.style.top = '0';
                });

                headlineElement.addEventListener('touchmove', (e) => {
                  e.preventDefault();
                  const closestBadge = getClosestBadge(e.touches[0].clientX, e.touches[0].clientY);
                  if (closestBadge && closestBadge !== draggedWord) {
                    headlineElement.insertBefore(draggedWord, closestBadge);
                  }
                });
              }
            });

            // Submit the game and calculate correctness
            submitButton.addEventListener('click', () => {
              const currentWords = [...document.querySelectorAll('.badge')].map(badge => badge.textContent);
              let correctCount = 0;

              // Compare the user result with the correct answer
              currentWords.forEach((word, index) => {
                if (word === correctWords[index]) {
                  correctCount++;
                }
              });

              // Calculate percentage of correct answers
              const correctness = (correctCount / correctWords.length) * 100;
              updateScore(correctness);

              // Show Correct and User Headlines with strikethrough for incorrect words
              displayHeadlines(currentWords);

              // Hide the badges and submit button, reveal the headlines
              instructionsContainer.style.display = 'none';
              headlineElement.style.display = 'none';
              submitButton.style.display = 'none';
              headlinesContainer.style.visibility = 'visible'; // Make headlines container visible
              submitButton.textContent = 'Play Again';
            });

            // Update the score label
            function updateScore(correctness) {
              // Display the score percentage
              scoreLabel.textContent = 'Your Score: ' + Math.round(correctness) + '%';
            }

            // Function to display the correct headline and user's headline with strikethrough on incorrect words
            function displayHeadlines(userWords) {
              // Display correct headline
              correctHeadlineElement.textContent = correctWords.join(' ');

              // Create the user's headline with strikethrough for incorrect words
              let userHeadline = userWords.map((word, index) => {
                if (word !== correctWords[index]) {
                  return '<span class="struck-through">' + word + '</span>';  // Incorrect words are struck-through
                }
                return word;
              }).join(' ');

              userHeadlineElement.innerHTML = userHeadline;
            }

            // Function to get the closest badge element to insert into the headline container
            function getClosestBadge(x, y) {
              const badges = [...document.querySelectorAll('.badge')];
              let closestBadge = null;
              let closestDistance = Infinity;

              badges.forEach(badge => {
                const rect = badge.getBoundingClientRect();
                const badgeCenterX = rect.left + rect.width / 2;
                const badgeCenterY = rect.top + rect.height / 2;
                const distance = Math.sqrt(Math.pow(x - badgeCenterX, 2) + Math.pow(y - badgeCenterY, 2));

                if (distance < closestDistance) {
                  closestDistance = distance;
                  closestBadge = badge;
                }
              });

              return closestBadge;
            }
          </script>

        </body>
        </html>`;

    res.send(htmlContent);
  } catch (error) {
    console.error(error);
    res.send("<h2 style='align:center'>Error loading game data</h2>");
  }
};


module.exports = {
  getGameTypeHTML,
  getQuizGame,
  getHeadlineShuffleGame
};
