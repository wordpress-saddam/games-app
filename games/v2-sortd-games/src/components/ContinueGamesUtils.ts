import GamesServices from "../../v2-services/games-service";
export interface ContinueGameData {
  id: string;
  title?: string; // Optional: fallback if titleKey is not available
  description?: string; // Optional: fallback if descriptionKey is not available
  titleKey?: string; // Translation key for title (e.g., "games.xox.name")
  descriptionKey?: string; // Translation key for description (e.g., "games.xox.description")
  imageUrl?: string;
  gameType: 'dynamic' | 'static';
  lastPlayed: string;
  progress?: {
    score?: number;
    level?: number;
    completed?: boolean;
  };
}

export const addGameToContinue = async (
  username: string,
  gameData: Omit<ContinueGameData, 'lastPlayed'>,
  userId: string
) => {
  try {
    const storageKey = `continueGames_${username}`;
    const existingGames = localStorage.getItem(storageKey);
    let games: ContinueGameData[] = existingGames ? JSON.parse(existingGames) : [];
    
    // Remove existing entry for this game if it exists
    games = games.filter(game => game.id !== gameData.id);
    
    // Add new entry at the beginning
    const newGame: ContinueGameData = {
      ...gameData,
      lastPlayed: new Date().toISOString()
    };
    
    games.unshift(newGame);
    
    
    games = games.slice(0, 10);
    const addContinueGamesResponse = await GamesServices.addContinueGames(games, userId); // add continue games to database
    if (addContinueGamesResponse?.status) {
      localStorage.setItem(storageKey, JSON.stringify(games));
      return true;
    } else {
      return false;
    }    
  } catch (error) {
    console.error('Error adding game to continue list:', error);
  }
};

export const updateGameProgress = async (
  username: string,
  gameId: string,
  progress: ContinueGameData['progress'],
  userId: string
) => {
  try {
    const storageKey = `continueGames_${username}`;
    const existingGames = localStorage.getItem(storageKey);
    if (!existingGames) return;
    
    const games: ContinueGameData[] = JSON.parse(existingGames);
    const gameIndex = games.findIndex(game => game.id === gameId);
    
    if (gameIndex !== -1) {
      games[gameIndex].progress = { ...games[gameIndex].progress, ...progress };
      games[gameIndex].lastPlayed = new Date().toISOString();
      
      // Sync to database
      if (userId) {
        try {
          const addContinueGamesResponse = await GamesServices.addContinueGames(games, userId);
          if (addContinueGamesResponse?.status) {
            localStorage.setItem(storageKey, JSON.stringify(games));
          } else {
            // If DB sync fails, still update localStorage as fallback
            localStorage.setItem(storageKey, JSON.stringify(games));
            console.warn('Failed to sync game progress to database, but updated localStorage');
          }
        } catch (dbError) {
          // If DB sync fails, still update localStorage as fallback
          localStorage.setItem(storageKey, JSON.stringify(games));
          console.error('Error syncing game progress to database:', dbError);
        }
      } else {
        // If no userId, just update localStorage
        localStorage.setItem(storageKey, JSON.stringify(games));
      }
    }
  } catch (error) {
    console.error('Error updating game progress:', error);
  }
};

export const getContinueGames = (username: string): ContinueGameData[] => {
  try {
    const storageKey = `continueGames_${username}`;
    const existingGames = localStorage.getItem(storageKey);
    if (!existingGames) return [];
    
    return JSON.parse(existingGames);
  } catch (error) {
    console.error('Error getting continue games:', error);
    return [];
  }
};
