import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { useToast } from "../../hooks/use-toast";
import { useUser } from "../../context/UserContext";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
import { Info, HelpCircle, Computer, Users, RefreshCw } from "lucide-react";
import { set } from "date-fns";
import { useGameSchema } from "../../hooks/useGameSchema";
import GamesMainHeadline from "../../components/ui/GamesMainHeadline";
import MostReadSidebar from "@/components/MostReadSidebar";
import TicTacToeImage from "../../assets/xox.png";
import BackToHome from "../../components/ui/BackToHome";
import HowToPlayInstruction from "../../components/ui/HowToPlayInstruction";
import { LightButton, BlueButton, ResetButtonTopRounded } from "../../components/ui/GamesButton";
import VSIcon from "../../assets/vs.png";
import HumanIcon from "../../components/ui/HumanIcon";
import ComputerIcon from "../../components/ui/ComputerIcon";

type Player = "X" | "O";
type Cell = Player | null;
type Board = Cell[];
type GameMode = "human-vs-computer" | "human-vs-human";

const TicTacToe = () => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const { user } = useUser();
  const navigate = useNavigate();
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState<boolean>(true);
  const [winner, setWinner] = useState<Player | "Draw" | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>("human-vs-computer");
  const [showInstructions, setShowInstructions] = useState(false);
  const [showModeSelection, setShowModeSelection] = useState(true);
  const { toast } = useToast();

  const location = useLocation();

  // Game schema for SEO
  const baseUrl = typeof window !== "undefined" 
    ? `${window.location.protocol}//${window.location.host}` 
    : "https://asharqgames-uat.sortd.pro";
  const gameUrl = `${baseUrl}${location.pathname}${location.search ? location.search : ""}`;
  const gameName = t("games.xox.name");
  
  useGameSchema(
    {
      name: gameName,
      headline: `${gameName} - ${t("common.asharqGames")}`,
      description: `${t("games.xox.description")}`,
      url: gameUrl,
      image: `${baseUrl}/assets/tic-tac-toe.jpg`,
      isAccessibleForFree: true,
    },
  );
  const checkWinner = (
    boardState: Board
  ): { winner: Player | null; line: number[] | null } => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8], // horizontal
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8], // vertical
      [0, 4, 8],
      [2, 4, 6], // diagonal
    ];

    for (const [a, b, c] of lines) {
      if (
        boardState[a] &&
        boardState[a] === boardState[b] &&
        boardState[a] === boardState[c]
      ) {
        return { winner: boardState[a] as Player, line: [a, b, c] };
      }
    }

    return { winner: null, line: null };
  };

  const minimax = (
    board: Board,
    depth: number,
    isMaximizing: boolean
  ): number => {
    const { winner } = checkWinner(board);

    if (winner === "O") return 10 - depth; // AI wins (O)
    if (winner === "X") return depth - 10; // Human wins (X)
    if (!board.includes(null)) return 0; // Draw

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
          board[i] = "O";
          const score = minimax(board, depth + 1, false);
          board[i] = null;
          bestScore = Math.max(score, bestScore);
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
          board[i] = "X";
          const score = minimax(board, depth + 1, true);
          board[i] = null;
          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    }
  };

  const getBestMove = (board: Board): number => {
    let bestScore = -Infinity;
    let bestMove = 0;

    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = "O";
        const score = minimax(board, 0, false);
        board[i] = null;
        if (score > bestScore) {
          bestScore = score;
          bestMove = i;
        }
      }
    }
    return bestMove;
  };

  const handleClick = (index: number) => {
    if (winner || board[index]) return;

    // In computer mode, prevent clicking when it's computer's turn
    if (gameMode === "human-vs-computer" && !isXNext) return;

    const newBoard = [...board];
    newBoard[index] = isXNext ? "X" : "O";

    setBoard(newBoard);

    const { winner: newWinner, line } = checkWinner(newBoard);

    if (newWinner) {
      setWinner(newWinner);
      setWinningLine(line);

      let title = "";
      let description = "";
      let className = "";

      if (gameMode === "human-vs-computer") {
        title = `${t("games.xox.newWinner", { newWinner: newWinner })}`;
        description =
          newWinner === "X"
            ? `${t("games.xox.congratulations", { player: "X" })}`
            : `${t("games.xox.congratulations", { player: "O" })}`;
        className =
          newWinner === "X"
            ? "bg-green-600 text-white font-semibold border-none shadow-xl"
            : "bg-red-600 text-white font-semibold border-none shadow-xl";
      } else {
        title = `${t("games.xox.newWinner", { newWinner: newWinner })}`;
        description = `${t("games.xox.congratulations", { player: newWinner })}`;
        className =
          newWinner === "X"
            ? "bg-green-600 text-white font-semibold border-none shadow-xl"
            : "bg-green-600 text-white font-semibold border-none shadow-xl";
      }

      toast({
        title,
        description,
        className,
        duration: 5000,
      });
      return;
    }

    if (!newBoard.includes(null)) {
      setWinner("Draw");
      toast({
        title: `${t("common.itsADraw")}`,
        description: `${t("common.theGameEndedInATie")}`,
        className:
          "bg-yellow-500 text-black font-semibold border-none shadow-xl",
        duration: 5000,
      });
      return;
    }

    setIsXNext(!isXNext);
  };

  const handleAIMove = () => {
    if (winner || isXNext || gameMode === "human-vs-human") return;

    const bestMove = getBestMove([...board]);

    setTimeout(() => {
      const newBoard = [...board];
      newBoard[bestMove] = "O";
      setBoard(newBoard);

      const { winner: newWinner, line } = checkWinner(newBoard);

      if (newWinner) {
        setWinner(newWinner);
        setWinningLine(line);
        toast({
          title: `${t("games.xox.newWinner", { newWinner: newWinner })}`,
          description: newWinner === "X" ? `${t("games.xox.congratulations", { player: "X" })}` : `${t("games.xox.congratulations", { player: "O" })}`,
          className:
            "bg-red-600 text-white font-semibold border-none shadow-xl",
          duration: 5000,
        });
        return;
      }

      if (!newBoard.includes(null)) {
        setWinner("Draw");
        toast({
          title: t("common.itsADraw"),
          description: t("common.theGameEndedInATie"),
          className:
            "bg-yellow-500 text-black font-semibold border-none shadow-xl",
          duration: 5000,
        });
        return;
      }

      setIsXNext(true);
    }, 800);
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
    setWinningLine(null);
  };

  const selectGameMode = (mode: GameMode) => {
    setGameMode(mode);
    setShowModeSelection(false);
    resetGame();
  };

  const changeGameMode = () => {
    setShowModeSelection(true);
    resetGame();
  };

  useEffect(() => {
    if (gameMode === "human-vs-computer" && !isXNext && !winner) {
      handleAIMove();
    }
  }, [isXNext, winner, board, gameMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const getCellClass = (index: number) => {
    let className =
      "aspect-square w-full flex items-center justify-center text-4xl font-bold transition-all border border-neutral-400 dark:border-neutral-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800";

    if (winningLine && winningLine.includes(index)) {
      className += " bg-[#C0E5C3] animate-pulse border-[#C0E5C3]";
    }

    if (
      board[index] ||
      winner ||
      (gameMode === "human-vs-computer" && !isXNext)
    ) {
      className = className.replace(
        "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800",
        "cursor-not-allowed"
      );
    }

    return className;
  };

  const getCurrentPlayerDisplay = () => {
    if (winner) return "";

    if (gameMode === "human-vs-computer") {
      return isXNext ? `${t("common.yourTurn")} (X)` : `${t("common.computerThinking")} (O)`;
    } else {
      return t("common.playerTurn", { player: isXNext ? "X" : "O" });
    }
  };

  const getWinnerDisplay = () => {
    if (winner === "Draw") return t("common.itsADraw");

    if (gameMode === "human-vs-computer") {
      return winner === "X" ? t("common.youWon") : t("common.opponentWins");
    } else {
      return t("common.playerWins", { player: winner });
    }
  };

  const getInstructions = () => {
    if (gameMode === "human-vs-computer") {
      return (
        <ul className="list-disc pl-5 space-y-1">
          <li>
            {t("common.youPlayAsXAndTheComputerPlaysAsO")}
          </li>
          <li>
            {t("common.youAlwaysGoFirstClickOnAnyEmptySquareToMakeYourMove")}
          </li>
          <li>{t("common.theComputerWillAutomaticallyMakeItsMoveAfterYou")}</li>
          <li>
            {t("common.theFirstToGet3MarksInARowVerticallyHorizontallyOrDiagonallyWins")}
          </li>
          <li>{t("common.ifAll9SquaresAreFilledWithNoWinnerItsADraw")}</li>
          <li>
            {t("common.theComputerIsSmartItWillTryToWinAndBlockYourWinningMoves")}
          </li>
        </ul>
      );
    } else {
      return (
        <ul className="list-disc pl-5 space-y-1">
          <li>
            {t("common.player1PlaysAsXAndPlayer2PlaysAsO")}
          </li>
          <li>
            {t("common.playerXAlwaysGoesFirstTakeTurnsClickingOnEmptySquares")}
          </li>
          <li>
            {t("common.theFirstToGet3MarksInARowVerticallyHorizontallyOrDiagonallyWins")}
          </li>
          <li>{t("common.ifAll9SquaresAreFilledWithNoWinnerItsADraw")}</li>
          <li>{t("common.haveFunCompetingAgainstEachOther")}</li>
        </ul>
      );
    }
  };

  if (!user) {
    navigate("/");
  }

  return (
    <Layout>
      <section className="py-8" style={{ fontFamily: "'Noto Naskh Arabic', system-ui, sans-serif" }}>
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
                      <img src={TicTacToeImage} alt="TicTacToe Logo" className="w-20 h-20" />
                      <h2 className="text-xl md:text-3xl font-bold" translate="no">{t("games.xox.name")}</h2>
                    </div>
                    <div className="flex w-full md:w-auto md:flex-row gap-2">
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
                        <HelpCircle className="h-4 w-4" />
                      </LightButton>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Turn Indicator */}
                      {!winner && (
                        <LightButton>
                          {getCurrentPlayerDisplay()}
                        </LightButton>
                      )}
                      {/* Game Mode Button */}
                      <LightButton onClick={changeGameMode}>
                        {gameMode === "human-vs-computer"
                          ? t("common.vsComputer")
                          : t("common.vsHuman")}
                          {gameMode === "human-vs-computer" ? (
                            <ComputerIcon classes="h-[24px] w-[24px]" />
                          ) : (
                            <HumanIcon classes="h-[24px] w-[24px]" />
                          )}
                      </LightButton>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 aspect-square max-w-xs mx-auto my-5">
                    {board.map((cell, index) => (
                      <button
                        key={index}
                        className={getCellClass(index)}
                        onClick={() => handleClick(index)}
                        disabled={
                          !!cell ||
                          !!winner ||
                          (gameMode === "human-vs-computer" && !isXNext)
                        }
                      >
                        {cell}
                      </button>
                    ))}
                  </div>

                  {winner && (
                    <div className="text-center mb-4 ">
                      <h2 className="text-xl font-bold mb-2">
                        {getWinnerDisplay()}
                      </h2>
                    </div>
                  )}

                  <div className="flex justify-center">
                    <ResetButtonTopRounded onClick={resetGame}>
                      {t("common.newGame")}
                      <RefreshCw className="h-4 w-4" />
                    </ResetButtonTopRounded>
                  </div>
                </div>
              </div>
                {/* Most Read Sidebar - Takes 1 column on large screens */}
              <div className="lg:col-span-1">
                <HowToPlayInstruction 
                  title={t("common.howToPlay")}
                  text=""
                >
                  <div className="text-[16px] space-y-3 text-white">
                    <p className="mb-4">
                      {gameMode === "human-vs-computer"
                        ? t("common.youVsComputer")
                        : t("common.playerVsPlayer")}
                    </p>
                    {getInstructions()}
                  </div>
                </HowToPlayInstruction>
                <MostReadSidebar />
              </div>
            </div>
          </div>

        {/* Game Mode Selection Dialog */}
        <Dialog open={showModeSelection} onOpenChange={setShowModeSelection}>
          <DialogContent dir={isArabic ? "rtl" : "ltr"}>
            <DialogHeader>
              <DialogTitle>{t("common.chooseGameMode")}</DialogTitle>
              <DialogDescription>
                {t("common.selectHowYouWantToPlay")} {t("games.xox.name")}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4 mt-4">
              <div className="col-span-1 border border-[#DEDEDE] hover:border-[#C62426] hover:border-2 rounded-[5px] p-4">
                <a
                  onClick={() => selectGameMode("human-vs-human")}
                  className="w-full items-center gap-3 h-16 text-left justify-start cursor-pointer text-center"
                >
                  <div>
                  <div className="flex items-center gap-2">
                      <HumanIcon classes="flex items-center" />
                      <img src={VSIcon} alt="Computer" className="h-[24px] w-[24px]"  />
                      <HumanIcon classes="flex items-center" />
                    </div>
                    <div className="font-bold text-[18px]">{t("common.humanVsHuman")}</div>
                    <div className="text-sm text-muted-foreground text-[14px] text-[#AAAAAA]">
                      {t("common.playWithAFriend")}
                    </div>
                  </div>
                </a>
              </div>
              <div className="col-span-1 border border-[#DEDEDE] hover:border-[#C62426] hover:border-2 rounded-[5px] p-4">
                <a
                  onClick={() => selectGameMode("human-vs-computer")}
                  className="w-full items-center gap-3 h-16 text-left justify-start cursor-pointer text-center"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <HumanIcon classes="flex items-center" />
                      <img src={VSIcon} alt="Computer" className="h-[24px] w-[24px]"  />
                      <ComputerIcon classes="flex items-center" />
                    </div>
                    <div className="font-bold text-[18px]">{t("common.humanVsComputer")}</div>
                    <div className="text-sm text-muted-foreground text-[14px] text-[#AAAAAA]">
                      {t("common.playAgainstTheComputer")}
                    </div>
                  </div>
                </a>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Instructions Dialog */}
        <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
          <DialogContent dir={isArabic ? "rtl" : "ltr"}>
            <DialogHeader>
              <DialogTitle>{t("common.howToPlay")} {t("games.xox.name")}</DialogTitle>
              <DialogDescription>
                <div className="space-y-4 mt-4">{getInstructions()}</div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => setShowInstructions(false)}>{t("common.gotIt")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </section>
    </Layout>
  );
};

export default TicTacToe;
