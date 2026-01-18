
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Play,
  Pause,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Trophy,
  RotateCcw,
} from "lucide-react";
import GamesServices from "../../../v2-services/games-service";
import { useUser } from "../../context/UserContext";
import { useTranslation } from "react-i18next";
import { formatNumber, formatNumberForDisplay } from "../../utils/numberFormatter";
import { useGameSchema } from "../../hooks/useGameSchema";

const TETRIMINOS = {
  I: { shape: [[1, 1, 1, 1]], color: "bg-cyan-500" },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
    ],
    color: "bg-blue-500",
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
    ],
    color: "bg-orange-500",
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: "bg-yellow-500",
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
    ],
    color: "bg-green-500",
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
    ],
    color: "bg-purple-500",
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
    ],
    color: "bg-red-500",
  },
};

type TetriminoType = keyof typeof TETRIMINOS;

function getRandomTetrimino(): TetriminoType {
  const types: TetriminoType[] = Object.keys(TETRIMINOS) as TetriminoType[];
  return types[Math.floor(Math.random() * types.length)];
}

const TetrisGame = () => {
  const { t } = useTranslation();
  const { user } = useUser();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const BOARD_WIDTH = 10;
  const BOARD_HEIGHT = 15;

  const [gameBoard, setGameBoard] = useState<(TetriminoType | null)[][]>(
    Array(BOARD_HEIGHT)
      .fill(null)
      .map(() => Array(BOARD_WIDTH).fill(null))
  );
  const [currentTetrimino, setCurrentTetrimino] = useState<{
    type: TetriminoType;
    position: { x: number; y: number };
    rotation: number;
  } | null>(null);
  const [nextTetrimino, setNextTetrimino] = useState<TetriminoType>(
    getRandomTetrimino()
  );
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameSpeed, setGameSpeed] = useState(800);
  const [showControls, setShowControls] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [dialog, setDialog] = useState(false);

  const requestRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const dropTimeRef = useRef<number>(0);
  const moveIntervalRef = useRef<NodeJS.Timeout>();

  // Game schema for SEO
  const baseUrl = typeof window !== "undefined" 
    ? `${window.location.protocol}//${window.location.host}` 
    : "https://asharqgames-uat.sortd.pro";
  const gameUrl = `${baseUrl}${location.pathname}${location.search ? location.search : ""}`;
  const gameName = "Tetris";
  
  useGameSchema(
    {
      name: gameName,
      headline: `${gameName} - Asharq Games`,
      description: "Play Tetris to test your puzzle skills!",
      url: gameUrl,
      image: `${baseUrl}/assets/tetris.jpg`,
      isAccessibleForFree: true,
    },
  );

  const insertGameScore = useCallback(
    async (finalScore: number) => {
      const data = {
        score: finalScore,
        user_name: user?.username,
        game_id: "2e938a61-bf9e-4af6-a0b6-96184c799ad2",
        game_type: "block-drop",
        user: user?.user_id,
        email:user?.email,

      };

      try {
        await GamesServices.insertScore(data);
      } catch (error) {
        console.error("Failed to insert tetris score:", error);
      }
    },
    [user?.username, user?.user_id]
  );

  const createNewTetrimino = useCallback(() => {
    console.log("Creating new tetrimino:", nextTetrimino);
    const type = nextTetrimino;
    const shape = TETRIMINOS[type].shape;
    const position = {
      x: Math.floor(BOARD_WIDTH / 2) - Math.floor(shape[0].length / 2),
      y: 0,
    };

    if (checkCollision(shape, position, 0)) {
      console.log("Game over - collision detected");
      insertGameScore(score);
      setGameOver(true);
      setGameStarted(false);
      return;
    }

    setCurrentTetrimino({
      type,
      position,
      rotation: 0,
    });

    setNextTetrimino(getRandomTetrimino());
    console.log("New tetrimino created successfully");
  }, [nextTetrimino, score, insertGameScore]);

  const resetGame = () => {
    console.log("Resetting game");
    setGameBoard(
      Array(BOARD_HEIGHT)
        .fill(null)
        .map(() => Array(BOARD_WIDTH).fill(null))
    );
    setScore(0);
    setLevel(1);
    setLines(0);
    setGameOver(false);
    setGameSpeed(800);
    setPaused(false);
    setGameStarted(false);
    setCurrentTetrimino(null);
    setNextTetrimino(getRandomTetrimino());

    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    if (moveIntervalRef.current) {
      clearInterval(moveIntervalRef.current);
    }
  };

  const startGame = () => {
    console.log("Starting new game");
    setGameBoard(
      Array(BOARD_HEIGHT)
        .fill(null)
        .map(() => Array(BOARD_WIDTH).fill(null))
    );
    setScore(0);
    setLevel(1);
    setLines(0);
    setGameOver(false);
    setGameSpeed(800);
    setPaused(false);
    setGameStarted(true);

    const firstType = nextTetrimino;
    const secondType = getRandomTetrimino();

    setNextTetrimino(secondType);

    const shape = TETRIMINOS[firstType].shape;
    const position = {
      x: Math.floor(BOARD_WIDTH / 2) - Math.floor(shape[0].length / 2),
      y: 0,
    };

    setCurrentTetrimino({
      type: firstType,
      position,
      rotation: 0,
    });

    lastTimeRef.current = 0;
    dropTimeRef.current = 0;
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    requestRef.current = requestAnimationFrame(gameLoop);
  };

  const gameLoop = useCallback(
    (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const deltaTime = time - lastTimeRef.current;
      lastTimeRef.current = time;

      if (!paused && !gameOver && gameStarted) {
        dropTimeRef.current += deltaTime;

        if (dropTimeRef.current > gameSpeed) {
          dropTimeRef.current = 0;
          if (currentTetrimino) {
            const success = moveTetrimino(0, 1);
          }
        }
      }

      if (gameStarted && !gameOver) {
        requestRef.current = requestAnimationFrame(gameLoop);
      }
    },
    [paused, gameOver, gameStarted, gameSpeed, currentTetrimino]
  );

  const checkCollision = (
    shape: number[][],
    position: { x: number; y: number },
    rotation: number
  ): boolean => {
    const rotatedShape = getRotatedShape(shape, rotation);

    for (let y = 0; y < rotatedShape.length; y++) {
      for (let x = 0; x < rotatedShape[y].length; x++) {
        if (rotatedShape[y][x]) {
          const boardX = position.x + x;
          const boardY = position.y + y;

          if (
            boardX < 0 ||
            boardX >= BOARD_WIDTH ||
            boardY >= BOARD_HEIGHT ||
            (boardY >= 0 && gameBoard[boardY][boardX])
          ) {
            return true;
          }
        }
      }
    }

    return false;
  };

  const getRotatedShape = (shape: number[][], rotation: number): number[][] => {
    let rotatedShape = shape.map((row) => [...row]);

    for (let i = 0; i < rotation % 4; i++) {
      const rows = rotatedShape.length;
      const cols = rotatedShape[0].length;
      const newShape: number[][] = [];

      for (let x = 0; x < cols; x++) {
        const newRow: number[] = [];
        for (let y = rows - 1; y >= 0; y--) {
          newRow.push(rotatedShape[y][x]);
        }
        newShape.push(newRow);
      }

      rotatedShape = newShape;
    }

    return rotatedShape;
  };

  const moveTetrimino = (
    dx: number,
    dy: number,
    rotate: boolean = false
  ): boolean => {
    if (!currentTetrimino || paused || gameOver || !gameStarted) return false;

    const newPosition = {
      x: currentTetrimino.position.x + dx,
      y: currentTetrimino.position.y + dy,
    };

    const newRotation = rotate
      ? (currentTetrimino.rotation + 1) % 4
      : currentTetrimino.rotation;

    const shape = TETRIMINOS[currentTetrimino.type].shape;

    if (!checkCollision(shape, newPosition, newRotation)) {
      setCurrentTetrimino({
        ...currentTetrimino,
        position: newPosition,
        rotation: newRotation,
      });
      return true;
    }

    if (dy > 0) {
      console.log("Tetrimino landed, updating board");
      updateBoard();
      return false;
    }

    return false;
  };

  const startContinuousMove = (dx: number, dy: number) => {
    if (moveIntervalRef.current) {
      clearInterval(moveIntervalRef.current);
    }

    if (dy > 0) {
      moveTetrimino(dx, dy);
    } else {
      moveTetrimino(dx, dy);
    }
  };

  const stopContinuousMove = () => {
    if (moveIntervalRef.current) {
      clearInterval(moveIntervalRef.current);
      moveIntervalRef.current = undefined;
    }
  };

  const updateBoard = () => {
    if (!currentTetrimino) return;

    console.log("Updating board with landed tetrimino");
    const shape = getRotatedShape(
      TETRIMINOS[currentTetrimino.type].shape,
      currentTetrimino.rotation
    );

    const newBoard = [...gameBoard.map((row) => [...row])];

    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const boardY = currentTetrimino.position.y + y;
          const boardX = currentTetrimino.position.x + x;

          if (
            boardY >= 0 &&
            boardY < BOARD_HEIGHT &&
            boardX >= 0 &&
            boardX < BOARD_WIDTH
          ) {
            newBoard[boardY][boardX] = currentTetrimino.type;
          }
        }
      }
    }

    setGameBoard(newBoard);
    checkCompletedLines(newBoard);
    setCurrentTetrimino(null);

    setTimeout(() => {
      createNewTetrimino();
    }, 100);
  };

  const checkCompletedLines = (board: (TetriminoType | null)[][]) => {
    let completedLines = 0;
    const newBoard = [...board];

    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      if (newBoard[y].every((cell) => cell !== null)) {
        newBoard.splice(y, 1);
        newBoard.unshift(Array(BOARD_WIDTH).fill(null));
        completedLines++;
        y++;
      }
    }

    if (completedLines > 0) {
      const linePoints = [0, 10, 30, 50, 80];
      const newScore = score + linePoints[completedLines] * level;
      const newLines = lines + completedLines;
      const newLevel = Math.floor(newLines / 10) + 1;

      setScore(newScore);
      setLines(newLines);

      if (newLevel > level) {
        setLevel(newLevel);
        setGameSpeed(Math.max(100, 800 - (newLevel - 1) * 70));
      }

      setGameBoard(newBoard);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
      }

      if (!gameStarted && !gameOver && !isMobile) {
        startGame();
        return;
      }

      if (!gameStarted || paused || gameOver) return;

      switch (e.key) {
        case "ArrowLeft":
          moveTetrimino(-1, 0);
          break;
        case "ArrowRight":
          moveTetrimino(1, 0);
          break;
        case "ArrowDown":
          moveTetrimino(0, 1);
          break;
        case "ArrowUp":
          moveTetrimino(0, 0, true);
          break;
        case "p":
        case "P":
          setPaused((p) => !p);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [gameStarted, currentTetrimino, paused, gameOver, gameBoard, isMobile]);

  useEffect(() => {
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      if (moveIntervalRef.current) {
        clearInterval(moveIntervalRef.current);
      }
    };
  }, []);

  const renderBoard = () => {
    const displayBoard = gameBoard.map((row) => [...row]);

    if (currentTetrimino && !gameOver) {
      const shape = getRotatedShape(
        TETRIMINOS[currentTetrimino.type].shape,
        currentTetrimino.rotation
      );

      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          if (shape[y][x]) {
            const boardY = currentTetrimino.position.y + y;
            const boardX = currentTetrimino.position.x + x;

            if (
              boardY >= 0 &&
              boardY < BOARD_HEIGHT &&
              boardX >= 0 &&
              boardX < BOARD_WIDTH
            ) {
              displayBoard[boardY][boardX] = currentTetrimino.type;
            }
          }
        }
      }
    }

    return (
      <div className="relative">
        <div className={`grid grid-cols-10 ${isMobile ? 'gap-0' : 'gap-px'} border-2 border-border rounded-lg overflow-hidden bg-border shadow-lg`}>
          {displayBoard.map((row, y) =>
            row.map((cell, x) => (
              <div
                key={`${y}-${x}`}
                className={`w-6 h-6 md:w-7 md:h-7 ${
                  cell ? TETRIMINOS[cell].color : "bg-background"
                } ${cell ? "shadow-inner border border-black/20" : ""} ${isMobile ? 'border border-border/30' : ''}`}
              />
            ))
          )}
        </div>

        {/* Pre-game overlay (glass card) */}
        {!gameStarted && !gameOver && (
          <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-background/80 backdrop-blur-md border border-border rounded-xl shadow-xl p-5 text-center space-y-4">
              <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Play className="text-primary" size={26} />
              </div>
              <h3 className="text-xl font-semibold">{t("games.blockDrop.readyToDropBlocks")}</h3>
              <p className="text-sm text-muted-foreground">
                {isMobile ? (
                  <>{t("games.blockDrop.tapStartToBeginUseOnScreenControlsToMoveAndRotate")}</>
                ) : (
                  <>{t("games.blockDrop.clickStartOrUseSpaceArrowKeysToBegin")}</>
                )}
              </p>
              <div className="flex flex-col items-center gap-2">
                <Button
                  onClick={startGame}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6"
                >
                  {t("common.startGame")}
                </Button>
              </div>
            </div>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center rounded-lg">
            <div className="text-center p-6 bg-card rounded-lg shadow-lg border">
              <div className="text-2xl font-bold mb-2 text-destructive">
                {t("common.gameOver")}
              </div>
              <div className="mb-4 text-lg">
                {t("games.blockDrop.finalScore")}:{" "}
                <span className="font-bold text-primary">{formatNumberForDisplay(score)}</span>
              </div>
              <Button onClick={startGame} size="lg">
                <RefreshCw className="mr-2" size={20} />
                {t("common.playAgain")}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderNextTetrimino = () => {
    const shape = TETRIMINOS[nextTetrimino].shape;
    const color = TETRIMINOS[nextTetrimino].color;

    const previewGrid = Array(4)
      .fill(null)
      .map(() => Array(4).fill(null));

    const offsetY = Math.floor((4 - shape.length) / 2);
    const offsetX = Math.floor((4 - shape[0].length) / 2);

    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          previewGrid[y + offsetY][x + offsetX] = 1;
        }
      }
    }

    return (
      <div className="grid grid-cols-4 gap-px bg-border rounded-md overflow-hidden">
        {previewGrid.map((row, y) =>
          row.map((cell, x) => (
            <div
              key={`next-${y}-${x}`}
              className={`w-5 h-5 md:w-6 md:h-6 ${
                cell ? color : "bg-background"
              } ${cell ? "shadow-inner border border-black/20" : ""}`}
            />
          ))
        )}
      </div>
    );
  };

  const params = new URLSearchParams({
    name: "Block Drop Puzzle",
    duration: "month",
    game_type: "block-drop",
    top_k: "10",
    sort_order: "desc",
    score_type: "max",
  });

  const handleLeaderBoard = () => {
    if (gameOver || score == 0) {
      navigate(`/games/leaderboard?${params.toString()}`);
    } else {
      setDialog(true);
    }
  };

  if (!user) {
    navigate("/");
    return null;
  }

  return (
    <Layout>
      <div className="game-area">
        <div className="game-container">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4 px-2">
              <h1 className="text-2xl md:text-3xl font-bold">
                {t("games.blockDrop.name")}
              </h1>
              {!user?.isAnonymous && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleLeaderBoard}
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold shadow-lg"
                    aria-label={t("common.leaderboard")}
                  >
                    <Trophy size={18} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("common.leaderboard")}</TooltipContent>
              </Tooltip>
              )}
            </div>
          </div>

          {!gameStarted && (
            <div className="text-center mb-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-muted-foreground">
                {t("games.blockDrop.clickStartToBeginYouCanAlsoUseArrowKeysOnDevicesWithAKeyboard")}
              </p>
            </div>
          )}

          <div className="flex flex-col md:flex-row w-full gap-4">
            <div className="bg-card border border-border rounded-lg shadow-lg overflow-hidden pb-3 w-full md:w-[70%]">
              <div className="bg-muted/50 p-2 flex flex-wrap items-center justify-between gap-1 border-b border-border">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    {t("games.blockDrop.score")} : {formatNumber(score)}
                  </Button>

                  <Button variant="outline" size="sm">
                    {t("games.blockDrop.level")} : {formatNumberForDisplay(level)}
                  </Button>
                  <Button variant="outline" size="sm">
                    {t("games.blockDrop.lines")} : {formatNumberForDisplay(lines)}
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetGame}
                    className="bg-muted flex items-center gap-1 hover:bg-red-100 hover:text-red-700"
                  >
                    <RotateCcw className="h-4 w-4" />
                    {!isMobile && t("common.reset")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowControls(true)}
                    className="bg-muted flex items-center gap-2"
                  >
                    <HelpCircle className="mr-1 h-4 w-4" /> {t("common.help")}
                  </Button>
                </div>
              </div>

              {/* Game Area */}
              <div className="flex justify-center items-start gap-6 my-4 p-2">
                <div>{renderBoard()}</div>

                {isMobile && (
                  <div className="flex flex-col gap-4">
                    <div className="bg-card border rounded-lg p-4 shadow-sm">
                      <div className="text-sm text-muted-foreground mb-2 text-center font-medium">
                        {t("games.blockDrop.next")}
                      </div>
                      <div className="flex justify-center">
                        {renderNextTetrimino()}
                      </div>
                    </div>
                    
                    {/* Fixed height container to prevent layout shift */}
                    <div className="flex flex-col justify-center items-center gap-4 min-h-[120px]">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowControls(true)}
                        className="bg-muted flex items-center gap-1"
                      >
                        <HelpCircle className="mr-1 h-4 w-4" /> Help
                      </Button>
                      <div className="h-10" />
                    </div>
                  </div>
                )}
              </div>

              {/* Touch Controls - Show on mobile and iPad landscape (no keyboard required) */}
              <div className={`${isMobile ? 'block' : 'hidden'} mb-6`}>
                <div className="flex justify-center mb-4">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-16 h-16 p-0 border-2"
                    onClick={() => moveTetrimino(0, 0, true)}
                    disabled={paused || gameOver || !gameStarted}
                  >
                    <div className="flex flex-col items-center">
                      <ChevronUp size={24} />
                      <span className="text-xs">Rotate</span>
                    </div>
                  </Button>
                </div>

                <div className="flex justify-center items-center gap-8">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-16 h-16 p-0 border-2"
                    onClick={() => moveTetrimino(-1, 0)}
                    disabled={paused || gameOver || !gameStarted}
                  >
                    <ChevronLeft size={32} />
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    className="w-16 h-16 p-0 border-2"
                    onClick={() => startContinuousMove(0, 1)}
                    disabled={paused || gameOver || !gameStarted}
                  >
                    <ChevronDown size={32} />
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    className="w-16 h-16 p-0 border-2"
                    onClick={() => moveTetrimino(1, 0)}
                    disabled={paused || gameOver || !gameStarted}
                  >
                    <ChevronRight size={32} />
                  </Button>
                </div>
              </div>
            </div>

            {/* Right sidebar */}
            <div className="w-full md:w-[30%]">
              {!isMobile && (
                <div className="bg-card border rounded-lg p-4 shadow-sm mb-4">
                  <div className="text-sm text-muted-foreground mb-3 text-center font-medium">
                    {t("games.blockDrop.next")}
                  </div>
                  <div className="flex justify-center">
                    {renderNextTetrimino()}
                  </div>
                </div>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t("common.howToPlay")}</CardTitle>
                </CardHeader>

                <CardContent className="text-sm space-y-2">
                  {!gameStarted && !isMobile && (
                    <div className="text-center mb-4 p-2 bg-muted/50 rounded-lg">
                      <p className="text-muted-foreground">
                        {t("games.blockDrop.pressAnyArrowKeyToStartTheGame")}
                      </p>
                    </div>
                  )}

                  {!isMobile && (
                    <div className="text-sm">
                      <div className="flex mb-2 justify-between">
                        <span>{t("games.blockDrop.moveLeft")}</span>
                        <kbd className="px-2 py-1 bg-muted rounded">←</kbd>
                      </div>
                      <div className="flex mb-2 justify-between">
                        <span>{t("games.blockDrop.moveRight")}</span>
                        <kbd className="px-2 py-1 bg-muted rounded">→</kbd>
                      </div>
                      <div className="flex mb-2 justify-between">
                        <span>
                          {t("games.blockDrop.dropPieceTapAgainAfterItSettlesToDropTheNextOne")}
                        </span>
                        <kbd className="px-2 py-1 bg-muted rounded">↓</kbd>
                      </div>
                      <div className="flex mb-2 justify-between">
                        <span>{t("games.blockDrop.rotate")}</span>
                        <kbd className="px-2 py-1 bg-muted rounded">↑</kbd>
                      </div>
                    </div>
                  )}

                  {isMobile && (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>{t("games.blockDrop.moveLeftRight")}</span>
                        <span>{t("games.blockDrop.buttons")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>
                          {t("games.blockDrop.dropPieceTapAgainAfterItSettlesToDropTheNextOne")}
                        </span>
                        <span>{t("games.blockDrop.button")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t("games.blockDrop.rotateButton")}</span>
                        <span>{t("games.blockDrop.rotatePiece")}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Dialogs */}
          <Dialog open={showControls} onOpenChange={setShowControls}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{t("games.blockDrop.howToPlayBlockDropPuzzle")}</DialogTitle>
                <DialogDescription>
                  {t("games.blockDrop.masterTheArtOfArrangingFallingTetriminosToCreateCompleteHorizontalLines")}
                </DialogDescription>
              </DialogHeader>
              {!isMobile && (
                <div className="text-sm">
                  <div className="flex mb-2 justify-between">
                    <span>{t("games.blockDrop.moveLeft")}</span>
                    <kbd className="px-2 py-1 bg-muted rounded">←</kbd>
                  </div>
                  <div className="flex mb-2 justify-between">
                    <span>{t("games.blockDrop.moveRight")}</span>
                    <kbd className="px-2 py-1 bg-muted rounded">→</kbd>
                  </div>
                  <div className="flex mb-2 justify-between">
                    <span>{t("games.blockDrop.dropPieceTapAgainAfterItSettlesToDropTheNextOne")}</span>
                    <kbd className="px-2 py-1 bg-muted rounded">↓</kbd>
                  </div>
                  <div className="flex mb-2 justify-between">
                    <span>{t("games.blockDrop.rotate")}</span>
                    <kbd className="px-2 py-1 bg-muted rounded">↑</kbd>
                  </div>
                </div>
              )}

              {isMobile && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>{t("games.blockDrop.moveLeftRight")}</span>
                    <span>{t("games.blockDrop.buttons")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("games.blockDrop.dropPieceTapAgainAfterItSettlesToDropTheNextOne")}</span>
                    <span>{t("games.blockDrop.button")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("games.blockDrop.rotateButton")}</span>
                    <span>{t("games.blockDrop.rotatePiece")}</span>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button onClick={() => setShowControls(false)}>{t("games.blockDrop.gotIt")}</Button>
              </DialogFooter>
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
                <Button
                  onClick={() => {
                    setDialog(false);
                  }}
                >
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
        </div>
      </div>
    </Layout>
  );
};

export default TetrisGame;
