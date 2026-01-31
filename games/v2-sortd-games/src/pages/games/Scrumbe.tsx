
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import GamesServices from "../../../v2-services/games-service";
import { useUser } from "../../context/UserContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Check, CheckCircle, XCircle } from "lucide-react";
import UserRegistrationDialog from "../../components/UserRegistrationDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  HelpCircle,
  RefreshCw,
  Home,
  Trophy,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { useTranslation } from "react-i18next";
import { formatNumberForDisplay } from "../../utils/numberFormatter";
import { addUtmParams } from "@/lib/utils";

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

interface GameData {
  id: string;
  data: {
    headline: string;
    randomized: string[];
  };
  article_detail: {
    url: string;
    image: {
      th: string;
      o : string;
    };
  };
  article_guid: string;
}

interface ScrambleProps {
  gameData: GameData[];
}

const STORAGE_KEY = "played_games";
const SCORE_STORAGE_KEY = "accumulated_scores";
const MAX_STORED_GAMES = 10;

interface PlayedGame {
  handle_scramble: {
    gameIds: string[];
    lastGameData: string[];
    completedGames: { [gameId: string]: boolean };
  };
}

interface GameScores {
  scramble_accumulated_score: number;
  hangman_accumulated_score?: number;
  quiz_accumulated_score?: number;
}

interface ReplayDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  finalScore?: number;
  totalGames?: number;
}

const ReplayDialog: React.FC<ReplayDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  finalScore = 0,
  totalGames = 0,
}) => {
  const { t } = useTranslation();
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("games.headlineScramble.gameComplete")}</DialogTitle>
          <DialogDescription>
            <div className="space-y-4 mt-4">
              <div className="text-center bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-4 rounded-lg">
                <div className="text-2xl font-bold text-primary mb-2">
                  {t("games.headlineScramble.finalScore", { finalScore: formatNumberForDisplay(finalScore), total: formatNumberForDisplay(totalGames) })}
                </div>
                <div className="text-muted-foreground">
                  {finalScore === totalGames
                    ? t("games.headlineScramble.perfectScoreAmazingWork")
                    : finalScore > totalGames / 2
                      ? t("games.headlineScramble.greatJobWellDone")
                      : t("games.headlineScramble.goodEffortTryAgainToImprove")}
                </div>
              </div>
              <p className="text-center">{t("games.headlineScramble.wouldYouLikeToPlayAgain")}</p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            {t("games.headlineScramble.noThanks")}
          </Button>
          <Button onClick={onConfirm}>{t("games.headlineScramble.yesPlayAgain")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Scramble: React.FC<ScrambleProps> = ({ gameData }) => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const isArticleView = searchParams.get("src") === "article";
  const { user } = useUser();
  const isMobile = useIsMobile();
  const [currentGameIndex, setCurrentGameIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [accumulatedScore, setAccumulatedScore] = useState(0);
  const [draggedWord, setDraggedWord] = useState<string | null>(null);
  const [draggedFromAnswer, setDraggedFromAnswer] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [answer, setAnswer] = useState<boolean>(false);
  const [showReplayDialog, setShowReplayDialog] = useState(false);
  const [hasDeclinedReplay, setHasDeclinedReplay] = useState(false);
  const [allGamesCompleted, setAllGamesCompleted] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Audio context ref
  const audioContextRef = useRef<AudioContext | null>(null);

  const currentGame = gameData[currentGameIndex];
  const game_id = gameData[currentGameIndex]?.id;

  // Initialize audio context
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext!)();
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

  // Get accumulated score from localStorage using object structure
  const getAccumulatedScore = (): number => {
    const stored = localStorage.getItem(SCORE_STORAGE_KEY);
    if (!stored) return 0;

    try {
      const scores: GameScores = JSON.parse(stored);
      return scores.scramble_accumulated_score || 0;
    } catch {
      return 0;
    }
  };

  // Update accumulated score in localStorage using object structure
  const updateAccumulatedScore = (newScore: number) => {
    const stored = localStorage.getItem(SCORE_STORAGE_KEY);
    let scores: GameScores = { scramble_accumulated_score: 0 };

    if (stored) {
      try {
        scores = JSON.parse(stored);
      } catch {
        scores = { scramble_accumulated_score: 0 };
      }
    }

    const currentAccumulated = scores.scramble_accumulated_score || 0;
    const updatedScore = currentAccumulated + newScore;
    scores.scramble_accumulated_score = updatedScore;

    localStorage.setItem(SCORE_STORAGE_KEY, JSON.stringify(scores));
    setAccumulatedScore(updatedScore);
    return updatedScore;
  };

  // Clear accumulated score (when replaying)
  const clearAccumulatedScore = () => {
    const stored = localStorage.getItem(SCORE_STORAGE_KEY);
    let scores: GameScores = { scramble_accumulated_score: 0 };

    if (stored) {
      try {
        scores = JSON.parse(stored);
        scores.scramble_accumulated_score = 0;
        localStorage.setItem(SCORE_STORAGE_KEY, JSON.stringify(scores));
      } catch {
        localStorage.removeItem(SCORE_STORAGE_KEY);
      }
    }

    setAccumulatedScore(0);
  };

  // ... keep existing code (getPlayedGames, clearPlayedGames, addCompletedGame, checkGameDataChanged functions)

  const getPlayedGames = (): PlayedGame => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored
      ? JSON.parse(stored)
      : {
        handle_scramble: {
          gameIds: [],
          lastGameData: [],
          completedGames: {},
        },
      };
  };

  const clearPlayedGames = () => {
    localStorage.removeItem(STORAGE_KEY);
    clearAccumulatedScore();
  };

  const addCompletedGame = (gameId: string, wasCorrect: boolean) => {
    const playedGames = getPlayedGames();

    if (!playedGames.handle_scramble.gameIds.includes(gameId)) {
      const updated = [...playedGames.handle_scramble.gameIds, gameId];
      if (updated.length > MAX_STORED_GAMES) {
        updated.shift();
      }

      const updatedPlayedGames: PlayedGame = {
        handle_scramble: {
          gameIds: updated,
          lastGameData: gameData.map((game) => game.id),
          completedGames: {
            ...playedGames.handle_scramble.completedGames,
            [gameId]: wasCorrect,
          },
        },
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPlayedGames));
    }
  };

  const checkGameDataChanged = (): boolean => {
    const playedGames = getPlayedGames();
    const currentGameIds = gameData.map((game) => game.id);
    const storedGameIds = playedGames.handle_scramble.lastGameData;

    if (storedGameIds.length !== currentGameIds.length) {
      return true;
    }

    return !currentGameIds.every((id, index) => id === storedGameIds[index]);
  };

  const insertGameScore = useCallback(
    async (individualScore: number) => {
      console.log("insert");
      console.log("user", user.username + " " + game_id);
      if (!user?.username || !game_id) {
        console.log("Missing required data for score insertion");
        return;
      }

      const data = {
        score: individualScore,
        game_type: "headline_scramble",
        user_name: user.username,
        game_id: game_id,
        user: user?.user_id,
        email:user?.email,

      };

      try {
        const res = await GamesServices.insertScore(data);
        console.log("Score inserted successfully:", res);
      } catch (error) {
        console.error("Failed to insert Scramble game score:", error);
      }
    },
    [GamesServices, user?.username, game_id]
  );

  // ... keep existing code (useEffect hooks for initialization and game state management)

  useEffect(() => {
    const accumulated = getAccumulatedScore();
    setAccumulatedScore(accumulated);
  }, []);

  useEffect(() => {
    if (gameData && gameData.length > 0 && currentGame) {
      const playedGames = getPlayedGames();

      if (playedGames.handle_scramble.gameIds.length > 0) {
        const gameDataHasChanged = checkGameDataChanged();

        if (gameDataHasChanged) {
          clearPlayedGames();
          setCurrentGameIndex(0);
          setHasDeclinedReplay(false);
          setAllGamesCompleted(false);
          setScore(0);
          return;
        }
      }

      if (isArticleView) {
        return;
      }

      const completedGameIds = playedGames.handle_scramble.gameIds;
      const nextUncompletedIndex = gameData.findIndex(
        (game) => !completedGameIds.includes(game.id)
      );

      if (nextUncompletedIndex === -1) {
        setAllGamesCompleted(true);
        setShowReplayDialog(true);
      } else {
        setCurrentGameIndex(nextUncompletedIndex);
      }
    }
  }, [gameData, isArticleView, toast]);

  const handleReplayClose = () => {
    setShowReplayDialog(false);
    setHasDeclinedReplay(true);
    setAllGamesCompleted(true);
  };

  const handleReplayConfirm = () => {
    clearPlayedGames();
    setCurrentGameIndex(0);
    setHasDeclinedReplay(false);
    setAllGamesCompleted(false);
    setShowReplayDialog(false);
    setScore(0);
    resetCurrentGame();
  };
  function arraysEqual(arr1: string[], arr2: string[]): boolean {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((val, idx) => val === arr2[idx]);
  }

  function shuffleArray(arr: string[]): string[] {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  function ensureShuffled(original: string[], compareWith: string[]): string[] {
    let shuffled = shuffleArray(original);
    while (arraysEqual(shuffled, compareWith)) {
      shuffled = shuffleArray(original);
    }
    return shuffled;
  }
  useEffect(() => {
    if (currentGame) {
      const shuffleArr = shuffleArray([...currentGame.data.randomized]);
      const shuffled = ensureShuffled([...currentGame.data.randomized], shuffleArr);

      setAvailableWords(shuffled);
      setUserAnswer([]);
      setIsCompleted(false);
      setShowResult(false);
      setAnswer(false);
    }
  }, [currentGame]);

  const handleDragStart = (
    e: React.DragEvent,
    word: string,
    fromAnswer: boolean,
    index: number
  ) => {
    setDraggedWord(word);
    setDraggedFromAnswer(fromAnswer);
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (
    e: React.DragEvent,
    index: number,
    isAnswerArea: boolean
  ) => {
    e.preventDefault();
    if (
      (draggedFromAnswer && isAnswerArea) ||
      (!draggedFromAnswer && !isAnswerArea)
    ) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverIndex(null);
    }
  };

  const reorderArray = (
    array: string[],
    fromIndex: number,
    toIndex: number
  ): string[] => {
    const newArray = [...array];
    const [movedItem] = newArray.splice(fromIndex, 1);
    newArray.splice(toIndex, 0, movedItem);
    return newArray;
  };

  const handleDropToAnswer = (e: React.DragEvent, dropIndex?: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (!draggedWord) return;

    if (draggedFromAnswer) {
      if (
        dropIndex !== undefined &&
        draggedIndex !== null &&
        dropIndex !== draggedIndex
      ) {
        const reordered = reorderArray(userAnswer, draggedIndex, dropIndex);
        setUserAnswer(reordered);
      }
    } else {
      if (dropIndex !== undefined) {
        const newAnswer = [...userAnswer];
        newAnswer.splice(dropIndex, 0, draggedWord);
        setUserAnswer(newAnswer);
      } else {
        setUserAnswer([...userAnswer, draggedWord]);
      }
      setAvailableWords(availableWords.filter((word) => word !== draggedWord));
    }

    resetDragState();
  };

  const handleDropToAvailable = (e: React.DragEvent, dropIndex?: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (!draggedWord) return;

    if (!draggedFromAnswer) {
      if (
        dropIndex !== undefined &&
        draggedIndex !== null &&
        dropIndex !== draggedIndex
      ) {
        const reordered = reorderArray(availableWords, draggedIndex, dropIndex);
        setAvailableWords(reordered);
      }
    } else {
      if (dropIndex !== undefined) {
        const newAvailable = [...availableWords];
        newAvailable.splice(dropIndex, 0, draggedWord);
        setAvailableWords(newAvailable);
      } else {
        setAvailableWords([...availableWords, draggedWord]);
      }
      setUserAnswer(userAnswer.filter((word) => word !== draggedWord));
    }

    resetDragState();
  };

  const resetDragState = () => {
    setDraggedWord(null);
    setDraggedFromAnswer(false);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleWordClick = (word: string, fromAvailable: boolean) => {
    if (fromAvailable) {
      setUserAnswer([...userAnswer, word]);
      setAvailableWords(
        availableWords.filter((w, i) => i !== availableWords.indexOf(word))
      );
    } else {
      const wordIndex = userAnswer.indexOf(word);
      setUserAnswer(userAnswer.filter((_, i) => i !== wordIndex));
      setAvailableWords([...availableWords, word]);
    }
  };

  const checkAnswer = async () => {
    if (isCompleted) return;

    const userHeadline = userAnswer.join(" ").trim();
    const correctHeadline = currentGame.data.randomized.join(" ").trim();
    const isCorrect =
      userHeadline.toLowerCase() === correctHeadline.toLowerCase();

    setIsCompleted(true);
    setShowResult(true);

    addCompletedGame(currentGame.id, isCorrect);

    if (isCorrect) {
      // Initialize audio and play success sound
      initAudio();
      playSuccessSound();

      // Show celebration animation
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);

      setAnswer(true);
      setScore((prevScore) => prevScore + 1);

      await insertGameScore(1);

      const newAccumulatedScore = updateAccumulatedScore(1);

      toast({
        title: t("games.headlineScramble.correct"),
        description: t("games.headlineScramble.youUnscrambledTheHeadlinePerfectly"),
        className:
          "bg-green-600 text-white font-semibold border-none shadow-xl",
        duration: 3000,
      });
    } else {
      setAnswer(false);

      await insertGameScore(0);

      toast({
        title: t("games.headlineScramble.notQuiteRight"),
        description: t("games.headlineScramble.dontWorryTryTheNextOne"),
        className: "bg-red-500 text-white font-semibold border-none shadow-xl",
        duration: 3000,
      });
    }
  };

  // ... keep existing code (remaining handler functions)

  // Fixed leaderboard redirect after registration
  const handleUserRegistrationSuccess = async (newUser: {
    username: string;
  }) => {
    await insertGameScore(score);
    // Always redirect to leaderboard after successful registration
    window.location.href = leaderboardUrl;
  };

  const leaderboardUrl = isArticleView
    ? `/leaderboard?${new URLSearchParams({
      name: "HeadLine Scramble",
      duration: "month",
      game_type: "headline_scramble",
      top_k: "10",
      sort_order: "desc",
      score_type: "sum",
    }).toString()}`
    : `/leaderboard?${new URLSearchParams({
      name: "HeadLine Scramble",
      duration: "month",
      game_type: "headline_scramble",
      top_k: "10",
      sort_order: "desc",
      score_type: "sum",
    }).toString()}`;

  const nextHeadline = () => {
    setAnswer(false);

    if (isArticleView) {
      const nextIndex = currentGameIndex + 1;
      if (nextIndex < gameData.length) {
        setCurrentGameIndex(nextIndex);
      } else {
        setAllGamesCompleted(true);
        setShowReplayDialog(true);
      }
      return;
    }

    const playedGames = getPlayedGames();
    const completedGameIds = playedGames.handle_scramble.gameIds;

    const nextUncompletedIndex = gameData.findIndex(
      (game, index) =>
        index > currentGameIndex && !completedGameIds.includes(game.id)
    );

    if (nextUncompletedIndex !== -1) {
      setCurrentGameIndex(nextUncompletedIndex);
    } else {
      setAllGamesCompleted(true);
      setShowReplayDialog(true);
    }
  };

  const resetCurrentGame = () => {
    if (currentGame) {
      const shuffled = [...currentGame.data.randomized].sort(
        () => Math.random() - 0.5
      );
      setAvailableWords(shuffled);
      setUserAnswer([]);
      setIsCompleted(false);
      setShowResult(false);
      setAnswer(false);
    }
  };

  if (!user && !isArticleView) {
    navigate("/");
  }

  if (!currentGame) {
    const scrambleGame = (
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">{t("games.headlineScramble.noGameDataAvailable")}</h1>
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          {t("games.headlineScramble.backToHome")}
        </button>
      </div>
    );

    return isArticleView ? scrambleGame : <Layout>{scrambleGame}</Layout>;
  }

  const scrambleGame = (
    <div className="game-area relative">
      {/* Enhanced Celebration Animation */}
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

            {/* Celebration text overlay */}

          </div>
        </div>
      )}

      <div className="game-container">
        {/* Header Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4 px-2">
            <h1 className="text-2xl md:text-3xl font-bold">
              {t("games.headlineScramble.name")}
            </h1>

            {isArticleView ? (
              <a
                href="#"
                className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold shadow-lg rounded-md px-3 py-2 flex items-center"
                onClick={(e) => {
                  e.preventDefault();
                  if (!user?.username) {
                    setShowDialog(true);
                  } else {
                    window.location.href = leaderboardUrl;
                  }
                }}
                rel="noopener noreferrer"
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span aria-label={t("common.leaderboard")}>
                      <Trophy size={18} />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{t("common.leaderboard")}</TooltipContent>
                </Tooltip>
              </a>
            ) : (
              <Button
                onClick={() => navigate(leaderboardUrl)}
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

        {/* All Games Completed Message */}
        {allGamesCompleted && hasDeclinedReplay && !isArticleView && (
          <div className="mb-6 bg-card border border-border p-6 rounded-lg shadow-lg text-center">
            <h3 className="text-2xl font-semibold mb-4 text-primary">
              {t("games.headlineScramble.allGamesCompleted")}
            </h3>
            <div className="text-center bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-4 rounded-lg mb-4">
              <div className="text-xl font-semibold text-secondary mb-2">
                {t("games.headlineScramble.totalScore", { score: formatNumberForDisplay(accumulatedScore) })}
              </div>
              <div className="text-muted-foreground">
                {score === gameData.length
                  ? t("games.headlineScramble.perfectSessionAmazingWork")
                  : score > gameData.length / 2
                    ? t("games.headlineScramble.greatSessionWellDone")
                    : t("games.headlineScramble.goodEffortTryAgainToImprove")}
              </div>
            </div>
            <p className="text-muted-foreground mb-6">
              {t("games.headlineScramble.youveFinishedAllAvailableGamesWellAddNewGamesSoon")}
            </p>
            <div className="space-y-3">
              <Button
                onClick={handleReplayConfirm}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-full transition-colors"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {t("games.headlineScramble.replayTheseGames")}
              </Button>
              <p className="text-sm text-muted-foreground">
                {t("games.headlineScramble.orWaitForNewGamesToBeAdded")}
              </p>
            </div>
          </div>
        )}

        {/* Game Content */}
        {!(allGamesCompleted && hasDeclinedReplay && !isArticleView) && (
          <div className="flex flex-col md:flex-row w-full gap-4">
            <div className="bg-card border border-border rounded-lg shadow-lg overflow-hidden pb-3 w-full md:w-[70%]">
              <div className="bg-muted/50 p-2 flex flex-wrap items-center justify-between gap-1 border-b border-border">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    {t("games.headlineScramble.totalAccumulatedScore", { score: formatNumberForDisplay(accumulatedScore) })}
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    {t("games.headlineScramble.round", { current: formatNumberForDisplay(currentGameIndex + 1), total: formatNumberForDisplay(gameData.length) })}
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

              {/* User's Answer Area */}
              <div className="px-3 py-2">
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  {t("games.headlineScramble.yourAnswer")}{" "}
                  {isCompleted &&
                    (answer ? (
                      <CheckCircle className="text-green-600 w-5 h-5 animate-pulse" />
                    ) : (
                      <XCircle className="text-red-500 w-5 h-5" />
                    ))}
                </h3>
                <div
                  className={`h-32 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 overflow-y-auto transition-all duration-300 hover:border-blue-400 dark:hover:border-blue-500 ${answer && isCompleted ? 'animate-pulse bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-400' : ''
                    }`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropToAnswer(e)}
                  onDragLeave={handleDragLeave}
                >
                  {userAnswer.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-400 italic text-center">
                        {t("games.headlineScramble.dragWordsHereOrClickWordsBelowToBuildYourHeadline")}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 content-start">
                      {userAnswer.map((word, index) => (
                        <button
                          key={`answer-${index}`}
                          onClick={() => handleWordClick(word, false)}
                          draggable={!isCompleted}
                          onDragStart={(e) =>
                            handleDragStart(e, word, true, index)
                          }
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDropToAnswer(e, index)}
                          onDragEnter={(e) => handleDragEnter(e, index, true)}
                          onDragLeave={handleDragLeave}
                          className={`px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md transform hover:scale-105 cursor-move select-none ${dragOverIndex === index && draggedFromAnswer
                            ? "ring-2 ring-blue-300 ring-offset-2"
                            : ""
                            } ${answer && isCompleted ? 'animate-bounce' : ''
                            }`}
                          disabled={isCompleted}
                        >
                          {word}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {!showResult && (
                <div className="px-3 py-2">
                  <div
                    className="h-32 p-4 border-2 border-solid border-gray-200 dark:border-gray-700 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 overflow-y-auto transition-colors hover:border-green-400 dark:hover:border-green-500"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDropToAvailable(e)}
                    onDragLeave={handleDragLeave}
                  >
                    <div className="flex flex-wrap gap-2 content-start">
                      {availableWords.map((word, index) => (
                        <button
                          key={`available-${index}`}
                          onClick={() => handleWordClick(word, true)}
                          draggable={!isCompleted}
                          onDragStart={(e) =>
                            handleDragStart(e, word, false, index)
                          }
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDropToAvailable(e, index)}
                          onDragEnter={(e) => handleDragEnter(e, index, false)}
                          onDragLeave={handleDragLeave}
                          className={`px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md transform hover:scale-105 cursor-move select-none ${dragOverIndex === index && !draggedFromAnswer
                            ? "ring-2 ring-green-300 ring-offset-2"
                            : ""
                            }`}
                          disabled={isCompleted}
                        >
                          {word}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Result Display */}
              {showResult && !isArticleView && currentGame?.article_detail && (
                <a
                  href={addUtmParams(currentGame?.article_detail?.url || "")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex mb-4 items-start gap-4 p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 hover:shadow-md transition-shadow"
                >
                  <div className="w-24 sm:w-28 md:w-32 lg:w-40 flex items-center justify-center h-[80px] sm:h-[100px]">
                    <img
                      src={currentGame?.article_detail?.image?.o}
                      alt="Article thumbnail"
                      className="h-full w-full object-cover rounded-md"
                      onError={(e) => {
                        e.currentTarget.onerror = null; // Prevent looping
                        e.currentTarget.src =
                          "https://idea410.digital.uic.edu/wp-content/themes/koji/assets/images/default-fallback-image.png"; // Replace with your fallback image path
                      }}
                    />
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold mb-1 text-blue-900 dark:text-blue-100">
                      {t("games.headlineScramble.readMoreAboutArticle")}{" "}
                    </h3>
                    <p className="text-blue-800 dark:text-blue-200 font-medium leading-relaxed hover:underline cursor-pointer">
                      {currentGame?.data?.headline}
                      <span className="ml-2 align-middle inline-block">
                        <ExternalLink
                          className="w-5 h-5 text-primary mb-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(
                              addUtmParams(currentGame?.article_detail?.url || ""),
                              "_blank"
                            );
                          }}
                        />
                      </span>
                    </p>
                  </div>
                </a>
              )}

              {showResult && isArticleView && (
                <div className="flex mb-4 items-start gap-4 p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 hover:shadow-md transition-shadow">
                  <p className="text-blue-800 dark:text-blue-200 font-medium leading-relaxed">
                    {currentGame?.data?.headline}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 justify-center">
                {!isCompleted ? (
                  <>
                    <button
                      onClick={checkAnswer}
                      disabled={userAnswer.length === 0}
                      className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <Check size={18} />
                      {t("games.headlineScramble.submit")}
                    </button>

                    <button
                      onClick={resetCurrentGame}
                      className="flex items-center gap-2 px-5 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      {t("games.headlineScramble.reset")}
                    </button>
                  </>
                ) : !isArticleView ? (
                  <button
                    onClick={nextHeadline}
                    className="px-8 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    {t("games.headlineScramble.next")}
                  </button>
                ) : (
                  <button
                    onClick={handleReplayConfirm}
                    className="px-8 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    {t("games.headlineScramble.playAgain")}
                  </button>
                )}
              </div>
            </div>

            <div className="w-full md:w-[30%]">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t("games.headlineScramble.howToPlay")}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <p className="text-muted-foreground mb-4">
                    {t("games.headlineScramble.dragAndDropWordsToUnscrambleTheNewsHeadlinesYouCanAlsoReorderWordsWithinEachArea")}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("games.headlineScramble.howToPlayHeadlineScrambleGame")}</DialogTitle>
              <DialogDescription>
                <div className="space-y-4 mt-4">
                  <p className="text-muted-foreground mb-4">
                    {t("games.headlineScramble.dragAndDropWordsToUnscrambleTheNewsHeadlinesYouCanAlsoReorderWordsWithinEachArea")}
                  </p>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => setShowInstructions(false)}>{t("games.headlineScramble.gotIt")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <UserRegistrationDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        onSuccess={handleUserRegistrationSuccess}
        title={t("games.headlineScramble.fillTheDetailsToShowLeaderboard")}
      />
      <ReplayDialog
        isOpen={showReplayDialog}
        onClose={handleReplayClose}
        onConfirm={handleReplayConfirm}
        finalScore={accumulatedScore}
        totalGames={gameData.length}
      />

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
      `}</style>
    </div>
  );

  return isArticleView ? scrambleGame : <Layout>{scrambleGame}</Layout>;
};

export default Scramble;
