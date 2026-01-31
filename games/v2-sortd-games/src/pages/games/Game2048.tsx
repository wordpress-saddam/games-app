import React, { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUser } from "../../context/UserContext";
import GamesServices from "../../../v2-services/games-service";
import Layout from "../../components/Layout";
import { useTranslation } from "react-i18next";
import {
  Trophy,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGameSchema } from "../../hooks/useGameSchema";
import GamesMainHeadline from "../../components/ui/GamesMainHeadline";
import MostReadSidebar from "@/components/MostReadSidebar";
import Game2048Image from "../../assets/tile-merge.png";
import BackToHome from "../../components/ui/BackToHome";
import LeaderboardButton from "../../components/ui/LeaderboardButton";
import HowToPlayInstruction from "../../components/ui/HowToPlayInstruction";
import { LightButton, ResetButtonTopRounded, UndoButtonTopRounded } from "../../components/ui/GamesButton";

// Types and Constants
type Direction = "up" | "right" | "down" | "left";
type Cell = number | null;
type Grid = Cell[][];
type GameState = "playing" | "won" | "lost";

const GRID_SIZE = 4;
const TARGET_TILE = 2048;
const COLORS: Record<number, string> = {
  2: "#EEE4DA",
  4: "#EDE0C8",
  8: "#F2B179",
  16: "#F59563",
  32: "#F67C5F",
  64: "#F65E3B",
  128: "#EDCF72",
  256: "#EDCC61",
  512: "#EDC850",
  1024: "#EDC53F",
  2048: "#EDC22E",
};

const TEXT_COLORS: Record<number, string> = {
  2: "#776E65",
  4: "#776E65",
  8: "#F9F6F2",
  16: "#F9F6F2",
  32: "#F9F6F2",
  64: "#F9F6F2",
  128: "#F9F6F2",
  256: "#F9F6F2",
  512: "#F9F6F2",
  1024: "#F9F6F2",
  2048: "#F9F6F2",
};

const Game2048 = () => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const navigate = useNavigate();
  const { user } = useUser();
  const location = useLocation();
  const [grid, setGrid] = useState<Grid>([]);
  const [score, setScore] = useState<number>(0);
  const [bestScore, setBestScore] = useState<number>(0);
  const [gameState, setGameState] = useState<GameState>("playing");
  const [dialog, setDialog] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [moveHistory, setMoveHistory] = useState<
    { grid: Grid; score: number }[]
  >([]);
  const [hasGameStarted, setHasGameStarted] = useState<boolean>(false);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Game schema for SEO
  const baseUrl = typeof window !== "undefined" 
    ? `${window.location.protocol}//${window.location.host}` 
    : "https://asharqgames-uat.sortd.pro";
  const gameUrl = `${baseUrl}${location.pathname}${location.search ? location.search : ""}`;
  const gameName = t("games.tileMerge.name");
  
  useGameSchema(
    {
      name: gameName,
      headline: `${gameName} - Asharq Games`,
      description: t("games.tileMerge.schemaDescription"),
      url: gameUrl,
      image: `${baseUrl}/assets/2048.jpg`,
      isAccessibleForFree: true,
    },
  );
  const initGame = useCallback(() => {
    const newGrid = Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill(null));

    // Add two initial tiles
    const gridWithTiles = addRandomTile(addRandomTile(newGrid));

    setGrid(gridWithTiles);
    setScore(0);
    setGameState("playing");
    setMoveHistory([]);
    setHasGameStarted(false);

    const savedBestScore = localStorage.getItem("2048_best_score");
    if (savedBestScore) {
      setBestScore(parseInt(savedBestScore, 10));
    }
  }, []);

  const insertGameScore = useCallback(
    async (finalScore: number) => {
      // Only insert if the user has actually played and there's a meaningful score
      if (!user || !GamesServices || finalScore === 0) return;

      const data = {
        score: finalScore,
        game_id: "ae8f3c9b-e22e-45a9-94cb-826f3497f993",
        game_type: "tile-merge",
        user_name: user?.username,
        email:user?.email,
        user: user?.user_id,
      };

      try {
        await GamesServices.insertScore(data);
        console.log("Score inserted successfully:", finalScore);
      } catch (error) {
        console.error("Failed to insert game score:", error);
      }
    },
    [user?.username, user?.user_id, user, GamesServices]
  );

  const addRandomTile = (currentGrid: Grid): Grid => {
    const emptyCells: [number, number][] = [];

    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (currentGrid[i][j] === null) {
          emptyCells.push([i, j]);
        }
      }
    }

    if (emptyCells.length === 0) {
      return currentGrid;
    }

    const [row, col] =
      emptyCells[Math.floor(Math.random() * emptyCells.length)];

    const newValue = Math.random() < 0.9 ? 2 : 4;

    const newGrid = [...currentGrid.map((row) => [...row])];
    newGrid[row][col] = newValue;

    return newGrid;
  };

  // Function to check if the game is over
  const checkGameOver = (currentGrid: Grid): boolean => {
    // Check for empty cells
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (currentGrid[i][j] === null) {
          return false;
        }
      }
    }

    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        const current = currentGrid[i][j];

        if (j < GRID_SIZE - 1 && current === currentGrid[i][j + 1]) {
          return false;
        }

        if (i < GRID_SIZE - 1 && current === currentGrid[i + 1][j]) {
          return false;
        }
      }
    }

    return true;
  };

  const checkWin = (currentGrid: Grid): boolean => {
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (currentGrid[i][j] === TARGET_TILE) {
          return true;
        }
      }
    }
    return false;
  };

  const moveTiles = (direction: Direction) => {
    if (gameState !== "playing") return;

    // Mark that the game has started
    if (!hasGameStarted) {
      setHasGameStarted(true);
    }

    // Save current state for undo
    const currentState = {
      grid: grid.map((row) => [...row]),
      score: score,
    };

    let newGrid = grid.map((row) => [...row]);
    let moved = false;
    let newScore = score;

    const rotateGrid = (grid: Grid, times: number): Grid => {
      let result = grid.map((row) => [...row]);

      for (let t = 0; t < times; t++) {
        const rotated: Grid = [];

        for (let j = 0; j < GRID_SIZE; j++) {
          const newRow: Cell[] = [];

          for (let i = GRID_SIZE - 1; i >= 0; i--) {
            newRow.push(result[i][j]);
          }

          rotated.push(newRow);
        }

        result = rotated;
      }

      return result;
    };

    // Rotate grid to always work from left-to-right
    let rotations = 0;

    if (direction === "up") {
      rotations = 1;
    } else if (direction === "right") {
      rotations = 2;
    } else if (direction === "down") {
      rotations = 3;
    }

    newGrid = rotateGrid(newGrid, rotations);

    // Process each row from left to right
    for (let i = 0; i < GRID_SIZE; i++) {
      // Move all tiles to the left first (remove gaps)
      let row = newGrid[i].filter((cell) => cell !== null);

      // Merge adjacent identical tiles
      for (let j = 0; j < row.length - 1; j++) {
        if (row[j] === row[j + 1]) {
          row[j] = (row[j] as number) * 2;
          newScore += row[j] as number;
          row[j + 1] = null;
          moved = true;
        }
      }

      // Filter null cells created during merge
      row = row.filter((cell) => cell !== null);

      // Pad with nulls to maintain grid size
      while (row.length < GRID_SIZE) {
        row.push(null);
      }

      // Check if the row has changed
      if (JSON.stringify(newGrid[i]) !== JSON.stringify(row)) {
        moved = true;
      }

      newGrid[i] = row;
    }

    // Rotate grid back to original orientation
    newGrid = rotateGrid(newGrid, (4 - rotations) % 4);

    if (moved) {
      // Add a new random tile
      newGrid = addRandomTile(newGrid);

      // Update score
      setScore(newScore);

      // Update best score if needed
      const newBestScore = Math.max(newScore, bestScore);
      if (newScore > bestScore) {
        setBestScore(newBestScore);
        localStorage.setItem("2048_best_score", newBestScore.toString());
      }

      // Add to move history
      setMoveHistory([...moveHistory, currentState]);

      // Check win condition
      if (checkWin(newGrid)) {
        setGameState("won");
        toast({
          title: t("common.youWon"),
          className: "bg-green-500 text-white font-semibold border-none shadow-xl",
          description: t("games.tileMerge.youReached2048TileWithScore", { score: newScore }),
          variant: "default",
        });
        // Insert score when game is won
        insertGameScore(newBestScore);
      }

      // Check if game is over
      if (checkGameOver(newGrid)) {
        setGameState("lost");
        toast({
          title: t("common.gameOver"),
          className: "bg-red-500 text-white font-semibold border-none shadow-xl",
          description: t("games.tileMerge.noMoreMovesAvailableFinalScore", { score: newScore }),
          variant: "destructive",
        });
        // Insert score when game is lost
        insertGameScore(newBestScore);
      }
    }

    setGrid(newGrid);
  };

  // Undo the last move
  const undoMove = () => {
    if (moveHistory.length === 0) return;

    const lastState = moveHistory[moveHistory.length - 1];
    setGrid(lastState.grid);
    setScore(lastState.score);
    setMoveHistory(moveHistory.slice(0, -1));

    // If game was over, set it back to playing
    if (gameState !== "playing") {
      setGameState("playing");
    }
  };

  // Reset the game
  const resetGame = () => {
    // Insert current best score before resetting if game was actually played
    if (hasGameStarted && bestScore > 0) {
      insertGameScore(bestScore);
    }
    initGame();
  };

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== "playing") return;

      switch (e.key) {
        case "ArrowUp":
          moveTiles("up");
          break;
        case "ArrowRight":
          moveTiles("right");
          break;
        case "ArrowDown":
          moveTiles("down");
          break;
        case "ArrowLeft":
          moveTiles("left");
          break;
        case "z":
          if (e.ctrlKey || e.metaKey) {
            undoMove();
          }
          break;
        default:
          return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [gameState, grid, moveHistory, score, hasGameStarted, bestScore]);

  // Handle touch events for swipe
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (gameState !== "playing") return;
      
      // Prevent default behavior and stop propagation
      e.preventDefault();
      e.stopPropagation();
      
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
      };
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Prevent scrolling when touching the game area
      e.preventDefault();
      e.stopPropagation();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current || gameState !== "playing") return;
      
      // Prevent default behavior and stop propagation
      e.preventDefault();
      e.stopPropagation();

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;

      // Minimum swipe distance
      const minSwipeDistance = 30;

      // Determine swipe direction based on which axis had larger movement
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (Math.abs(deltaX) > minSwipeDistance) {
          if (deltaX > 0) {
            moveTiles("right");
          } else {
            moveTiles("left");
          }
        }
      } else {
        // Vertical swipe
        if (Math.abs(deltaY) > minSwipeDistance) {
          if (deltaY > 0) {
            moveTiles("down");
          } else {
            moveTiles("up");
          }
        }
      }

      touchStartRef.current = null;
    };

    const el = gridContainerRef.current;
    if (el) {
      // Add passive: false to allow preventDefault
      el.addEventListener("touchstart", handleTouchStart, { passive: false });
      el.addEventListener("touchmove", handleTouchMove, { passive: false });
      el.addEventListener("touchend", handleTouchEnd, { passive: false });
    }

    return () => {
      if (el) {
        el.removeEventListener("touchstart", handleTouchStart);
        el.removeEventListener("touchmove", handleTouchMove);
        el.removeEventListener("touchend", handleTouchEnd);
      }
    };
  }, [gameState, grid, moveHistory, score]);

  // Initialize game on component mount
  useEffect(() => {
    initGame();
  }, [initGame]);

  // Get font size based on tile value
  const getTileFontSize = (value: number) => {
    if (value < 100) return 'text-2xl sm:text-4xl';
    if (value < 1000) return 'text-2xl sm:text-4xl';
    return 'text-base sm:text-lg';
  };

  // Manual controls for mobile devices
  const handleDirectionClick = (direction: Direction) => {
    if (gameState === "playing") {
      moveTiles(direction);
    }
  };

  const leaderboardUrl = `/leaderboard?${new URLSearchParams({
    name: t("games.tileMerge.name"),
    duration: "month",
    game_type: "tile-merge",
    top_k: "10",
    sort_order: "desc",
    score_type: "max",
  }).toString()}`;

  const handleLeaderBoard = () => {
    // Check if game is currently being played (not just if there's a score)
    const isGameActive = gameState === "playing" && hasGameStarted;
    
    if (isGameActive) {
      // Show dialog if user is in the middle of an active game
      setDialog(true);
    } else {
      // Go directly to leaderboard if no active game
      navigate(leaderboardUrl);
    }
  };

  const handleLeaveGame = () => {
    if (hasGameStarted && bestScore > 0) {
      insertGameScore(bestScore);
    }
    setDialog(false);
    navigate(leaderboardUrl);
  };

  return (
    <Layout>
      <section className="py-8">
        <div className="container mx-auto px-4" dir={isArabic ? "rtl" : "ltr"}>
          <div className="game-container3" translate="no">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 ">
              {/* Main Content: Games Grid - Takes 2 columns on large screens */}
              <div className="lg:col-span-2">
                {/* Header Section */}
                <div className="mb-6" translate="no">
                  <GamesMainHeadline title={t("common.games")} width={isArabic ? 120 : 144} />
                  <div className={`flex flex-col gap-4 mb-4 px-2 md:flex-row md:items-center md:justify-between ${isArabic ? "text-right" : "text-left"}`} translate="no">
                    <div className="flex items-center gap-2">
                      <img src={Game2048Image} alt="2048 Game Logo" className="w-20 h-20" />
                      <h2 className="text-xl md:text-3xl font-bold" translate="no">{t("games.tileMerge.name")}</h2>
                    </div>
                    <div className="flex w-full md:w-auto md:flex-row gap-2">
                      {/* Leaderboard Button */}
                      {!user?.isAnonymous && (
                        <LeaderboardButton text={t("common.leaderboard")} leaderboardUrl={leaderboardUrl} />
                      )}
                      {/* Back to Home Button */}
                      <BackToHome text={t("common.backToHome")} />
                    </div>
                  </div>
                </div>

                <hr className="w-full border-0 border-t-2 border-dotted border-gray-300 opacity-80" />

                <div className="bg-card border border-[#DEDEDE] rounded-[5px] shadow-lg overflow-hidden mt-8" translate="no">
                  {/* Score and Round Info */}
                  <div className="bg-[#F0F0F0] p-4 flex flex-wrap items-center justify-between gap-1 border-b border-[#DEDEDE]">
                    <div className="flex items-center gap-2">
                      {/* Help Button */}
                      <LightButton onClick={() => setShowInstructions(true)}>
                        {t("common.help")}
                        <HelpCircle className="mr-1 h-4 w-4" />
                      </LightButton>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Score Button */}
                      <LightButton>{t("common.score")}: {score}</LightButton>
                      {/* Best Score Button */}
                      <LightButton>{t("common.bestScore")}: {bestScore}</LightButton>
                    </div>
                  </div>

              {/* Improved Game Grid */}
              <div
                ref={gridContainerRef}
                className="w-full max-w-md mx-auto select-none py-12"
                style={{ touchAction: 'none' }}
              >
                <div className="relative p-3">
                  {/* Background Grid */}
                  <div className="grid grid-cols-4 gap-4 mb-0">
                    {Array(GRID_SIZE * GRID_SIZE)
                      .fill(null)
                      .map((_, index) => (
                        <div
                          key={`bg-${index}`}
                          className="aspect-square bg-slate-600/60"
                        />
                      ))}
                  </div>

                  {/* Tile Grid - Positioned Absolutely Over Background */}
                  <div className="absolute inset-3 grid grid-cols-4 gap-2">
                    {grid.map((row, rowIndex) =>
                      row.map((cell, colIndex) => {
                        const index = rowIndex * GRID_SIZE + colIndex;
                        return (
                          <div
                            key={`tile-${rowIndex}-${colIndex}`}
                            className={`
                              aspect-square flex items-center justify-center font-bold
                              transition-all duration-150 ease-in-out
                              ${cell 
                                ? 'shadow-lg transform scale-100 border-black/20' 
                                : 'opacity-0 scale-75'
                              }
                            `}
                            style={{
                              backgroundColor: cell ? COLORS[cell] || "#3C3A32" : "transparent",
                              color: cell ? TEXT_COLORS[cell] || "#F9F6F2" : "transparent",
                            }}
                          >
                            {cell && (
                              <span className={getTileFontSize(cell)}>
                                {cell}
                              </span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Mobile Controls */}
              {isMobile && (
                <div className="flex flex-col items-center justify-center gap-4 mb-6 px-4">
                  <button
                    className="w-12 h-12 bg-primary/20 hover:bg-primary/30 active:bg-primary/40 rounded-full flex items-center justify-center transition-all duration-150 touch-manipulation"
                    onClick={() => handleDirectionClick("up")}
                    type="button"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m18 15-6-6-6 6" />
                    </svg>
                  </button>
                  <div className="flex gap-8">
                    <button
                      className="w-12 h-12 bg-primary/20 hover:bg-primary/30 active:bg-primary/40 rounded-full flex items-center justify-center transition-all duration-150 touch-manipulation"
                      onClick={() => handleDirectionClick("left")}
                      type="button"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m15 18-6-6 6-6" />
                      </svg>
                    </button>
                    <button
                      className="w-12 h-12 bg-primary/20 hover:bg-primary/30 active:bg-primary/40 rounded-full flex items-center justify-center transition-all duration-150 touch-manipulation"
                      onClick={() => handleDirectionClick("down")}
                      type="button"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </button>
                    <button
                      className="w-12 h-12 bg-primary/20 hover:bg-primary/30 active:bg-primary/40 rounded-full flex items-center justify-center transition-all duration-150 touch-manipulation"
                      onClick={() => handleDirectionClick("right")}
                      type="button"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Game Controls */}
              <div className="flex justify-center gap-4 px-4">
                <UndoButtonTopRounded onClick={undoMove} disabled={moveHistory.length === 0}>
                  {t("common.undo")}
                </UndoButtonTopRounded>
                <ResetButtonTopRounded onClick={resetGame}>
                  {t("common.newGame")}
                </ResetButtonTopRounded>
              </div>
                </div>
              </div>

              {/* Most Read Sidebar - Takes 1 column on large screens */}
              <div className="lg:col-span-1">
                <HowToPlayInstruction 
                  title={t("common.howToPlay")}
                  text={""}
                >
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      {isMobile ? (
                        <>{t("common.touchTheGameAreaOrSwipeInAnyDirectionToStart")}</>
                      ) : (
                        <>
                          {t("common.pressAnyArrowKeyToStart")}
                        </>
                      )}
                    </li>
                    <li>
                      {isMobile ? (
                        <>{t("common.swipeInTheDirectionYouWantToMoveTheTiles")}</>
                      ) : (
                        <>
                          {t("common.moveTilesUsingArrowKeys")}
                        </>
                      )}
                    </li>
                    <li>{t("common.useCtrlZToUndoYourMove")}</li>
                    <li>{t("common.mergeTilesWithTheSameNumberToFormALargerNumber")}</li>
                    <li>
                      {t("common.yourGoalIsToCreateATileWithTheNumber")}{" "}
                      <span className="font-bold">2048</span>.
                    </li>
                    <li>{t("common.theGameEndsWhenThereAreNoMoreValidMovesLeft")}</li>
                    <li>
                      {t("common.planAheadKeepYourHighestTileInACornerAndBeatYourHighScore")}
                    </li>
                  </ul>
                </HowToPlayInstruction>
                <MostReadSidebar />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Instructions Dialog */}
      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent dir={isArabic ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>{t("common.howToPlay")}</DialogTitle>
            <DialogDescription>
              <div className="text-sm space-y-3 mt-4">
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                  <li>
                    {isMobile ? (
                      <>{t("common.touchTheGameAreaOrSwipeInAnyDirectionToStart")}</>
                    ) : (
                      <>
                        {t("common.pressAnyArrowKeyToStart")}
                      </>
                    )}
                  </li>
                  <li>
                    {isMobile ? (
                      <>{t("common.swipeInTheDirectionYouWantToMoveTheTiles")}</>
                    ) : (
                      <>
                        {t("common.moveTilesUsingArrowKeys")}
                      </>
                    )}
                  </li>
                  <li>{t("common.useCtrlZToUndoYourMove")}</li>
                  <li>{t("common.mergeTilesWithTheSameNumberToFormALargerNumber")}</li>
                  <li>
                    {t("common.yourGoalIsToCreateATileWithTheNumber")}{" "}
                    <span className="font-bold">2048</span>.
                  </li>
                  <li>{t("common.theGameEndsWhenThereAreNoMoreValidMovesLeft")}</li>
                  <li>
                    {t("common.planAheadKeepYourHighestTileInACornerAndBeatYourHighScore")}
                  </li>
                </ul>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowInstructions(false)}>{t("common.gotIt")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leave Game Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent dir={isArabic ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>{t("common.leaveGame")}</DialogTitle>
            <DialogDescription>
              <div className="space-y-4 mt-4">
                <p className="text-muted-foreground mb-4">
                  {t("common.areYouSureYouWantToLeaveTheGameYourCurrentProgressWillBeLostButYourBestScoreWillBeSaved")}
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row gap-3 justify-end">
            <Button variant="outline" onClick={() => setDialog(false)}>
              {t("common.no")}
            </Button>
            <Button variant="secondary" onClick={handleLeaveGame}>
              {t("common.yes")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Game2048;