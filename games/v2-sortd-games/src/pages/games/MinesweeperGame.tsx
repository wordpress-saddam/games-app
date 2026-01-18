import React, { useState, useEffect, useCallback, useRef } from "react";
import Layout from "../../components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import {
  Trophy,
  Flag,
  Bomb,
  RefreshCw,
  HelpCircle,
  Settings,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { playBlastSound, createExplosionEffect, createBlastShineEffect } from "../../utils/soundUtils";
import "../../styles/explosionAnimation.css";
import GamesServices from "../../../v2-services/games-service";
import { useTranslation } from "react-i18next";
import { formatedTime, formatNumberForDisplay } from "../../utils/numberFormatter";
import { useGameSchema } from "../../hooks/useGameSchema";

type Cell = {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
};

type GameStatus = "idle" | "playing" | "won" | "lost";

const MinesweeperWithBlast = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useUser();
  const gameContainerRef = useRef(null);
  const location = useLocation();
  const [difficulty, setDifficulty] = useState<
    "beginner" | "intermediate" | "expert"
  >("beginner");
  const [boardSize, setBoardSize] = useState({ rows: 9, cols: 9 });
  const [mineCount, setMineCount] = useState(10);
  const [board, setBoard] = useState<Cell[][]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>("idle");
  const [flagCount, setFlagCount] = useState(0);
  const [time, setTime] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isGameOverOpen, setIsGameOverOpen] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [dialog, setDialog] = useState(false);

  // Game schema for SEO
  const baseUrl = typeof window !== "undefined" 
    ? `${window.location.protocol}//${window.location.host}` 
    : "https://asharqgames-uat.sortd.pro";
  const gameUrl = `${baseUrl}${location.pathname}${location.search ? location.search : ""}`;
  const gameName = "Minesweeper";
  
  useGameSchema(
    {
      name: gameName,
      headline: `${gameName} - Asharq Games`,
      description: "Play Minesweeper to test your logic skills!",
      url: gameUrl,
      image: `${baseUrl}/assets/minesweeper.jpg`,
      isAccessibleForFree: true,
    },
  );
  const insertGameScore = useCallback(
    async (finalScore: number) => {
      const data = {
        score: finalScore,
        user_name: user?.username,
        game_id: "d52f0dc7-1966-4a4e-bc89-f4e671c8a7cb",
        game_type: "mine-hunt",
        user: user?.user_id,
        email:user?.email,

      };

      try {
        const res = await GamesServices.insertScore(data);
      } catch (error) {
        console.error("Failed to insert mineswweeper score:", error);
      }
    },
    [user?.username]
  );

  const initializeBoard = useCallback(() => {
    const { rows, cols } = boardSize;
    const newBoard: Cell[][] = [];

    for (let i = 0; i < rows; i++) {
      newBoard.push([]);
      for (let j = 0; j < cols; j++) {
        newBoard[i].push({
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          neighborMines: 0,
        });
      }
    }

    let minesPlaced = 0;
    while (minesPlaced < mineCount) {
      const row = Math.floor(Math.random() * rows);
      const col = Math.floor(Math.random() * cols);

      if (!newBoard[row][col].isMine) {
        newBoard[row][col].isMine = true;
        minesPlaced++;
      }
    }

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (newBoard[i][j].isMine) continue;

        let neighbors = 0;
        for (let di = -1; di <= 1; di++) {
          for (let dj = -1; dj <= 1; dj++) {
            if (di === 0 && dj === 0) continue;
            const ni = i + di;
            const nj = j + dj;
            if (
              ni >= 0 &&
              ni < rows &&
              nj >= 0 &&
              nj < cols &&
              newBoard[ni][nj].isMine
            ) {
              neighbors++;
            }
          }
        }
        newBoard[i][j].neighborMines = neighbors;
      }
    }

    setBoard(newBoard);
    setFlagCount(0);
    setTime(0);
    setGameStatus("playing");
  }, [boardSize, mineCount]);

  const changeDifficulty = (
    newDifficulty: "beginner" | "intermediate" | "expert"
  ) => {
    setDifficulty(newDifficulty);

    switch (newDifficulty) {
      case "beginner":
        setBoardSize({ rows: 9, cols: 9 });
        setMineCount(10);
        break;
      case "intermediate":
        setBoardSize({ rows: 16, cols: 12 });
        setMineCount(40);
        break;
      case "expert":
        setBoardSize({ rows: 18, cols: 12 });
        setMineCount(60);
        break;
    }
  };

  const handleCellClick = (row: number, col: number, event?: React.MouseEvent) => {
    if (
      gameStatus !== "playing" ||
      board[row][col].isRevealed ||
      board[row][col].isFlagged
    ) {
      return;
    }

    const newBoard = [...board];

    if (newBoard[row][col].isMine) {
      newBoard[row][col].isRevealed = true;
      setBoard(newBoard);
      
      playBlastSound();
      
      if (event && event.target) {
        createExplosionEffect(event.target as HTMLElement);
        createBlastShineEffect(event.target as HTMLElement);
        (event.target as HTMLElement).classList.add('mine-cell-exploded');
      }
      
      setGameStatus("lost");
      
      setTimeout(() => {
        setIsGameOverOpen(true);
      }, 800);
      
      return;
    }

    revealCell(newBoard, row, col);
    setBoard(newBoard);

    if (checkWinCondition(newBoard)) {
      insertGameScore(time);
      setGameStatus("won");
      setIsGameOverOpen(true);
    }
  };

  const handleCellRightClick = (
    e: React.MouseEvent,
    row: number,
    col: number
  ) => {
    e.preventDefault();

    if (gameStatus !== "playing" || board[row][col].isRevealed) {
      return;
    }

    const newBoard = [...board];

    if (newBoard[row][col].isFlagged) {
      newBoard[row][col].isFlagged = false;
      setFlagCount(flagCount - 1);
    } else if (flagCount < mineCount) {
      newBoard[row][col].isFlagged = true;
      setFlagCount(flagCount + 1);
    }

    setBoard(newBoard);
  };

  const revealCell = (board: Cell[][], row: number, col: number) => {
    const { rows, cols } = boardSize;

    if (
      row < 0 ||
      row >= rows ||
      col < 0 ||
      col >= cols ||
      board[row][col].isRevealed ||
      board[row][col].isFlagged
    ) {
      return;
    }

    board[row][col].isRevealed = true;

    if (board[row][col].neighborMines === 0) {
      for (let di = -1; di <= 1; di++) {
        for (let dj = -1; dj <= 1; dj++) {
          if (di === 0 && dj === 0) continue;
          revealCell(board, row + di, col + dj);
        }
      }
    }
  };

  const checkWinCondition = (board: Cell[][]) => {
    for (let i = 0; i < boardSize.rows; i++) {
      for (let j = 0; j < boardSize.cols; j++) {
        if (!board[i][j].isMine && !board[i][j].isRevealed) {
          return false;
        }
      }
    }
    return true;
  };

  const revealAllMines = () => {
    const newBoard = [...board];
    for (let i = 0; i < boardSize.rows; i++) {
      for (let j = 0; j < boardSize.cols; j++) {
        if (newBoard[i][j].isMine) {
          newBoard[i][j].isRevealed = true;
        }
      }
    }
    setBoard(newBoard);
  };

  useEffect(() => {
    let timer: number | null = null;

    if (gameStatus === "playing") {
      timer = window.setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [gameStatus]);

  useEffect(() => {
    initializeBoard();
  }, [boardSize, mineCount, initializeBoard]);

  useEffect(() => {
    if (gameStatus === "lost") {
      revealAllMines();
    }
  }, [gameStatus]);

  const getCellColor = (cell: Cell) => {
    if (!cell.isRevealed || cell.isFlagged) return "";

    switch (cell.neighborMines) {
      case 1:
        return "text-blue-500";
      case 2:
        return "text-green-500";
      case 3:
        return "text-red-500";
      case 4:
        return "text-purple-700";
      case 5:
        return "text-amber-800";
      case 6:
        return "text-cyan-600";
      case 7:
        return "text-slate-800";
      case 8:
        return "text-gray-700";
      default:
        return "";
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const params = new URLSearchParams({
    name: "Mine Hunt Logic",
    duration: "month",
    game_type: "mine-hunt",
    top_k: "10",
    sort_order: "asc",
    score_type: "min",
  });

  const handleLeaderBoard = () => {
    if (time == 0 || gameStatus === "lost" || gameStatus === "won") {
      navigate(`/games/leaderboard?${params.toString()}`);
    } else {
      setDialog(true);
    }
  };


  const TimerDisplay = React.memo(({ time }: { time: number }) => {
    const { t } = useTranslation();
    return <span>{t("common.time")} : {formatedTime(time)}</span>;
  });

  if (!user) {
    navigate("/");
  }

  return (
    <Layout>
      <div className="game-area">
        <div className="game-container">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4 px-2">
              <h1 className="text-2xl md:text-3xl font-bold ">
                {t("games.mineHunt.name")}
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

          <div className="flex flex-col md:flex-row w-full gap-4">
            <div className="bg-card border border-border rounded-lg shadow-lg overflow-hidden pb-3 w-full md:w-[70%]  ">
              <div className="bg-muted/50 p-2 flex flex-wrap items-center justify-between gap-1 border-b border-border">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => initializeBoard()}
                  >
                    <RefreshCw className="mr-1 h-4 w-4" /> {t("common.newGame")}
                  </Button>

                  <div className="flex items-center gap-1 bg-background rounded-md px-3 py-1 text-sm font-medium border border-border">
                    <Flag className="h-4 w-4 text-red-500" />
                    <span>{formatNumberForDisplay(mineCount - flagCount)}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-background rounded-md px-3 py-1 text-sm font-medium border border-border">
                  
                    <span> <TimerDisplay time={time} /></span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Button
                    onClick={() => setIsSettingsOpen(true)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Settings size={16} />
                    {difficulty === "beginner" ? t("games.mineHunt.beginner") : 
                     difficulty === "intermediate" ? t("games.mineHunt.intermediate") : 
                     t("games.mineHunt.expert")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsHelpOpen(true)}
                    className="bg-muted flex items-center gap-2"
                  >
                    <HelpCircle className="mr-1 h-4 w-4" /> {t("common.help")}
                  </Button>
                </div>
              </div>

              <div
                className={"p-4 flex justify-center overflow-x-auto "}
              >
                <div
                  className="grid gap-1 select-none"
                  style={{
                    gridTemplateRows: `repeat(${boardSize.rows}, minmax(28px, 1fr))`,
                    gridTemplateColumns: `repeat(${boardSize.cols}, minmax(28px, 1fr))`,
                    maxWidth: "100%",
                  }}
                >
                  {board.map((row, rowIndex) =>
                    row.map((cell, colIndex) => (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className={`
                        w-7 h-7 flex items-center justify-center text-sm font-medium 
                        ${
                          cell.isRevealed
                            ? cell.isMine
                              ? "bg-red-100 dark:bg-red-900/30"
                              : "bg-background"
                            : "bg-muted hover:bg-muted/80 active:bg-muted/60 cursor-pointer"
                        }
                        ${getCellColor(cell)}
                        border border-border rounded-sm transition-colors
                      `}
                        onClick={(e) => handleCellClick(rowIndex, colIndex, e)}
                        onContextMenu={(e) =>
                          handleCellRightClick(e, rowIndex, colIndex)
                        }
                      >
                        {cell.isRevealed ? (
                          cell.isMine ? (
                            <Bomb className="h-4 w-4 text-red-500" />
                          ) : (
                            cell.neighborMines > 0 && formatNumberForDisplay(cell.neighborMines)
                          )
                        ) : cell.isFlagged ? (
                          <Flag className="h-4 w-4 text-red-500" />
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="w-full md:w-[30%] ">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t("common.howToPlay")}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="space-y-4">
                    <p>
                      {t("games.mineHunt.theGoalIsToRevealAllCellsWithoutHittingAnyMines")}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-muted rounded-sm flex items-center justify-center border border-border"></div>
                      <span>{t("games.mineHunt.leftClickToRevealACell")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-muted rounded-sm flex items-center justify-center border border-border">
                        <Flag className="h-4 w-4 text-red-500" />
                      </div>
                      <span>
                        {t("games.mineHunt.rightClickMouseOrHoldThePlaceAndroidToPlaceAFlagWhereYouThinkAMineIsHidden")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-background rounded-sm flex items-center justify-center border border-border text-blue-500">
                      {formatNumberForDisplay(1)}
                      </div>
                      <span>
                        {t("games.mineHunt.numbersShowHowManyMinesAreAdjacentToTheCell")}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{t("games.mineHunt.howToPlayMineHuntLogic")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p>
                  {t("games.mineHunt.theGoalIsToRevealAllCellsWithoutHittingAnyMines")}
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-muted rounded-sm flex items-center justify-center border border-border"></div>
                  <span>{t("games.mineHunt.leftClickToRevealACell")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-muted rounded-sm flex items-center justify-center border border-border">
                    <Flag className="h-4 w-4 text-red-500" />
                  </div>
                  <span>
                    {t("games.mineHunt.rightClickMouseOrHoldThePlaceAndroidToPlaceAFlagWhereYouThinkAMineIsHidden")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-background rounded-sm flex items-center justify-center border border-border text-blue-500">
                    {formatNumberForDisplay(1)}
                  </div>
                  <span>
                    {t("games.mineHunt.numbersShowHowManyMinesAreAdjacentToTheCell")}
                  </span>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => setIsHelpOpen(false)}>{t("common.gotIt")}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("games.mineHunt.gameSettings")}</DialogTitle>
                <DialogDescription>
                  {t("games.mineHunt.changeTheDifficultyLevelOfYourGame")}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button
                      variant={
                        difficulty === "beginner" ? "default" : "outline"
                      }
                      onClick={() => changeDifficulty("beginner")}
                      className="flex-1"
                    >
                      {t("games.mineHunt.beginner")}
                    </Button>
                    <Button
                      variant={
                        difficulty === "intermediate" ? "default" : "outline"
                      }
                      onClick={() => changeDifficulty("intermediate")}
                      className="flex-1"
                    >
                      {t("games.mineHunt.intermediate")}
                    </Button>
                    <Button
                      variant={difficulty === "expert" ? "default" : "outline"}
                      onClick={() => changeDifficulty("expert")}
                      className="flex-1"
                    >
                      {t("games.mineHunt.expert")}
                    </Button>
                  </div>
                  <div className="pt-2">
                    <div className="text-sm">
                      {difficulty === "beginner" && t("games.mineHunt.board9x9With10Mines")}
                      {difficulty === "intermediate" && t("games.mineHunt.board16x16With40Mines")}
                      {difficulty === "expert" && t("games.mineHunt.board16x16With60Mines")}
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => {
                    initializeBoard();
                    setIsSettingsOpen(false);
                  }}
                >
                  {t("games.mineHunt.startNewGame")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Game Over dialog */}
          <Dialog open={isGameOverOpen} onOpenChange={setIsGameOverOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {gameStatus === "won" ? (
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      <span>{t("games.mineHunt.congratulations")}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Bomb className="h-5 w-5 text-red-500" />
                      <span>{t("common.gameOver")}</span>
                    </div>
                  )}
                </DialogTitle>
                <DialogDescription>
                  {gameStatus === "won"
                    ? t("games.mineHunt.youClearedAllMinesIn", { time: formatTime(time) })
                    : t("games.mineHunt.youHitAMineBetterLuckNextTime")}
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-center py-4">
                <div className="bg-muted/50 rounded-lg p-4 w-full max-w-xs">
                  <div className="text-center space-y-2">
                    <div className="text-sm text-muted-foreground">
                      {t("games.sudoku.difficulty")}
                    </div>
                    <div className="font-medium">
                      {difficulty === "beginner" ? t("games.mineHunt.beginner") : 
                       difficulty === "intermediate" ? t("games.mineHunt.intermediate") : 
                       t("games.mineHunt.expert")}
                    </div>
                    <Separator />
                    <div className="text-sm text-muted-foreground">{t("common.time")}</div>
                    <div className="font-medium">{formatTime(time)}</div>
                  </div>
                </div>
              </div>
              <DialogFooter className="flex gap-2">
                <Button
                  onClick={() => {
                    initializeBoard();
                    setIsGameOverOpen(false);
                  }}
                >
                  {t("common.playAgain")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsGameOverOpen(false);
                    setIsSettingsOpen(true);
                  }}
                >
                  {t("games.mineHunt.changeDifficulty")}
                </Button>
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
          {/* Top Ad */}
          {/* <div className="w-full bg-muted/30 rounded-lg p-4 my-4">
            <div className="text-center">
              <span className="text-xs text-muted-foreground">Advertisement</span>
              <div id="game-top-ad" className="bg-card border border-border h-32 w-full rounded flex items-center justify-center">
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trophy"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
                  <span>Premium Ad</span>
                </div>
              </div>
            </div>
          </div> */}
        </div>
      </div>
    </Layout>
  );
};

export default MinesweeperWithBlast;
