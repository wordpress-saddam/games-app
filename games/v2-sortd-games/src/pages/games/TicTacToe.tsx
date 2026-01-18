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
import { Info, HelpCircle, Computer, Users } from "lucide-react";
import { set } from "date-fns";
import { useGameSchema } from "../../hooks/useGameSchema";

type Player = "X" | "O";
type Cell = Player | null;
type Board = Cell[];
type GameMode = "human-vs-computer" | "human-vs-human";

const TicTacToe = () => {
  const { t } = useTranslation();
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
  const gameName = "Tic Tac Toe";
  
  useGameSchema(
    {
      name: gameName,
      headline: `${gameName} - Asharq Games`,
      description: "Play Tic Tac Toe against the computer or a friend. Test your strategic skills!",
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
        title = `${newWinner} Wins! 🎉`;
        description =
          newWinner === "X"
            ? "You won! Great job!"
            : "Opponent wins this round!";
        className =
          newWinner === "X"
            ? "bg-green-600 text-white font-semibold border-none shadow-xl"
            : "bg-red-600 text-white font-semibold border-none shadow-xl";
      } else {
        title = `Player ${newWinner} Wins! 🎉`;
        description = `Congratulations Player ${newWinner}!`;
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
        title: "It's a Draw! 🤝",
        description: "The game ended in a tie.",
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
          title: `${newWinner} Wins! 🎉`,
          description: "Opponent wins this round!",
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
      "aspect-square w-full flex items-center justify-center text-xl sm:text-md font-bold transition-all border border-neutral-400 dark:border-neutral-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800";

    if (winningLine && winningLine.includes(index)) {
      className += " bg-primary/20 text-primary animate-pulse";
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
      <div className="game-area">
        <div className="game-container">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4 px-2">
              <h1 className="text-2xl md:text-3xl font-bold ">{t("games.xox.name")}</h1>
            </div>
          </div>

          <div className="flex flex-col md:flex-row w-full gap-4">
            <div className="bg-card border border-border  rounded-lg shadow-lg overflow-hidden w-full md:w-[70%] pb-2 ">
              <div className="bg-muted/50 p-2 flex flex-wrap items-center justify-between gap-1 border-b border-border">
                <div className="flex items-center gap-2">
                  {!winner && (
                    <Button variant="outline" size="sm">
                      {getCurrentPlayerDisplay()}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={changeGameMode}
                    className="flex items-center gap-2"
                  >
                    {gameMode === "human-vs-computer" ? (
                      <Computer className="h-4 w-4" />
                    ) : (
                      <Users className="h-4 w-4" />
                    )}
                    {gameMode === "human-vs-computer"
                      ? t("common.vsComputer")
                      : t("common.vsHuman")}
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInstructions(true)}
                  className="bg-muted flex items-center gap-2"
                >
                  <HelpCircle className="mr-1 h-4 w-4" /> {t("common.help")}
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-1 aspect-square max-w-xs mx-auto my-5">
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

              <div className="flex justify-center   ">
                <button
                  onClick={resetGame}
                  className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 "
                >
                  {t("common.newGame")}
                </button>
              </div>
            </div>

            <div className="w-full md:w-[30%]">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t("common.howToPlay")}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <p className="text-muted-foreground mb-4">
                    {gameMode === "human-vs-computer"
                      ? t("common.youVsComputer")
                      : t("common.playerVsPlayer")}
                  </p>
                  {getInstructions()}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Game Mode Selection Dialog */}
        <Dialog open={showModeSelection} onOpenChange={setShowModeSelection}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("common.chooseGameMode")}</DialogTitle>
              <DialogDescription>
                {t("common.selectHowYouWantToPlay")} {t("games.xox.name")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <Button
                onClick={() => selectGameMode("human-vs-computer")}
                className="w-full flex items-center gap-3 h-16 text-left justify-start"
                variant="outline"
              >
                <Computer className="h-8 w-8" />
                <div>
                  <div className="font-semibold">{t("common.humanVsComputer")}</div>
                  <div className="text-sm text-muted-foreground">
                    {t("common.playAgainstTheComputer")}
                  </div>
                </div>
              </Button>
              <Button
                onClick={() => selectGameMode("human-vs-human")}
                className="w-full flex items-center gap-3 h-16 text-left justify-start"
                variant="outline"
              >
                <Users className="h-8 w-8" />
                <div>
                  <div className="font-semibold">{t("common.humanVsHuman")}</div>
                  <div className="text-sm text-muted-foreground">
                    {t("common.playWithAFriend")}
                  </div>
                </div>
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Instructions Dialog */}
        <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
          <DialogContent>
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
    </Layout>
  );
};

export default TicTacToe;
