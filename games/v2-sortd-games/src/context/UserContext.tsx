import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import GamesServices from '../../v2-services/games-service';

interface User {
  username: string;
  user_id?: string;
  token?: string;
  country?: string;
  city? : string;
  region?: string;
  image?: string; // country flag image
  emoji?: string; // country emoji
  email?: string;
  isAnonymous?: boolean; // Flag to indicate anonymous/guest user
}

interface UserContextType {
  user: User | null;
  setUser: (user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkExistingUser = async () => {
      try {
        const storedUser = localStorage.getItem('userDetails');
        const storedToken = localStorage.getItem('authToken');
        
        if (storedUser) {
          const parsedUser: User = JSON.parse(storedUser);
          // Ensure token is set if available
          if (storedToken && !parsedUser.token) {
            parsedUser.token = storedToken;
          }
          setUserState(parsedUser);

          // Fetch continueGames from backend if user_id exists and user is not anonymous
          if (parsedUser.user_id && parsedUser.username && !parsedUser.isAnonymous) {
            const storageKey = `continueGames_${parsedUser.username}`;
            const existingContinueGames = localStorage.getItem(storageKey);
            
            // Only fetch from backend if localStorage is empty
            if (!existingContinueGames) {
              try {
                const continueGamesResponse = await GamesServices.getContinueGames(parsedUser.user_id);
                if (continueGamesResponse?.data?.status && continueGamesResponse?.data?.data) {
                  const continueGames = continueGamesResponse.data.data.continuous_games || [];
                  if (Array.isArray(continueGames) && continueGames.length > 0) {
                    localStorage.setItem(storageKey, JSON.stringify(continueGames));
                  }
                }
              } catch (continueGamesError) {
                console.error('Error fetching continueGames on app start:', continueGamesError);
                // Continue even if continueGames fetch fails
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading user from localStorage:', error);
        localStorage.removeItem('userDetails');
        localStorage.removeItem('authToken');
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingUser();
  }, []);

  const setUser = (user: User) => {
    setUserState(user);
    localStorage.setItem('userDetails', JSON.stringify(user));
    // Store token separately for API calls (only for authenticated users)
    if (user.token && !user.isAnonymous) {
      localStorage.setItem('authToken', user.token);
    } else if (user.isAnonymous) {
      // Clear token if user is anonymous
      localStorage.removeItem('authToken');
    }
  };

  const logout = () => {
    // Preserve theme before clearing
    const theme = localStorage.getItem('theme');
    
    // Clear user-related data
    setUserState(null);
    localStorage.removeItem('userDetails');
    localStorage.removeItem('authToken');
    
    // Clear all continueGames_* keys from localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('continueGames_')) {
        localStorage.removeItem(key);
      }
    });
    
    // Restore theme after clearing
    if (theme) {
      localStorage.setItem('theme', theme);
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, logout, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};
