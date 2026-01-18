const fs = require('fs');
const config = require('../config/config');
const getGameTypeHTML = async (data, hostname, article_guid, game_id) => {
    try {
        let baseUrl = hostname ? `https://${hostname}` : "";
        if (config.ENV === 'DEVELOPMENT') {
            baseUrl = `http://${hostname}:${config.port}`;
        }
        let htmlContent = `
        <!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Asharq Games Dashboard</title>
    <style>
        /* Base Styles - Update these values */
        :root {

            --primary-blue: #3D66DF;
            /* brand-consistent */
            --accent-orange: #FF8800;
            /* warmer, more muted */
            --text-primary: #1c1c1c;
            --text-secondary: #5e5e5e;
            --bg-color: #f9fafb;
            /* subtle soft background */
            --card-bg: #ffffff;
            --shadow: 0 4px 12px rgba(0, 0, 0, 0.07);
            /* softer shadow */
            --border-radius: 12px;
            --spacing-sm: 5px;
  --spacing-md: 5px;
  --spacing-lg: 10px;
  --max-content-width: 700px;
            --card-transition: all 0.3s ease;
        }

        body {
            background-color: var(--bg-color);
            color: var(--text-primary);
            font-family: 'Inter', 'Segoe UI', sans-serif;
            font-size: 16px;
            line-height: 1.5;
        }


.app-container {
  max-width: var(--max-content-width);
  margin: 0 auto;
  padding-bottom: var(--spacing-lg);
}

        /* Enhanced Hero Banner Styles */
        .hero-banner {
            background-image: linear-gradient(135deg, #3D66DF 0%, #042485 100%);
            padding: var(--spacing-lg) var(--spacing-md);
            box-shadow: var(--shadow);
            background-color: var(--primary-blue);
            color: white;
            position: relative;
            overflow: hidden;
            margin-bottom: var(--spacing-lg);
            transition: var(--card-transition);
        }

        /* .hero-banner:hover {
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2);
  transform: translateY(-5px);
} */

        .logo-container {
            position: absolute;
            top: var(--spacing-md);
            right: var(--spacing-md);
            z-index: 2;
        }

        .sortd-logo {
            height: 40px;
            width: auto;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
        }

        .hero-content {
            padding-top: 20px;
            position: relative;
        }

        .hero-flex-container {
            display: flex;
            align-items: center;
            gap: var(--spacing-lg);
        }

        .hero-image-container {
            flex: 0 0 40%;
            max-width: 180px;
            transform: rotate(-5deg);
            transition: transform 0.3s ease;
        }

        .hero-banner:hover .hero-image-container {
            transform: rotate(0deg) scale(1.05);
        }

        .hero-image {
            width: 100%;
            height: auto;
            border-radius: var(--border-radius);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
        }

        .hero-text {
            flex: 1;
        }

        .hero-text h1 {
            font-size: 2.5rem;
            font-weight: bold;
            margin-bottom: var(--spacing-sm);
            letter-spacing: 3px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .hero-text p {
            font-size: 1.1rem;
            margin-bottom: var(--spacing-md);
            opacity: 0.9;
        }

        .play-btn {
            background-color: var(--accent-orange);
            color: white;
            border: none;
            padding: 14px 32px;
            font-size: 1.1rem;
            font-weight: bold;
            border-radius: 30px;
            cursor: pointer;
            transition: transform 0.3s, background-color 0.3s, box-shadow 0.3s;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
            letter-spacing: 1px;
        }

        .play-btn:hover,
        .play-btn:focus {
            background-color: #e88600;
            transform: translateY(-3px);
            box-shadow: 0 6px 15px rgba(0, 0, 0, 0.3);
        }

        .play-btn:active {
            transform: translateY(-1px);
        }

        /* Games Container */

/* Enhanced Game Card Styles */
.game-card {
  background-color: var(--card-bg);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  margin-bottom: var(--spacing-lg);
  overflow: hidden;
  transition: var(--card-transition);
  display: flex;
  flex-direction: row;
  height: auto;
  cursor: pointer;
  position: relative;
}

        .game-card:hover {
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
        }


        .game-image-container {
            flex: 0 0 150px;
            height: 100%;
            position: relative;
            overflow: hidden;
        }

        .game-image {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.3s ease;
        }

        .game-card:hover .game-image {
            transform: scale(1.08);
        }

        /* Different background colors based on game type - Enhanced */
        .headline_scramble .game-image {
            background-color: #27ae60;
            background-image: linear-gradient(135deg, #27ae60, #2ecc71);
        }

        .quiz .game-image {
            background-color: #f5f5f5;
            background-image: linear-gradient(135deg, #f5f5f5, #e0e0e0);
        }

        .hangman .game-image {
            background-color: #3498db;
            background-image: linear-gradient(135deg, #3498db, #2980b9);
        }

        .crossclimb .game-image {
            background-color: #3498db;
            background-image: linear-gradient(135deg, #3498db, #2980b9);
        }

        .word_connect .game-image {
            background-color: #9b59b6;
            background-image: linear-gradient(135deg, #9b59b6, #8e44ad);
        }

        .memory_match .game-image {
            background-color: #f1c40f;
            background-image: linear-gradient(135deg, #f1c40f, #f39c12);
        }

        .card-content {
            flex: 1;
            padding: var(--spacing-md);
            display: flex;
            flex-direction: column;
            justify-content: space-evenly;
        }

        .game-title-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            /* margin-bottom: var(--spacing-sm); */
        }

        .game-title {
            font-size: 1.2rem;
            font-weight: 600;
            margin-bottom: var(--spacing-sm);
            color: var(--text-primary);
        }

        .favorite-btn {
            font-size: 1.3rem;
            color: #ccc;
            margin-left: var(--spacing-sm);
        }

        .favorite-btn.active {
            color: #ffc107;
        }

        .favorite-btn:hover {
            /* color: #ffcc00; */
            transform: scale(1.2);
        }

        .game-description {
            color: var(--text-secondary);
            font-size: 0.95rem;
            margin-top: var(--spacing-sm);
            margin-bottom: var(--spacing-sm);
            display: -webkit-box;
            -webkit-line-clamp: 3;
            line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .last-updated {
            color: #999;
            font-size: 0.8rem;
            text-align: right;
        }

        .last-updated i {
            margin-right: 5px;
            font-size: 0.8rem;
        }

        .game-cta {
            padding: 0;
            background-color: transparent;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: var(--spacing-sm);
        }

        .play-now-btn {
            background-color: var(--accent-orange);
            border: none;
            color: #fff;
            font-weight: bold;
            font-size: 0.95rem;
            cursor: pointer;
            padding: 10px 24px;
            border-radius: 999px;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
            transition: background-color 0.3s ease, transform 0.2s ease;
        }

        .play-now-btn:hover {
            background-color: #e27100;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }


        /* Loading Indicator - Enhanced */
        .loading-indicator {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: var(--spacing-lg);
            color: var(--text-secondary);
        }

        .spinner {
            width: 50px;
            height: 50px;
            border: 5px solid rgba(0, 115, 177, 0.2);
            border-radius: 50%;
            border-top-color: var(--primary-blue);
            animation: spin 1s ease-in-out infinite;
            margin-bottom: var(--spacing-md);
        }

        @keyframes spin {
            to {
                transform: rotate(360deg);
            }
        }

        /* Badge for favorites - Enhanced */
        .favorite-badge {
            position: absolute;
            top: var(--spacing-sm);
            left: var(--spacing-sm);
            background-color: rgba(255, 204, 0, 0.9);
            color: #333;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: bold;
            z-index: 1;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        }

        /* Game type specific images - Enhanced SVG display */
        .game-image-content {
            width: 100%;
            height: 200px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: var(--spacing-sm);
        }

        /* Make SVGs responsive and larger */
        .game-image-content svg {
            max-width: 100%;
            max-height: 100%;
            width: 100%;
            height: 100%;
        }

        /* Media Queries for Responsive Design */
        @media (max-width: 600px) {
            .game-image-container {
                flex: 0 0 100px;
                height: 185px;
            }

            .hero-text h1 {
                font-size: 2rem;
            }

            .hero-text p {
                font-size: 0.9rem;
            }

            .play-btn {
                padding: 10px 24px;
                font-size: 1rem;
            }

            .game-title {
                font-size: 1.1rem;
            }
        }
    </style>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>

<body>
    <div class="app-container">
        <!-- Header Section -->
        <header class="hero-banner">
            <div class="logo-container">
                <img src="images/sortd.webp" alt="Sortd Logo" class="sortd-logo">
            </div>
            <div class="hero-content">
                <div class="hero-flex-container">
                    <div class="hero-image-container">
                        <img src="images/ludo.png" Ludo Game" class="hero-image">
                    </div>
                    <div class="hero-text">
                        <h1>LUDO</h1>
                        <p>Classic Board Game | Online Match | Coming Soon</p>
                        <!-- <button class="play-btn">PLAY</button> -->
                    </div>
                </div>
            </div>
        </header>

        <!-- Game Cards Container -->
        <main class="games-container" id="games-container">
            <!-- Game cards will be dynamically inserted here -->
            <div class="loading-indicator">
                <div class="spinner"></div>
                <p>Loading games...</p>
            </div>
        </main>
    </div>

    <script>
        // Game Data - This would normally come from an API
       
        const gamesData = ${JSON.stringify(data)};
        // Game Data - This would normally come from an API
        // No changes needed here

        // DOM Elements
        const gamesContainer = document.getElementById('games-container');
        // const playButton = document.querySelector('.play-btn');

        // Storage Keys
        const STORAGE_KEYS = {
            GAME_DATA: 'sortd_games_data',
            FAVORITES: 'sortd_favorites'
        };

        // Initialize the application
        document.addEventListener('DOMContentLoaded', () => {
            initializeApp();

            // Event listener for the Ludo play button
            // playButton.addEventListener('click', () => {
            //   navigateToGame('ludo');
            // });
        });

        /**
        * Initialize the application
        */
        function initializeApp() {
            // Initialize local storage if first visit
            initializeStorage();

            // Render the games
            renderGames();

            // Add subtle animation to the hero banner
            animateHero();
        }

        /**
        * Add subtle animations to the hero section
        */
        function animateHero() {
            const heroBanner = document.querySelector('.hero-banner');

            // Add a class to trigger the animation after a slight delay
            setTimeout(() => {
                heroBanner.classList.add('animate-in');
            }, 200);
        }

        /**
        * Initialize localStorage with game data if not already present
        */
        function initializeStorage() {
            // Initialize game data in localStorage
            const storedGameData = localStorage.getItem(STORAGE_KEYS.GAME_DATA);

            if (!storedGameData) {
                // First visit, initialize storage
                const initialGameData = {};

                gamesData.forEach(game => {
                    initialGameData[game.game_type] = {
                        play_count: 0,
                        last_played_on: null
                    };
                });

                localStorage.setItem(STORAGE_KEYS.GAME_DATA, JSON.stringify(initialGameData));
            } else {
                // Check for new games not in storage
                const parsedGameData = JSON.parse(storedGameData);
                let hasNewGames = false;

                gamesData.forEach(game => {
                    if (!parsedGameData[game.game_type]) {
                        parsedGameData[game.game_type] = {
                            play_count: 0,
                            last_played_on: null
                        };
                        hasNewGames = true;
                    }
                });

                // Update storage if new games were found
                if (hasNewGames) {
                    localStorage.setItem(STORAGE_KEYS.GAME_DATA, JSON.stringify(parsedGameData));
                }
            }

            // Initialize favorites if not present
            if (!localStorage.getItem(STORAGE_KEYS.FAVORITES)) {
                localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify([]));
            }
        }

        /**
        * Format time to relative format (e.g., "2 days ago")
        * @param {String} dateString - ISO date string
        * @returns {String} - Relative time string
        */
        function getRelativeTimeString(dateString) {
            if (!dateString) return null;

            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now - date;
            const diffSecs = Math.floor(diffMs / 1000);
            const diffMins = Math.floor(diffSecs / 60);
            const diffHours = Math.floor(diffMins / 60);
            const diffDays = Math.floor(diffHours / 24);

            if (diffDays > 0) {
                return diffDays === 1 ? '1 day ago' : \`\${diffDays} days ago\`;
            } else if (diffHours > 0) {
                return diffHours === 1 ? '1 hour ago' : \`\${diffHours} hours ago\`;
            } else if (diffMins > 0) {
                return diffMins === 1 ? '1 minute ago' : \`\${diffMins} minutes ago\`;
            } else {
                return 'Just now';
            }
        }

        /**
        * Render all game cards sorted by favorites and play count
        */
        function renderGames() {
            // Clear loading indicator
            gamesContainer.innerHTML = '';

            // Get game data and favorites from storage
            const gameStats = JSON.parse(localStorage.getItem(STORAGE_KEYS.GAME_DATA));
            const favorites = JSON.parse(localStorage.getItem(STORAGE_KEYS.FAVORITES));

            // Sort games by favorites first, then by play count
            const sortedGames = [...gamesData].sort((a, b) => {
                // Check if game is a favorite
                const aIsFavorite = favorites.includes(a.game_type);
                const bIsFavorite = favorites.includes(b.game_type);

                // Sort by favorite status first
                if (aIsFavorite && !bIsFavorite) return -1;
                if (!aIsFavorite && bIsFavorite) return 1;

                // Then sort by play count
                const aPlayCount = gameStats[a.game_type]?.play_count || 0;
                const bPlayCount = gameStats[b.game_type]?.play_count || 0;

                return bPlayCount - aPlayCount;
            });

            // Create and append game cards
            sortedGames.forEach(game => {
                const gameCard = createGameCard(game, favorites.includes(game.game_type));
                gamesContainer.appendChild(gameCard);
            });
        }

        /**
        * Create a game card element
        * @param {Object} game - Game data object
        * @param {Boolean} isFavorite - Whether the game is favorited
        * @returns {HTMLElement} - Game card element
        */
        function createGameCard(game, isFavorite) {
            const gameCard = document.createElement('div');
            gameCard.className = \`game-card \${game.game_type}\`;
            gameCard.dataset.gameType = game.game_type;

            // Generate game image based on game type
            const gameImageContent = generateGameImage(game.game_type);

            // Process timestamp if available
            let updateTimeHtml = '';
            if (game.latest_article && game.latest_article.updatedAt) {
                const relativeTime = getRelativeTimeString(game.latest_article.updatedAt);
                if (relativeTime) {
                    updateTimeHtml = \`
      <div class="last-updated">
        <i class="fas fa-clock"></i> Updated \${relativeTime}
      </div>
    \`;
                }
            }

            // Build card HTML
            gameCard.innerHTML = \`
    <div class="game-image-container">
      <!-- \${isFavorite ? '<span class="favorite-badge">★ Favorite</span>' : ''} -->
      <div class="game-image">
        <div class="game-image-content">
          \${gameImageContent}
        </div>
      </div>
    </div>
    <div class="card-content">
      <div>
        <div class="game-title-row">
          <h2 class="game-title">\${game.display_name}</h2>
          <button class="favorite-btn \${isFavorite ? 'active' : ''}" aria-label="Toggle favorite">
            \${isFavorite ? '★' : '☆'}
          </button>
        </div>
        <p class="game-description">\${game.desc}</p>
        </div>
        <div class="game-cta">
        <button class="play-now-btn">Play Now</button>
        \${updateTimeHtml}
        </div>
    </div>
  \`;

            // Add event listeners
            const favoriteBtn = gameCard.querySelector('.favorite-btn');
            favoriteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleFavorite(game.game_type,favoriteBtn);
            });

         const playNowBtn = gameCard.querySelector('.play-now-btn');
         playNowBtn.addEventListener('click', (e) => {
           e.stopPropagation();
           navigateToGame(game.game_type);
         });

            // Make the entire card clickable
            //gameCard.addEventListener('click', () => {
            //    navigateToGame(game.game_type);
            //});

            return gameCard;
        }

        /**
        * Navigate to game URL
        * @param {String} gameType - Type of game to play
        */
        function navigateToGame(gameType) {
            // Update play count and timestamp
            updateGameStats(gameType);

            // Navigate to the game URL
            let gameUrl = \`/play/\${gameType}\`;
            // Get current URL parameters
            const urlParams = new URLSearchParams(window.location.search);

            // Check if there are any parameters
            if (urlParams.toString().length > 0) {
                gameUrl += \`?\${urlParams.toString()}\`;
            }
           gameUrl = \`${baseUrl}\${gameUrl}\`;
            console.log(\`Navigating to: \${gameUrl}\`);

            // alert(\`Now navigating to: \${gameUrl}\`);

            window.location.href = gameUrl;
}

        /**
        * Update game statistics when played
        * @param {String} gameType - Type of game being played
        */
        function updateGameStats(gameType) {
            // Get current game data
            const gameData = JSON.parse(localStorage.getItem(STORAGE_KEYS.GAME_DATA));

            // Update play count and timestamp if it's not the main Ludo game
            if (gameData[gameType]) {
                gameData[gameType].play_count += 1;
                gameData[gameType].last_played_on = Date.now();

                // Save updated data
                localStorage.setItem(STORAGE_KEYS.GAME_DATA, JSON.stringify(gameData));
            }
        }

        /**
        * Generate visual representation based on game type
        * @param {String} gameType - Type of game
        * @returns {String} - HTML content for the game image
        */
        function generateGameImage(gameType) {
            // Enhanced SVGs with larger sizes and improved visual appeal
            switch (gameType) {
                case 'headline_scramble':
                    return \`
        <div class="headline-scramble-image">
          <svg width="150" height="150" viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="35" width="40" height="25" rx="10" fill="#e0e0e0" />
            <text x="30" y="53" text-anchor="middle" font-size="16" fill="#333">This</text>
            
            <rect x="55" y="35" width="60" height="25" rx="10" fill="#ff9500" />
            <text x="85" y="53" text-anchor="middle" font-size="16" fill="#fff">Headline</text>
            
            <rect x="120" y="35" width="20" height="25" rx="10" fill="#e0e0e0" />
            <text x="130" y="53" text-anchor="middle" font-size="16" fill="#333">is</text>
            
            <path d="M80 70 L90 90 L100 70 Z" fill="#f5d08c" />
            <rect x="87" y="90" width="8" height="25" rx="4" fill="#f5d08c" />
          </svg>
        </div>
      \`;
                case 'hangman':
                    return \`
          <div class="hangman-image">
           <svg width="150" height="150" viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg">
              <!-- Background -->
              <rect width="100%" height="100%" fill="#ffffff" />

              <!-- Individual letters of HANGMAN for precise positioning -->
              <text x="30" y="80" font-size="26" font-family="Impact, sans-serif" fill="#1976d2">H</text>
              <text x="52" y="80" font-size="26" font-family="Impact, sans-serif" fill="#1976d2">A</text>
              <text x="75" y="80" font-size="26" font-family="Impact, sans-serif" fill="#1976d2">N</text>
              <text x="97" y="80" font-size="26" font-family="Impact, sans-serif" fill="#1976d2">G</text>
              <text x="30" y="110" font-size="26" font-family="Impact, sans-serif" fill="#1976d2">M</text>
              <text x="57" y="110" font-size="26" font-family="Impact, sans-serif" fill="#1976d2">A</text>
              <text x="80" y="110" font-size="26" font-family="Impact, sans-serif" fill="#1976d2">N</text>

              <!-- Underscores placed directly under each letter -->
              <line x1="30" y1="85" x2="47" y2="85" stroke="#1976d2" stroke-width="3" />
              <line x1="52" y1="85" x2="69" y2="85" stroke="#1976d2" stroke-width="3" />
              <line x1="75" y1="85" x2="92" y2="85" stroke="#1976d2" stroke-width="3" />
              <line x1="97" y1="85" x2="114" y2="85" stroke="#1976d2" stroke-width="3" />
              <line x1="30" y1="115" x2="52" y2="115" stroke="#1976d2" stroke-width="3" />
              <line x1="57" y1="115" x2="74" y2="115" stroke="#1976d2" stroke-width="3" />
              <line x1="80" y1="115" x2="97" y2="115" stroke="#1976d2" stroke-width="3" />
            </svg>
          </div>
        \`;
                case 'quiz':
                    return \`
        <div class="quiz-image">
          <svg width="150" height="150" viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg">
            <rect x="30" y="40" width="35" height="35" rx="6" fill="#ff9800" />
            <text x="47" y="65" text-anchor="middle" font-size="22" fill="#fff">Q</text>
            
            <rect x="70" y="30" width="35" height="35" rx="6" fill="#8bc34a" />
            <text x="87" y="55" text-anchor="middle" font-size="22" fill="#fff">U</text>
            
            <rect x="30" y="80" width="35" height="35" rx="6" fill="#03a9f4" />
            <text x="47" y="105" text-anchor="middle" font-size="22" fill="#fff">I</text>
            
            <rect x="70" y="80" width="35" height="35" rx="6" fill="#e53935" />
            <text x="87" y="105" text-anchor="middle" font-size="22" fill="#fff">Z</text>
          </svg>
        </div>
      \`;
                default:
                    return \`
        <div class="default-game-image">
          <svg width="150" height="150" viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg">
            <circle cx="75" cy="75" r="50" fill="#e0e0e0" />
            <text x="75" y="85" text-anchor="middle" font-size="30" fill="#333">Game</text>
          </svg>
        </div>
      \`;
            }\
        }

        /**
        * Toggle favorite status for a game
        * @param {String} gameType - Type of game to toggle favorite status
        */
        function toggleFavorite(gameType,favoriteBtn) {
            // Get current favorites
            const favorites = JSON.parse(localStorage.getItem(STORAGE_KEYS.FAVORITES));

            // Check if game is already a favorite
            const index = favorites.indexOf(gameType);

            if (index === -1) {
                // Add to favorites
                favorites.push(gameType);
            } else {
                // Remove from favorites
                favorites.splice(index, 1);
            }

            // Save updated favorites
            localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));

            // Re-render games to update UI
           // renderGames();

              // Update the button's appearance
              if (favoriteBtn) {
                const isFavorite = favorites.includes(gameType);
                favoriteBtn.classList.toggle('active', isFavorite);
                favoriteBtn.textContent = isFavorite ? '★' : '☆';
              }

        }

        /**
        * Display error message
        * @param {String} message - Error message to display
        */
        function showError(message) {
            const errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            errorElement.textContent = message;

            gamesContainer.innerHTML = '';
            gamesContainer.appendChild(errorElement);
        }

        /**
        * Show loading indicator
        */
        function showLoading() {
            gamesContainer.innerHTML = \`
  <div class="loading-indicator">
    <div class="spinner"></div>
    <p>Loading games...</p>
  </div>
\`;
        }
    </script>
</body>

</html>
`;

// fs.writeFileSync("listing.html", htmlContent);
        return (htmlContent);
    } catch (error) {
        console.error("Error generating HTML:", error);
        return `<h1>Error generating the game page. Please try again later.</h1>`;
    }
};


const getGameTypeWidget = async (data, hostname, article_guid, game_id) => {
    try {
        const htmlContent = await getGameTypeHTML(data, hostname, article_guid, game_id);
        const containerId = "sortd-games";
        const widgetScript = `
        (function () {
        let container = document.getElementById("${containerId}");
        if (!container) {
            container = document.createElement("div");
            container.id = "${containerId}";

            document.body.appendChild(container);
        }
        container.style.overflow = "auto"; // Enables scroll if needed
        container.style.border = "1px solid #ccc"; // Just for visibility
        container.style.background = "#f9f9f9";
       
        container.innerHTML = \`${htmlContent}\`;
        
    })();`
        return widgetScript;

    } catch (error) {
        console.log(error)
        return error;
    }
}
module.exports = {
    getGameTypeHTML,
    getGameTypeWidget
};