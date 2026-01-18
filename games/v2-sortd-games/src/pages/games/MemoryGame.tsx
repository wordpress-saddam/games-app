
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Layout from "../../components/Layout";
import { useToast } from "../../hooks/use-toast";
import { useUser } from "../../context/UserContext";
import GamesServices from "../../../v2-services/games-service";
import LeaderboardModal from "./LeaderboardModal";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, HelpCircle, Settings, Puzzle } from "lucide-react";
import { Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatTime, formatNumberForDisplay } from "../../utils/numberFormatter";
import { useGameSchema } from "../../hooks/useGameSchema";

type Card = {
  id: number;
  icon: string;
  flipped: boolean;
  matched: boolean;
};

const ICONS = [
  "🍎",
  "🍌",
  "🍒",
  "🍓",
  "🍊",
  "🍇",
  "🍉",
  "🍋",
  "🍍",
  "🥭",
  "🍏",
  "🍐",
  "🥝",
  "🍈",
  "🥥",
  "🫐",
];

const getRandomCards = (count: number): Card[] => {
  const selectedIcons = [...ICONS].slice(0, count);
  const cardPairs = [...selectedIcons, ...selectedIcons];

  return cardPairs
    .sort(() => Math.random() - 0.5)
    .map((icon, index) => ({
      id: index,
      icon,
      flipped: false,
      matched: false,
    }));
};

// Memoized Timer Display Component
const TimerDisplay = React.memo(({ time }: { time: number }) => {
  const { t } = useTranslation();
  return <span>{t("games.cardPairChallenge.time")} : {formatTime(time)}</span>;
});

// Memoized Card Component with iPad optimizations
const GameCard = React.memo(({ 
  card, 
  onClick, 
  disabled,
  index,
  isJustMatched,
  isJustMismatched,
}: { 
  card: Card; 
  onClick: (id: number) => void;
  disabled: boolean;
  index: number;
  isJustMatched: boolean;
  isJustMismatched: boolean;
}) => {
  const prevFlippedRef = useRef<boolean>(card.flipped);
  const [flipAnim, setFlipAnim] = useState<"none" | "flip" | "flipback">("none");

  useEffect(() => {
    const prev = prevFlippedRef.current;
    if (prev !== card.flipped) {
      if (card.flipped) {
        setFlipAnim("flip");
      } else {
        setFlipAnim("flipback");
      }
      const t = setTimeout(() => setFlipAnim("none"), 550);
      return () => clearTimeout(t);
    }
    prevFlippedRef.current = card.flipped;
  }, [card.flipped]);
  const handleClick = useCallback(() => {
    if (!disabled && !card.flipped && !card.matched) {
      onClick(card.id);
    }
  }, [card.id, card.flipped, card.matched, disabled, onClick]);

  return (
    <div
      className={`aspect-[3/2] rounded-md cursor-pointer transition-all duration-300 transform ${
        card.flipped ? "rotate-y-180" : ""
      } ${isJustMismatched ? "animate-shake" : ""} ${isJustMatched ? "animate-match-pulse" : ""} ${
        flipAnim === "flip" ? "animate-flip-zoom" : flipAnim === "flipback" ? "animate-flipback-zoom" : ""
      } hover:-translate-y-1 hover:shadow-lg`}
      style={{ 
        perspective: "1000px",
        WebkitTransform: "translateZ(0)",
        transform: "translateZ(0)",
        WebkitBackfaceVisibility: "hidden",
        backfaceVisibility: "hidden",
        animation: 'pop-in 260ms ease-out',
        animationDelay: `${index * 40}ms`,
        animationFillMode: 'backwards'
      }}
      onClick={handleClick}
    >
      <div
        className={`w-full h-full relative transform-style-3d transition-transform duration-500 ${
          card.flipped ? "rotate-y-180" : ""
        }`}
        style={{
          WebkitTransform: "translateZ(0)",
          transform: "translateZ(0)",
          WebkitBackfaceVisibility: "hidden",
          backfaceVisibility: "hidden"
        }}
      >
        {/* Card Back */}
        <div
          className={`absolute w-full h-full flex items-center justify-center rounded-md bg-primary-foreground border border-primary backface-hidden ${
            card.flipped ? "invisible" : "visible"
          }`}
        >
          <span className="text-primary text-2xl">?</span>
        </div>

        {/* Card Front */}
        <div
          className={`absolute w-full h-full flex items-center justify-center rounded-md bg-primary/10 border ${
            card.matched ? "border-accent" : "border-primary"
          } rotate-y-180 backface-hidden ${
            card.flipped ? "visible" : "invisible"
          }`}
        >
          <span className="text-3xl">{card.icon}</span>
        </div>
      </div>
    </div>
  );
});

const MemoryGame = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useUser();
  const location = useLocation();
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [moves, setMoves] = useState<number>(0);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [gameCompleted, setGameCompleted] = useState<boolean>(false);
  const [time, setTime] = useState<number>(0);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [showDifficulty, setShowDifficulty] = useState(false);
  const [isChangingDifficulty, setIsChangingDifficulty] = useState(false);
  const [justMatchedIds, setJustMatchedIds] = useState<number[]>([]);
  const [justMismatchedIds, setJustMismatchedIds] = useState<number[]>([]);
  
  // Use refs to avoid re-renders
  const timerRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);
  const { toast } = useToast();

  // Game schema for SEO
  const baseUrl = typeof window !== "undefined" 
    ? `${window.location.protocol}//${window.location.host}` 
    : "https://asharqgames-uat.sortd.pro";
  const gameUrl = `${baseUrl}${location.pathname}${location.search ? location.search : ""}`;
  const gameName = "Memory Game";
  
  useGameSchema(
    {
      name: gameName,
      headline: `${gameName} - Asharq Games`,
      description: "Play Memory Game to test your memory skills!",
      url: gameUrl,
      image: `${baseUrl}/assets/memory-game.jpg`,
      isAccessibleForFree: true,
    },
  );
  
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window ).webkitAudioContext!)();
    }
  }, []);

  // Create celebration sound using Web Audio API
  const playSuccessSound = useCallback(() => {
    if (!audioContextRef.current) return;

    // Create a sequence of notes for celebration
    const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
    const noteLength = 0.15;

    notes.forEach((frequency, index) => {
      const oscillator = audioContextRef.current!.createOscillator();
      const gainNode = audioContextRef.current!.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current!.destination);

      oscillator.frequency.setValueAtTime(frequency, audioContextRef.current!.currentTime);
      oscillator.type = 'sine';

      const startTime = audioContextRef.current!.currentTime + (index * noteLength);
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + noteLength);

      oscillator.start(startTime);
      oscillator.stop(startTime + noteLength);
    });
  }, []);

  const insertGameScore = useCallback(
    async (finalScore: number) => {
      const data = {
        score: finalScore,
        game_id: "0f4ecb22-914b-4c4b-993d-f65a6e6ecbd0",
        game_type: "card-pair-challenge",
        user_name: user?.username,
        user: user?.user_id,
        email:user?.email,

      };

      try {
        const res = await GamesServices.insertScore(data);
      } catch (error) {
        console.error("Failed to insert game score:", error);
      }
    },
    [user?.username, user?.user_id]
  );

  // Optimized timer that doesn't cause re-renders
  const startTimer = useCallback(() => {
    if (timerRef.current) return;
    
    timerRef.current = window.setInterval(() => {
      timeRef.current += 1;
      setTime(timeRef.current);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetGame = useCallback(() => {
    // Reset game state
    setFlippedCards([]);
    setMoves(0);
    setTime(0);
    timeRef.current = 0;
    setGameStarted(false);
    setGameCompleted(false);

    setCards((prevCards) =>
      prevCards.map((card) => ({
        ...card,
        flipped: false,
        matched: false,
      }))
    );

    stopTimer();
  }, [stopTimer]);

  // Set up game based on difficulty with smooth transition
  useEffect(() => {
    if (isChangingDifficulty) {
      // Add a small delay to prevent flickering during difficulty change
      const timer = setTimeout(() => {
        const cardCount = difficulty === "easy" ? 6 : difficulty === "medium" ? 8 : 12;
        setCards(getRandomCards(cardCount));
        resetGame();
        setIsChangingDifficulty(false);
      }, 150);
      
      return () => clearTimeout(timer);
    }
  }, [difficulty, isChangingDifficulty, resetGame]);

  // Initialize cards on first render so users see the deck immediately
  useEffect(() => {
    const cardCount = difficulty === "easy" ? 6 : difficulty === "medium" ? 8 : 12;
    setCards(getRandomCards(cardCount));
  }, []);

  // Check for game completion - memoized to prevent unnecessary re-renders
  const isGameComplete = useMemo(() => {
    return cards.length > 0 && cards.every((card) => card.matched);
  }, [cards]);

  useEffect(() => {
    if (isGameComplete && !gameCompleted) {
      initAudio();
      playSuccessSound();
      
      // Show celebration animation
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
      setGameCompleted(true);
      stopTimer();

      const finalScore = timeRef.current;
      insertGameScore(finalScore);
      
      const formattedTime = `${Math.floor(timeRef.current / 60)}:${(timeRef.current % 60).toString().padStart(2, '0')}`;
      toast({
        title: t("games.cardPairChallenge.congratulations"),
        className: "bg-green-600 text-white font-semibold border-none shadow-xl",
        description: t("games.cardPairChallenge.youCompletedTheGameInMovesAndTime", { moves, time: formattedTime }),
        variant: "default",
      });
    }
  }, [isGameComplete, gameCompleted, moves, initAudio, playSuccessSound, stopTimer, insertGameScore, toast]);

  // Handle card flipping - memoized to prevent re-renders
  const flipCard = useCallback((id: number) => {
    // Start game timer on first card flip
    if (!gameStarted) {
      setGameStarted(true);
      startTimer();
    }

    // Can't flip more than 2 cards at a time or already flipped/matched cards
    if (
      flippedCards.length >= 2 ||
      flippedCards.includes(id) ||
      cards.find((card) => card.id === id)?.matched
    ) {
      return;
    }

    // Flip the card
    setCards((prevCards) =>
      prevCards.map((card) =>
        card.id === id ? { ...card, flipped: true } : card
      )
    );

    setFlippedCards((prev) => [...prev, id]);

    // Check for matches when 2 cards are flipped
    if (flippedCards.length === 1) {
      setMoves((prevMoves) => prevMoves + 1);

      const firstCardId = flippedCards[0];
      const firstCard = cards.find((card) => card.id === firstCardId);
      const secondCard = cards.find((card) => card.id === id);

      if (firstCard?.icon === secondCard?.icon) {
        // Match found
        setJustMatchedIds([firstCardId, id]);
        setTimeout(() => {
          setCards((prevCards) =>
            prevCards.map((card) =>
              card.id === firstCardId || card.id === id
                ? { ...card, matched: true }
                : card
            )
          );
          setFlippedCards([]);
          setTimeout(() => setJustMatchedIds([]), 600);
        }, 500);
      } else {
        // No match
        setJustMismatchedIds([firstCardId, id]);
        setTimeout(() => {
          setCards((prevCards) =>
            prevCards.map((card) =>
              card.id === firstCardId || card.id === id
                ? { ...card, flipped: false }
                : card
            )
          );
          setFlippedCards([]);
          setJustMismatchedIds([]);
        }, 1000);
      }
    }
  }, [gameStarted, flippedCards, cards, startTimer]);

  const changeDifficulty = useCallback((newDifficulty: "easy" | "medium" | "hard") => {
    if (difficulty !== newDifficulty) {
      setIsChangingDifficulty(true);
      setDifficulty(newDifficulty);
    }
  }, [difficulty]);

  // Calculate grid columns based on difficulty - memoized
  const gridCols = useMemo((): string => {
    switch (difficulty) {
      case "easy":
        return "grid-cols-4";
      case "medium":
        return "grid-cols-4";
      case "hard":
        return "grid-cols-4 md:grid-cols-6";
      default:
        return "grid-cols-4";
    }
  }, [difficulty]);

  const params = useMemo(() => new URLSearchParams({
    name: "Card Pair Challenge",
    duration: "month",
    game_type: "card-pair-challenge",
    top_k: "10",
    sort_order: "asc",
    score_type: "min",
  }), []);

  const handleLeaderBoard = useCallback(() => {
    if (moves === 0 || gameCompleted) {
      navigate(`/games/leaderboard?${params.toString()}`);
    } else {
      setDialog(true);
    }
  }, [moves, gameCompleted, navigate, params]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      stopTimer();
    };
  }, [stopTimer]);

  if (!user) {
    navigate("/");
    return null;
  }

  return (
    <Layout>
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
          <div className="absolute inset-0 celebration-container">
            {/* Confetti particles with staggered timing */}
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="absolute confetti-card"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: '-20px',
                  animationDelay: `${Math.random() * 1.5}s`,
                  animationDuration: `${3 + Math.random() * 2}s`,
                }}
              >
                <div 
                  className="w-4 h-6 rounded-sm shadow-lg transform rotate-45"
                  style={{
                    backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#fd79a8', '#fdcb6e', '#6c5ce7'][Math.floor(Math.random() * 8)]
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="game-area">
        <div className="game-container">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4 px-2">
              <h1 className="text-2xl md:text-3xl font-bold">
                {t("games.cardPairChallenge.name")}
              </h1>
              {!user?.isAnonymous && (
                <Button
                onClick={handleLeaderBoard}
                className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold shadow-lg"
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span aria-label={t("common.leaderboard")}>
                      <Trophy size={18} />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{t("common.leaderboard")}</TooltipContent>
                </Tooltip>
              </Button>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row w-full gap-4">
            <div className="bg-card border border-border rounded-lg shadow-lg overflow-hidden pb-3 w-full md:w-[70%]">
              <div className="bg-muted/50 p-2 flex flex-wrap items-center justify-between gap-1 border-b border-border">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    {t("games.cardPairChallenge.moves")} : {formatNumberForDisplay(moves)}
                  </Button>

                  <Button variant="outline" size="sm">
                    <TimerDisplay time={time} />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDifficulty(true)}
                  >
                    <Settings className="mr-1 h-4 w-4" />
                    {difficulty === "easy" ? t("games.cardPairChallenge.easy") : 
                     difficulty === "medium" ? t("games.cardPairChallenge.medium") : 
                     t("games.cardPairChallenge.hard")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowInstructions(true)}
                    className="bg-muted flex items-center gap-2"
                  >
                    <HelpCircle className="mr-1 h-4 w-4" /> {t("common.help")}
                  </Button>
                </div>
              </div>

              <div className={`grid ${gridCols} gap-2 md:gap-4 max-w-sm mx-auto my-4 transition-all duration-300 ${isChangingDifficulty ? 'opacity-50' : 'opacity-100'}`}>
                {isChangingDifficulty ? (
                  <div className="col-span-full flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  cards.map((card, i) => (
                    <GameCard 
                      key={card.id}
                      card={card}
                      onClick={flipCard}
                      disabled={flippedCards.length >= 2}
                      index={i}
                      isJustMatched={justMatchedIds.includes(card.id)}
                      isJustMismatched={justMismatchedIds.includes(card.id)}
                    />
                  ))
                )}
              </div>

              <div className="text-center">
                <button className="btn-play" onClick={resetGame}>
                  {gameCompleted ? t("common.playAgain") : t("common.reset")}
                </button>
              </div>
            </div>
            
            <div className="w-full md:w-[30%]">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t("common.howToPlay")}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <div className="flex items-center gap-3 p-3 rounded-md bg-muted/40 border border-border">
                    <div className="w-8 h-8 rounded-md bg-primary/15 flex items-center justify-center">
                      <Puzzle className="text-primary" size={18} />
                    </div>
                    <p className="text-foreground">{t("games.cardPairChallenge.flipTwoMatchingCardsToMakeAPairMatchAllPairsToWin")}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs remain the same */}
      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("games.cardPairChallenge.howToPlayCardPairChallenge")}</DialogTitle>
            <DialogDescription>
              <div className="flex items-center gap-3 mt-4 p-3 rounded-md bg-muted/40 border border-border">
                <div className="w-8 h-8 rounded-md bg-primary/15 flex items-center justify-center">
                  <Puzzle className="text-primary" size={18} />
                </div>
                <p className="text-sm text-foreground">{t("games.cardPairChallenge.flipTwoMatchingCardsToMakeAPairMatchAllPairsToWin")}</p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowInstructions(false)}>{t("common.gotIt")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDifficulty} onOpenChange={setShowDifficulty}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("common.selectDifficultyLevel")}</DialogTitle>
            <DialogDescription>
              {t("games.cardPairChallenge.selectADifficultyLevelForANewGame")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 py-2">
            <Button
              variant={difficulty === "easy" ? "default" : "outline"}
              onClick={() => {
                setShowDifficulty(false);
                changeDifficulty("easy");
              }}
            >
              {t("games.cardPairChallenge.easy")}
            </Button>
            <Button
              variant={difficulty === "medium" ? "default" : "outline"}
              onClick={() => {
                setShowDifficulty(false);
                changeDifficulty("medium");
              }}
            >
              {t("games.cardPairChallenge.medium")}
            </Button>
            <Button
              variant={difficulty === "hard" ? "default" : "outline"}
              onClick={() => {
                setShowDifficulty(false);
                changeDifficulty("hard");
              }}
            >
              {t("games.cardPairChallenge.hard")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("common.leaveGame")}</DialogTitle>
            <DialogDescription>
              <div className="space-y-4 mt-4">
                <p className="text-muted-foreground mb-4">
                  {t("common.areYouSureYouWantToLeaveTheGameYourProgressWillBeLost")}
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">
            <Button onClick={() => setDialog(false)}>
              {t("common.noResume")}
            </Button>
            <Button
              className="bg-gray-500"
              onClick={() => {
                setDialog(false);
                navigate(`/games/leaderboard?${params.toString()}`);
              }}
            >
              {t("common.yesLeave")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style>{`
        .celebration-container {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .confetti-card {
          animation: confetti-fall linear forwards;
          pointer-events: none;
        }

        .celebration-text {
          animation: celebration-pulse 2s ease-in-out;
        }

        @keyframes confetti-fall {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0.3;
          }
        }

        @keyframes celebration-pulse {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            transform: translate(-50%, -50%) scale(1.1);
          }
        }

        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% {
            transform: translate3d(0, 0, 0);
          }
          40%, 43% {
            transform: translate3d(0, -10px, 0);
          }
          70% {
            transform: translate3d(0, -5px, 0);
          }
          90% {
            transform: translate3d(0, -2px, 0);
          }
        }

        .animate-bounce {
          animation: bounce 1s ease-in-out;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        /* New animations for Memory Game */
        @keyframes pop-in {
          0% { opacity: 0; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-shake {
          animation: shake 450ms ease-in-out;
        }
        @keyframes shake {
          10%, 90% { transform: translateX(-1px); }
          20%, 80% { transform: translateX(2px); }
          30%, 50%, 70% { transform: translateX(-4px); }
          40%, 60% { transform: translateX(4px); }
        }
        .animate-match-pulse {
          animation: match-pulse 600ms ease-in-out;
        }
        @keyframes match-pulse {
          0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.0); transform: scale(1); }
          50% { box-shadow: 0 0 0 8px rgba(34,197,94,0.15); transform: scale(1.04); }
          100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.0); transform: scale(1); }
        }

        /* Flip animations */
        .animate-flip-zoom { animation: flip-zoom 520ms ease both; }
        .animate-flipback-zoom { animation: flipback-zoom 520ms ease both; }
        @keyframes flip-zoom {
          0% { transform: rotateY(0deg) scale(0.98); }
          50% { transform: rotateY(90deg) scale(0.98); }
          51% { transform: rotateY(90deg) scale(1.02); }
          100% { transform: rotateY(180deg) scale(1); }
        }
        @keyframes flipback-zoom {
          0% { transform: rotateY(180deg) scale(1.02); }
          50% { transform: rotateY(90deg) scale(1.02); }
          51% { transform: rotateY(90deg) scale(0.98); }
          100% { transform: rotateY(0deg) scale(1); }
        }

        /* iPad-specific optimizations to prevent flickering */
        @media screen and (max-width: 1024px) and (orientation: portrait),
               screen and (max-width: 1024px) and (orientation: landscape) {
          .game-container {
            -webkit-transform: translateZ(0);
            transform: translateZ(0);
            -webkit-backface-visibility: hidden;
            backface-visibility: hidden;
            -webkit-perspective: 1000;
            perspective: 1000;
          }
          
          .grid {
            -webkit-transform: translateZ(0);
            transform: translateZ(0);
            will-change: auto;
          }
          
          /* Prevent flickering during grid layout changes */
          .grid > div {
            -webkit-transform: translateZ(0);
            transform: translateZ(0);
            -webkit-backface-visibility: hidden;
            backface-visibility: hidden;
          }
          
          /* Optimize transitions for touch devices */
          .transition-all {
            -webkit-transition: all 0.3s ease;
            transition: all 0.3s ease;
          }
        }
      `}</style>
    </Layout>
  );
};

export default MemoryGame;
