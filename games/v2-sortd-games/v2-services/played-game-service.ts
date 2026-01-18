export interface PlayedGame {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  lastPlayed: string;
  playCount: number;
}

class PlayedGamesService {
  private storageKey = 'sortd_played_games';

  // Get all played games from localStorage
  getPlayedGames(): PlayedGame[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading played games from localStorage:', error);
      return [];
    }
  }

  // Add or update a played game
  addPlayedGame(gameData: Omit<PlayedGame, 'lastPlayed' | 'playCount'>): void {
    try {
      const playedGames = this.getPlayedGames();
      const existingIndex = playedGames.findIndex(game => game.id === gameData.id);
      
      if (existingIndex !== -1) {
        // Update existing game
        playedGames[existingIndex] = {
          ...playedGames[existingIndex],
          ...gameData,
          lastPlayed: new Date().toISOString(),
          playCount: playedGames[existingIndex].playCount + 1
        };
      } else {
        // Add new game
        const newGame: PlayedGame = {
          ...gameData,
          lastPlayed: new Date().toISOString(),
          playCount: 1
        };
        playedGames.unshift(newGame); // Add to beginning
      }

      // Keep only the last 20 played games
      const limitedGames = playedGames.slice(0, 20);
      
      localStorage.setItem(this.storageKey, JSON.stringify(limitedGames));
    } catch (error) {
      console.error('Error saving played game to localStorage:', error);
    }
  }

  // Get recently played games (sorted by last played)
  getRecentlyPlayed(limit: number = 8): PlayedGame[] {
    const playedGames = this.getPlayedGames();
    return playedGames
      .sort((a, b) => new Date(b.lastPlayed).getTime() - new Date(a.lastPlayed).getTime())
      .slice(0, limit);
  }

  // Get most played games (sorted by play count)
  getMostPlayed(limit: number = 8): PlayedGame[] {
    const playedGames = this.getPlayedGames();
    return playedGames
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, limit);
  }

  // Remove a game from played games
  removePlayedGame(gameId: string): void {
    try {
      const playedGames = this.getPlayedGames();
      const filteredGames = playedGames.filter(game => game.id !== gameId);
      localStorage.setItem(this.storageKey, JSON.stringify(filteredGames));
    } catch (error) {
      console.error('Error removing played game from localStorage:', error);
    }
  }

  // Clear all played games
  clearPlayedGames(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Error clearing played games from localStorage:', error);
    }
  }

  // Get formatted last played time
  getFormattedLastPlayed(lastPlayed: string): string {
    const now = new Date();
    const playedDate = new Date(lastPlayed);
    const diffInHours = Math.floor((now.getTime() - playedDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}w ago`;
  }
}

export default new PlayedGamesService();