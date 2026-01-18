import React, { useState, useEffect, useCallback } from "react";
import Layout from "../../components/Layout";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArchiveRestore, ExternalLink } from "lucide-react";

import {
  Check,
  ArrowLeft,
  RotateCcw,
  Trophy,
  Home,
  ArrowRight,
  Crown,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import GamesServices from "../../../v2-services/games-service";
import { useUser } from "../../context/UserContext";
import LeaderboardModal from "./LeaderboardModal";
import { useTranslation } from "react-i18next";
import { formatNumberForDisplay } from "../../utils/numberFormatter";
import { addUtmParams } from "@/lib/utils";

import UserRegistrationDialog from "../../components/UserRegistrationDialog";
import LeaderBoard from "./ArticleLeaderboard";

interface Question {
  question: string;
  a: string;
  b: string;
  c: string;
  d: string;
  answer: string;
}

interface GameData {
  id: string;
  data: {
    title: string;
    questions: Question[];
  };
  article_detail: {
    url: string;
    link: string;     
    image_url: string;
  };
  article_guid: string;
}

interface QuizProps {
  gameData: GameData[];
  article?: boolean;
  hideArticleLink?: boolean;
  nameOverride?: string;
  gameTypeOverride?: string;
}

interface UserAnswer {
  questionIndex: number;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  question: string;
  options: { a: string; b: string; c: string; d: string };
}

interface PlayedGame {
  handle_scramble: {
    gameIds: string[];
    lastGameData: string[];
    completedGames: { [gameId: string]: boolean };
  };
  hangman: {
    gameIds: string[];
    lastGameData: string[];
    completedGames: { [gameId: string]: boolean };
  };
  quiz: {
    gameIds: string[];
    lastGameData: string[];
    completedGames: { [gameId: string]: boolean };
  };
}

interface AccumulatedScores {
  hangman: number;
  handle_scramble: number;
  quiz: number;
}

interface InterruptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentScore?: number;
  totalQuestions?: number;
  type?: "leaderboard" | "restart";
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
  const [searchParams] = useSearchParams();
  const isArticleView = searchParams.get("src") === "article";

  if (isOpen && isArticleView) {
    onConfirm();
    return null;
  }
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("quiz.allGamesComplete")}</DialogTitle>
          <DialogDescription>
            <div className="space-y-4 mt-4">
              <div className="text-center bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-4 rounded-lg">
                <div className="text-2xl font-bold text-primary mb-2">
                  {t("quiz.finalScore", { finalScore: formatNumberForDisplay(finalScore), total: formatNumberForDisplay(totalGames * 5) })}
                </div>
                <div className="text-muted-foreground">
                  {finalScore === totalGames
                    ? t("quiz.perfectScoreAmazingWork")
                    : finalScore > (totalGames * 5) / 2
                    ? t("quiz.greatJobWellDone")
                    : t("quiz.goodEffortTryAgainToImprove")}
                </div>
              </div>
              <p className="text-center">
                {t("quiz.wouldYouLikeToPlayAllGamesAgain")}
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            {t("quiz.noThanks")}
          </Button>
          <Button onClick={onConfirm}>{t("quiz.yesPlayAgain")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const InterruptDialog: React.FC<InterruptDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentScore = 0,
  totalQuestions = 0,
  type = "restart",
}) => {
  const { t } = useTranslation();
  const isLeaderboardType = type === "leaderboard";
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isLeaderboardType ? t("quiz.leaveCurrentGame") : t("quiz.stopCurrentGame")}
          </DialogTitle>
          <DialogDescription>
            <div className="space-y-4 mt-4">
              <div className="text-center bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 p-4 rounded-lg">
                <div className="text-lg font-semibold text-primary mb-2">
                  {t("quiz.currentProgress", { current: formatNumberForDisplay(currentScore), total: formatNumberForDisplay(totalQuestions) })}
                </div>
                <div className="text-muted-foreground">
                  {t("quiz.youHaveAnOngoingQuizGame")}
                </div>
              </div>
              <p className="text-center">
                {isLeaderboardType
                  ? t("quiz.goingToLeaderboardWillStopYourCurrentProgressDoYouWantToContinue")
                  : t("quiz.startingANewQuizWillStopYourCurrentProgressDoYouWantToContinue")}
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2">
          <Button onClick={onClose}>{t("common.cancel")}</Button>
          <Button onClick={onConfirm} variant="outline">
            {isLeaderboardType
              ? t("quiz.yesGoToLeaderboard")
              : t("quiz.yesStartNewQuiz")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const STORAGE_KEY = "played_games";
const SCORE_STORAGE_KEY = "accumulated_scores";
const MAX_STORED_GAMES = 10;

const Quiz: React.FC<QuizProps> = ({ gameData, article = false, hideArticleLink = false, nameOverride, gameTypeOverride }) => {
  const { t } = useTranslation();
  const { user } = useUser();
  const [searchParams] = useSearchParams();
  const isArticleView = searchParams.get("src") === "article";
  const [currentGameIndex, setCurrentGameIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [isAnswered, setIsAnswered] = useState(false);
  const [sessionScore, setSessionScore] = useState(0);
  const [accumulatedScore, setAccumulatedScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [allGamesCompleted, setAllGamesCompleted] = useState(false);
  const [hasDeclinedReplay, setHasDeclinedReplay] = useState(false);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [currentGameScore, setCurrentGameScore] = useState(0);
  const [showDialog, setShowDialog] = useState(false);
  const [showInterruptDialog, setShowInterruptDialog] = useState(false);
  const [showReplayDialog, setShowReplayDialog] = useState(false);
  const [interruptType, setInterruptType] = useState<"leaderboard" | "restart">(
    "restart"
  );
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const currentGame = gameData[currentGameIndex];
  const currentQuestion = currentGame?.data.questions[currentQuestionIndex];
  const totalQuestions = currentGame?.data.questions.length || 0;

  const getAccumulatedScores = (): AccumulatedScores => {
    try {
      const stored = localStorage.getItem(SCORE_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error(
        "Error reading accumulated scores from localStorage:",
        error
      );
    }

    return {
      hangman: 0,
      handle_scramble: 0,
      quiz: 0,
    };
  };

  const updateAccumulatedScore = (
    gameType: string,
    newScore: number
  ): number => {
    const currentScores = getAccumulatedScores();
    const updatedScores = {
      ...currentScores,
      [gameType]:
        (currentScores[gameType as keyof AccumulatedScores] || 0) + newScore,
    };

    try {
      localStorage.setItem(SCORE_STORAGE_KEY, JSON.stringify(updatedScores));
      const newAccumulatedScore = updatedScores.quiz;
      setAccumulatedScore(newAccumulatedScore);
      console.log("Updated accumulated score:", newAccumulatedScore);
      return newAccumulatedScore;
    } catch (error) {
      console.error("Error saving accumulated scores to localStorage:", error);
      return currentScores.quiz || 0;
    }
  };

  const getPlayedGames = (): PlayedGame => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (!parsed.quiz) {
          parsed.quiz = {
            gameIds: [],
            lastGameData: [],
            completedGames: {},
          };
        }
        return parsed;
      }
    } catch (error) {
      console.error("Error reading from localStorage:", error);
    }

    return {
      handle_scramble: {
        gameIds: [],
        lastGameData: [],
        completedGames: {},
      },
      hangman: {
        gameIds: [],
        lastGameData: [],
        completedGames: {},
      },
      quiz: {
        gameIds: [],
        lastGameData: [],
        completedGames: {},
      },
    };
  };

  const savePlayedGames = (playedGames: PlayedGame) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(playedGames));
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  };

  const clearPlayedGames = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SCORE_STORAGE_KEY);
    setAccumulatedScore(0);
    setSessionScore(0);
  };

  const checkGameDataChanged = (): boolean => {
    const playedGames = getPlayedGames();
    const currentGameIds = gameData.map((game) => game.id);
    const storedGameIds = playedGames.quiz.lastGameData || [];

    if (storedGameIds.length !== currentGameIds.length) {
      return true;
    }

    return !currentGameIds.every((id, index) => id === storedGameIds[index]);
  };

  const markGameAsPlayed = (gameId: string, score: number) => {
    const playedGames = getPlayedGames();

    if (!playedGames.quiz.gameIds.includes(gameId)) {
      playedGames.quiz.gameIds.push(gameId);
    }

    playedGames.quiz.completedGames[gameId] = true;
    playedGames.quiz.lastGameData = gameData.map((game) => game.id);

    savePlayedGames(playedGames);

    const newAccumulatedScore = updateAccumulatedScore("quiz", score);
    const newSessionScore = sessionScore + score;
    setSessionScore(newSessionScore);

    console.log(
      "Game completed - Current game score:",
      score,
      "New session score:",
      newSessionScore,
      "New accumulated score:",
      newAccumulatedScore
    );
  };

  const isGamePlayed = (gameId: string): boolean => {
    const playedGames = getPlayedGames();
    return playedGames.quiz.completedGames[gameId] || false;
  };

  const handleReplayClose = () => {
    setShowReplayDialog(false);
    setHasDeclinedReplay(true);
    setAllGamesCompleted(true);
  };

  const handleReplayConfirm = () => {
    if (isArticleView) {
      // In article view, directly start the game without showing interrupt dialog
      clearPlayedGames();
      setCurrentGameIndex(0);
      setHasDeclinedReplay(false);
      setAllGamesCompleted(false);
      setShowReplayDialog(false);
      resetCurrentGame();
    } else {
      clearPlayedGames();
      setCurrentGameIndex(0);
      setHasDeclinedReplay(false);
      setAllGamesCompleted(false);
      setShowReplayDialog(false);
      resetCurrentGame();
    }
  };

  const resetCurrentGame = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer("");
    setIsAnswered(false);
    setShowResult(false);
    setGameCompleted(false);
    setUserAnswers([]);
    setCurrentGameScore(0);
  };

  // Check if user is in the middle of a game
  const isGameInProgress = () => {
    return !gameCompleted && (currentQuestionIndex > 0 || isAnswered);
  };

  // Initialize game state
  useEffect(() => {
    if (gameData && gameData.length > 0) {
      const scores = getAccumulatedScores();
      setAccumulatedScore(scores.quiz);

      const playedGames = getPlayedGames();

      if (playedGames.quiz.gameIds.length > 0) {
        const gameDataHasChanged = checkGameDataChanged();

        if (gameDataHasChanged) {
          clearPlayedGames();
          setCurrentGameIndex(0);
          setHasDeclinedReplay(false);
          setAllGamesCompleted(false);
          return;
        }
      }

      if (isArticleView) {
        return;
      }

      const completedGameIds = playedGames.quiz.gameIds;
      const nextUncompletedIndex = gameData.findIndex(
        (game) => !completedGameIds.includes(game.id)
      );

      if (nextUncompletedIndex === -1) {
        setAllGamesCompleted(true);
        if (!hasDeclinedReplay) {
          setShowReplayDialog(true);
        }
      } else {
        setCurrentGameIndex(nextUncompletedIndex);
      }
    }
  }, [gameData, isArticleView]);

  const insertGameScore = useCallback(
    async (finalScore: number) => {
      const data = {
        score: finalScore,
        game_type: gameTypeOverride || "quiz",
        user_name: user?.username,
        game_id: gameData[currentGameIndex]?.id,
        email:user?.email,

      };

      try {
        const res = await GamesServices.insertScore(data);
        console.log("Score inserted successfully:", finalScore);
      } catch (error) {
        console.error("Failed to insert quiz game score:", error);
      }
    },
    [user?.username, gameData, currentGameIndex]
  );

  useEffect(() => {
    if (currentGame) {
      resetCurrentGame();
    }
  }, [currentGameIndex]);

  const handleAnswerSelect = (answer: string) => {
    if (isAnswered || !answer) return;

    setSelectedAnswer(answer);

    const isCorrect = answer === currentQuestion.answer;

    setIsAnswered(true);
    setShowResult(true);

    const userAnswer: UserAnswer = {
      questionIndex: currentQuestionIndex,
      selectedAnswer: currentQuestion[answer as keyof Question] as string,
      correctAnswer: currentQuestion[
        currentQuestion.answer as keyof Question
      ] as string,
      isCorrect,
      question: currentQuestion.question,
      options: {
        a: currentQuestion.a,
        b: currentQuestion.b,
        c: currentQuestion.c,
        d: currentQuestion.d,
      },
    };
    setUserAnswers((prev) => [...prev, userAnswer]);

    const newGameScore = isCorrect ? currentGameScore + 1 : currentGameScore;
    setCurrentGameScore(newGameScore);

    console.log(
      "Answer selected - Correct:",
      isCorrect,
      "New game score:",
      newGameScore
    );

    setTimeout(() => {
      nextQuestion(newGameScore);
    }, 1000);
  };

  const nextQuestion = async (finalGameScore?: number) => {
    const scoreToUse = finalGameScore ?? currentGameScore;

    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer("");
      setIsAnswered(false);
      setShowResult(false);
    } else {
      setGameCompleted(true);

      console.log("Game completing with score:", scoreToUse);

      markGameAsPlayed(currentGame.id, scoreToUse);

      await insertGameScore(scoreToUse);

      if (currentGameIndex >= gameData.length - 1) {
        setAllGamesCompleted(true);
        setShowReplayDialog(true);
      }
    }
  };

  const nextGame = () => {
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
    const completedGameIds = playedGames.quiz.gameIds;

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

  const resetQuiz = () => {
    if (isArticleView) {
      // In article view, directly reset and start the game
      clearPlayedGames();
      setCurrentGameIndex(0);
      setCurrentQuestionIndex(0);
      setSelectedAnswer("");
      setIsAnswered(false);
      setSessionScore(0);
      setShowResult(false);
      setGameCompleted(false);
      setAllGamesCompleted(false);
      setHasDeclinedReplay(false);
      setUserAnswers([]);
      setCurrentGameScore(0);
      setShowInterruptDialog(false);
    } else {
      // In non-article view, check if game is in progress
      if (isGameInProgress()) {
        setInterruptType("restart");
        setShowInterruptDialog(true);
      } else {
        clearPlayedGames();
        setCurrentGameIndex(0);
        setCurrentQuestionIndex(0);
        setSelectedAnswer("");
        setIsAnswered(false);
        setSessionScore(0);
        setShowResult(false);
        setGameCompleted(false);
        setAllGamesCompleted(false);
        setHasDeclinedReplay(false);
        setUserAnswers([]);
        setCurrentGameScore(0);
      }
    }
  };

  const handleUserRegistrationSuccess = async (newUser: {
    username: string;
  }) => {
    await insertGameScore(sessionScore);
  };

  const leaderboardName = nameOverride || "Quiz";
  const leaderboardGameType = gameTypeOverride || "quiz";
  const leaderboardUrl = isArticleView
    ? `/leaderboard?${new URLSearchParams({
        name: leaderboardName,
        duration: "month",
        game_type: leaderboardGameType,
        top_k: "10",
        sort_order: "desc",
        score_type: "max",
      }).toString()}`
    : `/games/leaderboard?${new URLSearchParams({
        name: leaderboardName,
        duration: "month",
        game_type: leaderboardGameType,
        top_k: "10",
        sort_order: "desc",
        score_type: "max",
      }).toString()}`;

  const handleLeaderboardClick = (e: React.MouseEvent) => {
    e.preventDefault();

    if (isGameInProgress()) {
      setInterruptType("leaderboard");
      setShowInterruptDialog(true);
    } else {
      if (!user?.username) {
        setShowDialog(true);
      } else {
        if (isArticleView) {
          window.location.href = leaderboardUrl;
        } else {
          navigate(leaderboardUrl);
        }
      }
    }
  };

  const getOptionClass = (option: string) => {
    let baseClass =
      "w-full py-2 px-4 text-left rounded-lg border transition-all font-medium ";

    if (!isAnswered) {
      if (selectedAnswer === option) {
        baseClass +=
          "border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300";
      } else {
        baseClass +=
          "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800";
      }
    } else {
      if (option === currentQuestion.answer) {
        baseClass +=
          "border-green-500 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300";
      } else if (selectedAnswer === option) {
        baseClass +=
          "border-red-500 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300";
      } else {
        baseClass +=
          "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60";
      }
    }

    return baseClass;
  };

  const handleInterruptConfirm = () => {
    setShowInterruptDialog(false);

    if (interruptType === "leaderboard") {
      // Navigate to leaderboard
      if (!user?.username) {
        setShowDialog(true);
      } else {
        if (isArticleView) {
          window.location.href = leaderboardUrl;
        } else {
          navigate(leaderboardUrl);
        }
      }
    } else {
      // Reset quiz
      clearPlayedGames();
      setCurrentGameIndex(0);
      setCurrentQuestionIndex(0);
      setSelectedAnswer("");
      setIsAnswered(false);
      setSessionScore(0);
      setShowResult(false);
      setGameCompleted(false);
      setAllGamesCompleted(false);
      setHasDeclinedReplay(false);
      setUserAnswers([]);
      setCurrentGameScore(0);
    }
  };

  if (!user && !isArticleView) {
    navigate("/");
  }

  if (!currentGame) {
    const content = (
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">{t("quiz.noQuizDataAvailable")}</h1>
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          {t("quiz.backToHome")}
        </button>
      </div>
    );
    return isArticleView ? content : <Layout>{content}</Layout>;
  }

  if (gameCompleted && isArticleView) {
    return (
      <div className="game-area">
        <div className="game-container">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full mb-6 shadow-lg">
              <Crown className="text-white" size={32} />
            </div>
            <h1 className="text-4xl font-bold text-primary mb-4">
              {t("quiz.quizComplete")}
            </h1>
            <div className="flex flex-wrap gap-3 justify-center mb-3">
              {!user?.isAnonymous && (
              <a
                href="#"
                className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold shadow-lg rounded-md px-3 py-2 flex items-center"
                onClick={handleLeaderboardClick}
                rel="noopener noreferrer"
              >
                {t("quiz.leaderBoard")}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span aria-label={t("common.leaderboard")}>
                      <Trophy className="ml-2" size={18} />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{t("common.leaderboard")}</TooltipContent>
                </Tooltip>
              </a>
              )}
              <button
                onClick={() => resetQuiz()}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-green-600 to-green-600 text-white rounded-xl hover:from-green-700 hover:to-green-700 transition-all font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <ArchiveRestore size={18} />
                {t("quiz.replay")}
              </button>
            </div>
            <div className="bg-primary/10 rounded-lg p-6 mb-6">
              <h2 className="text-2xl font-bold mb-2">{t("quiz.yourScore")}</h2>
              <p className="text-3xl font-bold text-primary">
                {currentGameScore} / {userAnswers.length}
              </p>
              <p className="text-muted-foreground mt-2">
                {userAnswers.length > 0
                  ? ((currentGameScore / userAnswers.length) * 100).toFixed(0)
                  : 0}
                {t("quiz.correct")}
              </p>
            </div>
            <p className="text-lg text-muted-foreground">
              "{currentGame.data.title}" {t("quiz.completed")}
            </p>
          </div>
        </div>

        <UserRegistrationDialog
          isOpen={showDialog}
          onClose={() => setShowDialog(false)}
          onSuccess={handleUserRegistrationSuccess}
        />
      </div>
    );
  }

  if (gameCompleted && !isArticleView) {
    const hasMoreGames = currentGameIndex < gameData.length - 1;

    const game = (
      <div className="game-area">
        <div className="game-container">
          <div className="text-center mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-primary mb-4">
              {t("quiz.quizComplete")}
            </h1>
            <div className="flex flex-wrap gap-3 justify-center mb-3">
              {!user?.isAnonymous && (
              <Button
                onClick={handleLeaderboardClick}
                className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold shadow-lg"
              >
                {t("quiz.leaderBoard")}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span aria-label={t("common.leaderboard")}>
                      <Trophy className="ml-2" size={18} />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{t("common.leaderboard")}</TooltipContent>
                </Tooltip>
              </Button>
              )}
              {hasMoreGames && (
                <button
                  onClick={nextGame}
                  className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700  transition-all font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <ArrowRight size={18} />
                  {t("quiz.nextQuiz")}
                </button>
              )}
            </div>
            <div className="bg-primary/10 rounded-lg p-2 mb-4">
              <h2 className="text-xl flex gap-2 justify-center font-semibold mb-2">
                {t("quiz.yourScore")} :{" "}
                <p className="text-xl font-bold text-primary">
                  {" "}
                  {formatNumberForDisplay(currentGameScore)}/{formatNumberForDisplay(userAnswers.length)}
                </p>
                <span className="text-sm text-muted-foreground self-center">
                  (
                  {userAnswers.length > 0
                    ? formatNumberForDisplay(((currentGameScore / userAnswers.length) * 100).toFixed(0))
                    : formatNumberForDisplay(0)}
                  {t("quiz.correct")})
                </span>
              </h2>
            </div>
            <p className="text-md text-muted-foreground">
              "{currentGame.data.title}" {t("quiz.completed")}
            </p>
          </div>

          <div className="space-y-2 mb-5">
            {userAnswers.map((answer, index) => (
              <div
                key={index}
                className="bg-card rounded-lg p-2 shadow-lg border"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    {t("quiz.questionNumber", { number: formatNumberForDisplay(index + 1) })}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-bold ${
                      answer.isCorrect
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                    }`}
                  >
                    {answer.isCorrect ? t("quiz.correctAnswer") : t("quiz.incorrectAnswer")}
                  </span>
                </div>

                <p className="text-sm mb-2">{answer.question}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                  {Object.entries(answer.options).map(([key, value]) => (
                    <div
                      key={key}
                      className={`p-2 rounded-lg border text-sm ${
                        value === answer.correctAnswer
                          ? "border-green-500 bg-green-50 dark:bg-green-950/30"
                          : value === answer.selectedAnswer && !answer.isCorrect
                          ? "border-red-500 bg-red-50 dark:bg-red-950/30"
                          : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                      }`}
                    >
                      <span className="">{key.toUpperCase()}. </span>
                      {value}
                      {value === answer.correctAnswer && (
                        <span className="ml-2 text-green-600">{t("quiz.correctMark")}</span>
                      )}
                      {value === answer.selectedAnswer && !answer.isCorrect && (
                        <span className="ml-2 text-red-600">{t("quiz.yourAnswerMark")}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
    return isArticleView ? game : <Layout>{game}</Layout>;
  }

  const quizContentWithFixedButton = (
    <div className="game-area">
      <div className="game-container">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4 px-2">
            {isMobile && isArticleView && (
              <button
                onClick={() => (window.location.href = window.location.origin)}
                className=" bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-full transition-colors"
                aria-label="Go to Home"
              >
                <Home
                  size={20}
                  className="text-slate-600 dark:text-slate-300"
                />
              </button>
            )}
            <h1 className="text-2xl md:text-3xl font-bold">{t("quiz.quiz")}</h1>
            {!user?.isAnonymous && (
            isArticleView ? (
              <a
                href="#"
                className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold shadow-lg rounded-md px-3 py-2 flex items-center"
                onClick={handleLeaderboardClick}
                rel="noopener noreferrer"
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span aria-label="Leaderboard">
                      <Trophy size={18} />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Leaderboard</TooltipContent>
                </Tooltip>
              </a>
            ) : (
              <Button
                onClick={handleLeaderboardClick}
                className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold shadow-lg"
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span aria-label="Leaderboard">
                      <Trophy size={18} />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Leaderboard</TooltipContent>
                </Tooltip>
              </Button>
            )
            )}
          </div>
        </div>

        {allGamesCompleted && hasDeclinedReplay && !isArticleView && (
          <div className="mb-6 bg-card border border-border p-6 rounded-lg shadow-lg text-center">
            <h3 className="text-2xl font-semibold mb-4 text-primary">
              {t("quiz.allGamesCompleted")}
            </h3>
            <div className="text-center bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-4 rounded-lg mb-4">
              <div className="text-xl font-semibold text-secondary mb-2">
                {t("quiz.totalScore", { score: formatNumberForDisplay(accumulatedScore) })}
              </div>
              <div className="text-muted-foreground">
                {accumulatedScore === gameData.length
                  ? t("quiz.perfectSessionAmazingWork")
                  : accumulatedScore > gameData.length / 2
                  ? t("quiz.greatSessionWellDone")
                  : t("quiz.goodEffortTryAgainToImprove")}
              </div>
            </div>
            <p className="text-muted-foreground mb-6">
              {t("quiz.youveFinishedAllAvailableGamesWellAddNewGamesSoon")}
            </p>
            <div className="space-y-3">
              <Button
                onClick={handleReplayConfirm}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-full transition-colors"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                {t("quiz.replayTheseGames")}
              </Button>
              <p className="text-sm text-muted-foreground">
                {t("quiz.orWaitForNewGamesToBeAdded")}
              </p>
            </div>
          </div>
        )}

        {!allGamesCompleted && (
          <div className="bg-card border border-border rounded-lg shadow-lg overflow-hidden flex flex-col min-h-[450px]">
            <div className="bg-muted/50 p-2 flex flex-wrap items-center justify-between gap-1 border-b border-border">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                 {t("quiz.currentScore", { score: formatNumberForDisplay(currentGameScore) })}
                </Button>
                <Button variant="outline" size="sm">
                  {t("quiz.accumulatedScore", { score: formatNumberForDisplay(accumulatedScore) })}
                </Button>
              </div>
              <div className="flex items-center gap-2">
              
                <Button variant="outline" size="sm">
                  {t("quiz.question", { current: formatNumberForDisplay(currentQuestionIndex + 1), total: formatNumberForDisplay(totalQuestions) })}
                </Button>
                  <Button variant="outline" size="sm">
                  {t("quiz.round", { current: formatNumberForDisplay(currentGameIndex + 1), total: formatNumberForDisplay(gameData.length) })}
                </Button>
              </div>
            </div>

            <div className="p-3 flex-1 overflow-y-auto">
              {!isArticleView && !hideArticleLink && (
                <p className="text-foreground flex items-center gap-2 justify-center ">
                  <a
                    href={addUtmParams(currentGame?.article_detail?.link || "")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {currentGame?.data.title}
                  </a>
                  <ExternalLink
                    className="w-4 h-4 cursor-pointer hover:text-primary"
                    onClick={() =>
                      window.open(addUtmParams(currentGame?.article_detail?.link || ""), "_blank")
                    }
                  />
                </p>
              )}

              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 my-3">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${(currentQuestionIndex / totalQuestions) * 100}%`,
                  }}
                />
              </div>

              <div className="mb-5">
                <h2 className="text-lg font-semibold mb-4 leading-relaxed">
                  {currentQuestion.question}
                </h2>

                <div className="space-y-2">
                  {["a", "b", "c", "d"].map((option) => (
                    <button
                      key={option}
                      onClick={() => handleAnswerSelect(option)}
                      disabled={isAnswered}
                      className={getOptionClass(option)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex-shrink-0 w-5 h-5 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center border border-current">
                          {option.toUpperCase()}
                        </span>
                        <span className="flex-1">
                          {currentQuestion[option as keyof Question]}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <InterruptDialog
        isOpen={showInterruptDialog}
        onClose={() => setShowInterruptDialog(false)}
        onConfirm={handleInterruptConfirm}
        currentScore={currentGameScore}
        totalQuestions={totalQuestions}
        type={interruptType}
      />

      <ReplayDialog
        isOpen={showReplayDialog}
        onClose={handleReplayClose}
        onConfirm={handleReplayConfirm}
        finalScore={accumulatedScore}
        totalGames={gameData.length}
      />

      <UserRegistrationDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        onSuccess={handleUserRegistrationSuccess}
      />
    </div>
  );

  return isArticleView ? (
    quizContentWithFixedButton
  ) : (
    <Layout>{quizContentWithFixedButton}</Layout>
  );
};

export default Quiz;
