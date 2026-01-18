import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout';
import { Button } from '@/components/ui/button';
import { useLocation, useNavigate } from "react-router-dom";
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { RefreshCw, Info, Settings, Trophy, Keyboard } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from "../../context/UserContext";
import { useTranslation } from "react-i18next";
import { formatNumberForDisplay } from "../../utils/numberFormatter";
import { useGameSchema } from "../../hooks/useGameSchema";

// List of 5-letter words for the game
const WORDS = [
  "apple", "beach", "chair", "dance", "eagle", "flame", "ghost", "heart", 
  "igloo", "jumbo", "koala", "lemon", "movie", "night", "ocean", "piano", 
  "queen", "river", "sunny", "tiger", "umbra", "vocal", "watch", "yacht", 
  "zebra", "dress", "frank", "grape", "house", "joint", "karma", "light",
  "mouse", "noble", "olive", "pasta", "quilt", "radio", "snake", "table",
  "uncle", "virus", "water", "xenon", "yield", "zesty", "brave", "clown",
  "dream", "enjoy", "flute", "glove", "haunt", "ivory", "jelly", "knife"
];


const MAX_ATTEMPTS = 6;

type GameStatus = 'playing' | 'won' | 'lost' | 'idle';

const WordleGame = () => {
  const { t } = useTranslation();
  const {user} = useUser()
  const navigate = useNavigate()
  const location = useLocation();
  const [targetWord, setTargetWord] = useState('');
  const [attempts, setAttempts] = useState<string[]>([]);
  const [currentAttempt, setCurrentAttempt] = useState('');
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [showInstructions, setShowInstructions] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [keyboardStatus, setKeyboardStatus] = useState<{[key: string]: 'correct' | 'present' | 'absent' | 'unused'}>({});
  
  // Game schema for SEO
  const baseUrl = typeof window !== "undefined" 
    ? `${window.location.protocol}//${window.location.host}` 
    : "https://asharqgames-uat.sortd.pro";
  const gameUrl = `${baseUrl}${location.pathname}${location.search ? location.search : ""}`;
  const gameName = "Wordle";
  
  useGameSchema(
    {
      name: gameName,
      headline: `${gameName} - Asharq Games`,
      description: "Play Wordle to test your word skills!",
      url: gameUrl,
      image: `${baseUrl}/assets/wordle.jpg`,
      isAccessibleForFree: true,
    },
  );
  
  // Game stats
  const [stats, setStats] = useState({
    played: 0,
    won: 0,
    currentStreak: 0,
    maxStreak: 0,
    guessDistribution: [0, 0, 0, 0, 0, 0]
  });
  
  // Get a random word
  const getRandomWord = () => {
    return WORDS[Math.floor(Math.random() * WORDS.length)].toUpperCase();
  };
  
  // Initialize the game
  const startNewGame = () => {
    const word = getRandomWord();
    setTargetWord(word);
    setAttempts([]);
    setCurrentAttempt('');
    setGameStatus('playing');
    setKeyboardStatus({});
  };
  
  // Handle keyboard or virtual keyboard input
  const handleKeyPress = useCallback((key: string) => {
    if (gameStatus !== 'playing') return;
    
    if (key === 'ENTER') {
      if (currentAttempt.length !== 5) {
        toast.error(t("games.fiveLetter.wordMustBe5Letters"));
        return;
      }
      
      if (!WORDS.includes(currentAttempt.toLowerCase())) {
        toast.error(t("games.fiveLetter.notInWordList"));
        return;
      }
      
      const newAttempts = [...attempts, currentAttempt];
      setAttempts(newAttempts);
      setCurrentAttempt('');
      
      // Update keyboard status
      const newKeyboardStatus = { ...keyboardStatus };
      updateKeyboardStatus(currentAttempt, newKeyboardStatus);
      setKeyboardStatus(newKeyboardStatus);
      
      // Check if the game is won or lost
      if (currentAttempt === targetWord) {
        setGameStatus('won');
        updateStats(newAttempts.length);
        toast.success(t("common.congratulationsYouHaveWonTheGame"));
      } else if (newAttempts.length >= MAX_ATTEMPTS) {
        setGameStatus('lost');
        updateStats(0);
        toast(t("games.fiveLetter.betterLuckNextTimeTheWordWas", { word: targetWord }));
      }
    } else if (key === 'BACKSPACE') {
      setCurrentAttempt(prevAttempt => prevAttempt.slice(0, -1));
    } else if (/^[A-Z]$/.test(key) && currentAttempt.length < 5) {
      setCurrentAttempt(prevAttempt => prevAttempt + key);
    }
  }, [currentAttempt, attempts, gameStatus, targetWord, keyboardStatus]);
  
  // Update keyboard status based on the current attempt
  const updateKeyboardStatus = (attempt: string, keyboardStatus: {[key: string]: string}) => {
    for (let i = 0; i < attempt.length; i++) {
      const letter = attempt[i];
      
      if (letter === targetWord[i]) {
        keyboardStatus[letter] = 'correct';
      } else if (targetWord.includes(letter) && keyboardStatus[letter] !== 'correct') {
        keyboardStatus[letter] = 'present';
      } else if (!targetWord.includes(letter)) {
        keyboardStatus[letter] = 'absent';
      }
    }
  };
  
  // Update game statistics
  const updateStats = (attemptsCount: number) => {
    const newStats = { ...stats };
    newStats.played++;
    
    if (attemptsCount > 0) {
      newStats.won++;
      newStats.currentStreak++;
      newStats.guessDistribution[attemptsCount - 1]++;
    } else {
      newStats.currentStreak = 0;
    }
    
    if (newStats.currentStreak > newStats.maxStreak) {
      newStats.maxStreak = newStats.currentStreak;
    }
    
    setStats(newStats);
  };
  
  // Handle physical keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStatus !== 'playing') return;
      
      if (e.key === 'Enter') {
        handleKeyPress('ENTER');
      } else if (e.key === 'Backspace') {
        handleKeyPress('BACKSPACE');
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        handleKeyPress(e.key.toUpperCase());
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyPress, gameStatus]);
  
  // Start game when component mounts
  useEffect(() => {
    if (gameStatus === 'idle') {
      startNewGame();
    }
  }, [gameStatus]);
  
  // Get the color for a letter in an attempt
  const getLetterColor = (attempt: string, index: number) => {
    const letter = attempt[index];
    
    if (letter === targetWord[index]) {
      return 'bg-green-500 border-green-600 text-white';
    } else if (targetWord.includes(letter)) {
      return 'bg-yellow-500 border-yellow-600 text-white';
    } else {
      return 'bg-muted border-border text-muted-foreground';
    }
  };
  
  // Get the color for a key on the virtual keyboard
  const getKeyColor = (key: string) => {
    switch(keyboardStatus[key]) {
      case 'correct':
        return 'bg-green-500 text-white hover:bg-green-600';
      case 'present':
        return 'bg-yellow-500 text-white hover:bg-yellow-600';
      case 'absent':
        return 'bg-muted text-muted-foreground hover:bg-muted/80';
      default:
        return 'bg-card hover:bg-muted';
    }
  };
  
  // Render the keyboard
  const renderKeyboard = () => {
    const rows = [
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
      ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
    ];

     if(!user){
    navigate('/');
  }
    
    return (
      <div className="mt-4 select-none">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center mb-2">
            {row.map((key) => (
              <button
                key={key}
                className={`${
                  key === 'ENTER' || key === 'BACKSPACE' 
                    ? 'px-2 text-xs sm:text-sm w-14 sm:w-16' 
                    : 'w-8 sm:w-10'
                } h-12 sm:h-14 mx-0.5 rounded font-bold border ${getKeyColor(key)}`}
                onClick={() => handleKeyPress(key)}
              >
                {key === 'BACKSPACE' ? '⌫' : key}
              </button>
            ))}
          </div>
        ))}
      </div>
    );
  };
  
  // Show the highest percentage in guess distribution
  const maxGuessCount = Math.max(...stats.guessDistribution);
  
  return (
    <Layout>
      <div className="game-area">
        <div className="game-container">
        
            <div className="mb-4">
            <div className="flex items-center justify-between mb-4 px-2">
              <h1 className="text-2xl md:text-3xl font-bold ">{t("games.fiveLetter.name")}</h1>
            </div>
          </div>
           
          <div className="bg-card border border-border rounded-lg shadow-lg overflow-hidden">
            {/* Game controls */}
            <div className="bg-muted/50 p-4 flex items-center justify-between border-b border-border">
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={startNewGame}
                >
                  <RefreshCw className="mr-1 h-4 w-4" /> {t("games.fiveLetter.newGame")}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowInstructions(true)}
                >
                  <Info className="mr-1 h-4 w-4" /> {t("games.fiveLetter.howToPlay")}
                </Button>
              </div>
              <div>
               
              </div>
            </div>
            
            {/* Game board */}
            <div className="p-4 sm:p-6 flex flex-col items-center justify-center">
              <div className="mb-4 w-full max-w-xs">
                {Array.from({ length: MAX_ATTEMPTS }).map((_, rowIndex) => {
                  const attempt = attempts[rowIndex] || '';
                  const isCurrentRow = rowIndex === attempts.length && gameStatus === 'playing';
                  
                  return (
                    <div key={rowIndex} className="flex justify-center mb-2">
                      {Array.from({ length: 5 }).map((_, colIndex) => {
                        const letter = attempt[colIndex] || (isCurrentRow ? currentAttempt[colIndex] : '');
                        
                        return (
                          <div
                            key={colIndex}
                            className={`
                              w-12 h-12 sm:w-14 sm:h-14 mx-0.5 flex items-center justify-center 
                              text-xl font-bold border-2 
                              ${attempt 
                                ? getLetterColor(attempt, colIndex) 
                                : isCurrentRow && letter 
                                  ? 'bg-background border-primary/50' 
                                  : 'bg-background border-border'
                              }
                              transition-all
                            `}
                          >
                            {letter}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
              
              {/* Virtual keyboard */}
              {renderKeyboard()}
              
              {/* Game over message */}
              {(gameStatus === 'won' || gameStatus === 'lost') && (
                <div className="mt-4 text-center">
                  <p className="text-lg font-medium mb-2">
                    {gameStatus === 'won' 
                      ? t("games.fiveLetter.youGotItInTryTries", { count: attempts.length }) 
                      : t("games.fiveLetter.betterLuckNextTimeTheWordWas", { word: targetWord })}
                  </p>
                  <Button onClick={startNewGame}>{t("common.playAgain")}</Button>
                </div>
              )}
            </div>
          </div>
          
          {/* How to play dialog */}
          <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{t("games.fiveLetter.howToPlay")} {t("games.fiveLetter.name")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p>{t("games.fiveLetter.guessTheWordleInSixTries")}</p>
                <p>{t("games.fiveLetter.eachGuessMustBeAValidFiveLetterWord")}</p>
                <p>{t("games.fiveLetter.afterEachGuessTheColorOfTheTilesWillChangeToShowHowCloseYourGuessWasToTheWord")}</p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-green-500 text-white font-bold flex items-center justify-center">W</div>
                    <span>{t("games.fiveLetter.theLetterIsInTheWordAndInTheCorrectSpot", { letter: "W" })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-yellow-500 text-white font-bold flex items-center justify-center">I</div>
                    <span>{t("games.fiveLetter.theLetterIsInTheWordButInTheWrongSpot", { letter: "I" })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-muted text-muted-foreground font-bold flex items-center justify-center">U</div>
                    <span>{t("games.fiveLetter.theLetterIsNotInTheWordInAnySpot", { letter: "U" })}</span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => setShowInstructions(false)}>{t("common.gotIt")}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Stats dialog */}
          <Dialog open={showStats} onOpenChange={setShowStats}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{t("games.fiveLetter.statistics")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">{stats.played}</div>
                    <div className="text-xs text-muted-foreground">{t("games.fiveLetter.played")}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0}%
                    </div>
                    <div className="text-xs text-muted-foreground">{t("games.fiveLetter.win")}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stats.currentStreak}</div>
                    <div className="text-xs text-muted-foreground">{t("games.fiveLetter.currentStreak")}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stats.maxStreak}</div>
                    <div className="text-xs text-muted-foreground">{t("games.fiveLetter.maxStreak")}</div>
                  </div>
                </div>
                
                <div>
                  <div className="mb-2 font-medium">{t("games.fiveLetter.guessDistribution")}</div>
                  <div className="space-y-2">
                    {stats.guessDistribution.map((count, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-4 text-muted-foreground">{index + 1}</div>
                        <div 
                          className={`h-6 flex items-center px-2 text-xs font-medium ${
                            count > 0 ? 'bg-primary text-primary-foreground' : 'bg-muted/50'
                          }`}
                          style={{ 
                            width: count > 0 ? `${(count / maxGuessCount) * 100}%` : '20px',
                            minWidth: count > 0 ? '20px' : '20px'
                          }}
                        >
                          {formatNumberForDisplay(count)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => setShowStats(false)}>{t("games.fiveLetter.close")}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Side Ad */}
          {/* <div className="w-full bg-muted/30 rounded-lg p-4 my-4">
            <div className="text-center">
              <span className="text-xs text-muted-foreground">Advertisement</span>
              <div id="game-side-ad" className="bg-card border border-border h-32 w-full rounded flex items-center justify-center">
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-megaphone"><path d="m3 11 18-5v12L3 13"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>
                  <span>Advertisement</span>
                </div>
              </div>
            </div>
          </div> */}
        </div>
      </div>
    </Layout>
  );
};

export default WordleGame;
