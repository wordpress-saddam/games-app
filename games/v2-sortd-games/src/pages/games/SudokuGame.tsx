import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import Layout from "../../components/Layout";
import { useUser } from "../../context/UserContext";
import GamesServices from "../../../v2-services/games-service";
import {
  RefreshCw,
  Clock,
  HelpCircle,
  Trophy,
  Settings,
  Check,
  Delete,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { useGameSchema } from "../../hooks/useGameSchema";
import GamesMainHeadline from "../../components/ui/GamesMainHeadline";
import MostReadSidebar from "@/components/MostReadSidebar";
import SudokuImage from "../../assets/tile-merge.png";
import BackToHome from "../../components/ui/BackToHome";
import LeaderboardButton from "../../components/ui/LeaderboardButton";
import HowToPlayInstruction from "../../components/ui/HowToPlayInstruction";
import { LightButton, BlueButton, ResetButton } from "../../components/ui/GamesButton";

type Difficulty = "easy" | "medium" | "hard" | "expert";

const SudokuGame = () => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  // Game schema for SEO
  const baseUrl = typeof window !== "undefined" 
    ? `${window.location.protocol}//${window.location.host}` 
    : "https://asharqgames-uat.sortd.pro";
  const gameUrl = `${baseUrl}${location.pathname}${location.search ? location.search : ""}`;
  const gameName = "Sudoku";
  
  useGameSchema(
    {
      name: gameName,
      headline: `${gameName} - Asharq Games`,
      description: "Play Sudoku to test your logic skills!",
      url: gameUrl,
      image: `${baseUrl}/assets/sudoku.jpg`,
      isAccessibleForFree: true,
    },
  );
  // Board state
  const [board, setBoard] = useState<number[][]>(
    Array(9)
      .fill(0)
      .map(() => Array(9).fill(0))
  );
  const [solution, setSolution] = useState<number[][]>([]);
  const [originalBoard, setOriginalBoard] = useState<boolean[][]>(
    Array(9)
      .fill(false)
      .map(() => Array(9).fill(false))
  );
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(
    null
  );
  const [notes, setNotes] = useState<number[][][]>(
    Array(9)
      .fill(0)
      .map(() =>
        Array(9)
          .fill(0)
          .map(() => [])
      )
  );
  const [noteMode, setNoteMode] = useState(false);

  // Game state
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [time, setTime] = useState(0);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  const [dialog, setDialog] = useState(false);
  // UI state
  const [showDifficulty, setShowDifficulty] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [conflicts, setConflicts] = useState<{ [key: string]: boolean }>({});
  const [showCelebration, setShowCelebration] = useState(false);


  const audioContextRef = useRef<AudioContext | null>(null);



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



  // Format the time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Small presentational helper to align instruction rows
  const ControlRow = ({ action, keyHint }: { action: React.ReactNode; keyHint: React.ReactNode }) => {
    const { t } = useTranslation();
    return (
      <div className="flex items-center justify-between px-3 py-2">
        <span className="font-medium text-white">{action}</span>
        <span className="text-white/80">{keyHint}</span>
      </div>
    );
  };

   // Small presentational helper to align instruction rows
   const ControlRowBlack = ({ action, keyHint }: { action: React.ReactNode; keyHint: React.ReactNode }) => {
    const { t } = useTranslation();
    return (
      <div className="flex items-center justify-between px-3 py-2">
        <span className="font-medium text-foreground">{action}</span>
        <span className="text-foreground/70">{keyHint}</span>
      </div>
    );
  };

  const insertGameScore = useCallback(
    async (finalScore: number) => {
      const data = {
        score: finalScore,
        game_id: "5c693dd4-0af5-4b9b-8bb1-1d1017257fd1",
        game_type: "sudoku",
        user_name: user?.username,
        user: user?.user_id,
        email: user?.email,

      };

      try {
        const res = await GamesServices.insertScore(data);
        handleGameComplete();
      } catch (error) {
        console.error("Failed to insert game score:", error);
        // Still complete the game even if score insertion fails
        handleGameComplete();
      }
    },
    [user?.username, user?.user_id]
  );

  // Generate a valid Sudoku board
  const generateSudoku = useCallback((difficulty: Difficulty) => {
    // Create a solved board first
    const newSolution = Array(9)
      .fill(0)
      .map(() => Array(9).fill(0));

    // Helper function to check if a number can be placed at a position
    const isValid = (
      board: number[][],
      row: number,
      col: number,
      num: number
    ) => {
      // Check row
      for (let x = 0; x < 9; x++) {
        if (board[row][x] === num) return false;
      }

      // Check column
      for (let x = 0; x < 9; x++) {
        if (board[x][col] === num) return false;
      }

      // Check 3x3 box
      const boxRow = Math.floor(row / 3) * 3;
      const boxCol = Math.floor(col / 3) * 3;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          if (board[boxRow + i][boxCol + j] === num) return false;
        }
      }

      return true;
    };

    // Solve the board using backtracking
    const solve = (board: number[][]): boolean => {
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (board[row][col] === 0) {
            const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
            for (let i = nums.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [nums[i], nums[j]] = [nums[j], nums[i]];
            }

            for (const num of nums) {
              if (isValid(board, row, col, num)) {
                board[row][col] = num;

                if (solve(board)) {
                  return true;
                }

                board[row][col] = 0;
              }
            }

            return false;
          }
        }
      }

      return true;
    };

    // Generate solved board
    solve(newSolution);
    setSolution(JSON.parse(JSON.stringify(newSolution)));

    // Create a board with some cells revealed based on difficulty
    const newBoard = JSON.parse(JSON.stringify(newSolution));
    const newOriginalBoard = Array(9)
      .fill(false)
      .map(() => Array(9).fill(false));

    // Determine how many cells to remove based on difficulty
    let cellsToRemove;
    switch (difficulty) {
      case "easy":
        cellsToRemove = 40;
        break;
      case "medium":
        cellsToRemove = 50;
        break;
      case "hard":
        cellsToRemove = 55;
        break;
      case "expert":
        cellsToRemove = 60;
        break;
      default:
        cellsToRemove = 40;
    }

    // Remove cells randomly
    const cellsToRemoveList: [number, number][] = [];
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        cellsToRemoveList.push([i, j]);
      }
    }

    // Shuffle the list
    for (let i = cellsToRemoveList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cellsToRemoveList[i], cellsToRemoveList[j]] = [
        cellsToRemoveList[j],
        cellsToRemoveList[i],
      ];
    }

    // Remove cells
    for (let i = 0; i < cellsToRemove; i++) {
      const [row, col] = cellsToRemoveList[i];
      newBoard[row][col] = 0;
      newOriginalBoard[row][col] = false;
    }

    // Mark remaining cells as original
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (newBoard[i][j] !== 0) {
          newOriginalBoard[i][j] = true;
        }
      }
    }

    setBoard(newBoard);
    setOriginalBoard(newOriginalBoard);
    setNotes(
      Array(9)
        .fill(0)
        .map(() =>
          Array(9)
            .fill(0)
            .map(() => [])
        )
    );
    setSelectedCell(null);
    setConflicts({});
    setGameCompleted(false);

    return newBoard;
  }, []);

  // Check for conflicts - ONLY rows and columns (no 3x3 boxes)
  const checkAllConflicts = (
    currentBoard: number[][],
    conflictsObj: { [key: string]: boolean }
  ) => {
    // Clear all existing conflicts
    Object.keys(conflictsObj).forEach((key) => {
      delete conflictsObj[key];
    });

    // Check all cells for conflicts
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const num = currentBoard[row][col];
        if (num === 0) continue; // Skip empty cells

        // Check row conflicts
        for (let c = 0; c < 9; c++) {
          if (c !== col && currentBoard[row][c] === num) {
            conflictsObj[`${row}-${col}`] = true;
            conflictsObj[`${row}-${c}`] = true;
          }
        }

        // Check column conflicts
        for (let r = 0; r < 9; r++) {
          if (r !== row && currentBoard[r][col] === num) {
            conflictsObj[`${row}-${col}`] = true;
            conflictsObj[`${r}-${col}`] = true;
          }
        }
      }
    }
  };

  // Start a new game
  const newGame = (diff: Difficulty) => {
    if (timer) clearInterval(timer);

    setDifficulty(diff);
    setTime(0);
    setGameCompleted(false);
    setNoteMode(false);

    generateSudoku(diff);
    setGameStarted(true);

    // Start the timer
    const newTimer = setInterval(() => {
      setTime((prev) => prev + 1);
    }, 1000);

    setTimer(newTimer);
  };

  // Reset the current game
  const resetGame = () => {
    const resetBoard = Array(9)
      .fill(0)
      .map(() => Array(9).fill(0));

    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (originalBoard[i][j]) {
          resetBoard[i][j] = board[i][j];
        } else {
          resetBoard[i][j] = 0;
        }
      }
    }

    setBoard(resetBoard);
    setNotes(
      Array(9)
        .fill(0)
        .map(() =>
          Array(9)
            .fill(0)
            .map(() => [])
        )
    );
    setSelectedCell(null);
    setConflicts({});
    setGameCompleted(false);
    setTime(0);
  };

  // Handle cell selection
  const handleCellClick = (row: number, col: number) => {
    if (originalBoard[row][col] || gameCompleted) return;
    setSelectedCell([row, col]);
  };

  // Handle number input
  const handleNumberInput = (num: number) => {
    if (!selectedCell || gameCompleted) return;

    const [row, col] = selectedCell;

    // Check if the cell is part of the original board
    if (originalBoard[row][col]) return;

    // Handle note mode
    if (noteMode) {
      setNotes((prev) => {
        const newNotes = [...prev];
        const cellNotes = [...newNotes[row][col]];

        // Toggle the note
        const index = cellNotes.indexOf(num);
        if (index > -1) {
          cellNotes.splice(index, 1);
        } else {
          cellNotes.push(num);
        }

        newNotes[row][col] = cellNotes;
        return newNotes;
      });
      return;
    }

    // Clear notes for this cell when entering a number
    setNotes((prev) => {
      const newNotes = [...prev];
      newNotes[row][col] = [];
      return newNotes;
    });

    // Update the board
    const newBoard = [...board.map((r) => [...r])];
    const oldValue = newBoard[row][col];
    newBoard[row][col] = num === oldValue ? 0 : num;

    setBoard(newBoard);

    // Recalculate all conflicts for the entire board
    const newConflicts: { [key: string]: boolean } = {};
    checkAllConflicts(newBoard, newConflicts);
    setConflicts(newConflicts);

    // Check if the board is complete
    setTimeout(() => {
      if (isBoardCompleteWithBoard(newBoard, newConflicts)) {
        const finalScore = time;
        insertGameScore(finalScore);
      }
    }, 100);
  };

  // Check if the board is complete and correct - ONLY rows and columns
  const isBoardCompleteWithBoard = (
    currentBoard: number[][],
    currentConflicts: { [key: string]: boolean }
  ) => {
    // Check if all cells are filled
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (currentBoard[i][j] === 0) return false;
      }
    }

    // Check if there are no conflicts (only row and column conflicts now)
    if (Object.keys(currentConflicts).length > 0) return false;

    // Additional validation: check that each row and column contains 1-9
    for (let i = 0; i < 9; i++) {
      const rowSet = new Set();
      const colSet = new Set();

      for (let j = 0; j < 9; j++) {
        rowSet.add(currentBoard[i][j]);
        colSet.add(currentBoard[j][i]);
      }

      if (rowSet.size !== 9 || colSet.size !== 9) return false;
    }

    return true;
  };

  // Handle game completion
  const handleGameComplete = () => {
    if (timer) {
      clearInterval(timer);
      setTimer(null);
    }
    setGameCompleted(true);
    setShowCongratulations(true);
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 3000);
    initAudio();
    playSuccessSound();
  };

  // Auto-start the game with 'easy' difficulty
  useEffect(() => {
    if (!gameStarted && !gameCompleted) {
      newGame("easy");
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, []);

  // Highlight cells in the same row and column only
  const getHighlightClass = (row: number, col: number) => {
    if (!selectedCell) return "";

    const [selectedRow, selectedCol] = selectedCell;

    // Same row or column
    if (row === selectedRow || col === selectedCol) {
      return "bg-muted/40";
    }

    return "";
  };

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedCell || gameCompleted) return;

      const key = e.key;

      if (/[1-9]/.test(key)) {
        const num = parseInt(key);
        handleNumberInput(num);
      } else if (key === "Backspace" || key === "Delete" || key === "0") {
        handleNumberInput(0);
      } else if (key.startsWith("Arrow")) {
        const [row, col] = selectedCell;
        let newRow = row;
        let newCol = col;

        switch (key) {
          case "ArrowUp":
            newRow = Math.max(0, row - 1);
            break;
          case "ArrowDown":
            newRow = Math.min(8, row + 1);
            break;
          case "ArrowLeft":
            newCol = Math.max(0, col - 1);
            break;
          case "ArrowRight":
            newCol = Math.min(8, col + 1);
            break;
        }

        if (newRow !== row || newCol !== col) {
          setSelectedCell([newRow, newCol]);
        }
      } else if (key === "n") {
        setNoteMode((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedCell, gameCompleted]);

  // Get cell background color
  const getCellBackgroundClass = (row: number, col: number) => {
    // Cell is part of the original board
    if (originalBoard[row][col]) {
      return "bg-accent/20 font-bold";
    }

    // Cell has an error
    if (conflicts[`${row}-${col}`]) {
      return "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400";
    }

    // Cell is selected
    if (selectedCell && selectedCell[0] === row && selectedCell[1] === col) {
      return "bg-primary/10 shadow-inner border-[#63AAE4]";
    }

    // Highlighted cell
    const highlightClass = getHighlightClass(row, col);
    if (highlightClass) {
      return highlightClass;
    }

    const isAltSubgrid = (Math.floor(row / 3) + Math.floor(col / 3)) % 2 === 0;
    return isAltSubgrid ? "bg-muted/20" : "";
  };

  const leaderboardUrl = `/games/leaderboard?${new URLSearchParams({
    name: t("games.sudoku.name"),
    duration: "month",
    game_type: "sudoku",
    top_k: "10",
    sort_order: "asc",
    score_type: "min",
  }).toString()}`;

  const handleLeaderBoard = useCallback(() => {
    if (showCongratulations || gameCompleted) {
      navigate(leaderboardUrl);
    } else {
      setDialog(true);
    }
  }, [showCongratulations, gameCompleted, navigate, leaderboardUrl]);

  if (!user) {
    navigate("/");
  }

  return (
    <Layout>
      <section className="py-8" style={{ fontFamily: "'Noto Naskh Arabic', system-ui, sans-serif" }}>
        <div className="container mx-auto px-4" dir={isArabic ? "rtl" : "ltr"}>
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

          <div className="game-container3" translate="no">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
              {/* Main Content: Games Grid - Takes 2 columns on large screens */}
              <div className="lg:col-span-2">
                {/* Header Section */}
                <div className="mb-6" translate="no">
                  <GamesMainHeadline title={t("common.games")} width={isArabic ? 120 : 144} />
                  <div className={`flex items-center justify-between mb-4 px-2 ${isArabic ? "text-right" : "text-left"}`} translate="no">
                    <div className="flex items-center gap-2">
                      <img src={SudokuImage} alt="Sudoku Logo" className="w-20 h-20" />
                      <h2 className="text-2xl md:text-3xl font-bold" translate="no">{t("games.sudoku.name")}</h2>
                    </div>
                    <div className="flex items-center gap-4">
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
                  <div className="bg-[#F0F0F0] p-4 flex flex-wrap items-center justify-between gap-1 border-b border-[#DEDEDE] flex-row-reverse">
                    <div className="flex items-center gap-2">
                      {/* Difficulty Button */}
                      <BlueButton onClick={() => setShowDifficulty(true)}>
                        {t(`games.sudoku.${difficulty}`)}
                        <Settings className="h-4 w-4" />
                      </BlueButton>
                      {/* Help Button */}
                      <LightButton onClick={() => setShowInstructions(true)}>
                        {t("common.help")}
                        <HelpCircle className="h-4 w-4" />
                      </LightButton>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Timer Button */}
                      <LightButton>
                        {formatTime(time)}
                        <Clock className="h-4 w-4" />
                      </LightButton>
                      {/* Reset Button */}
                      <LightButton onClick={resetGame}>
                        {t("common.reset")}
                        <RefreshCw className="h-4 w-4" />
                      </LightButton>
                    </div>
                  </div>

                  {/* Sudoku board */}
                  <div className="p-4 flex justify-center">
                    <div className="bg-card border border-border inline-grid grid-cols-9 gap-0 overflow-hidden shadow-md" dir="ltr">
                      {Array.from({ length: 9 }).map((_, row) =>
                        Array.from({ length: 9 }).map((_, col) => (
                          <div
                            key={`${row}-${col}`}
                            className={`
                              w-8 h-8 sm:w-11 sm:h-11 flex items-center justify-center text-base font-medium 
                              border border-border dark:border-white/10 cursor-pointer select-none
                              ${getCellBackgroundClass(row, col)}
                              ${(row + 1) % 3 === 0 && row < 8 ? "border-b-[4px]" : ""}
                              ${(col + 1) % 3 === 0 && col < 8 ? "border-r-[4px]" : ""}
                              ${row % 3 === 0 ? "border-t-[4px]" : ""}
                              ${col % 3 === 0 ? "border-l-[4px]" : ""}
                            `}
                            onClick={() => handleCellClick(row, col)}
                          >
                            {board[row][col] > 0
                              ? board[row][col]
                              : notes[row][col].length > 0 && (
                                <div className="grid grid-cols-3 gap-0 w-full h-full p-0.5">
                                  {Array.from({ length: 9 }).map((_, i) => (
                                    <div
                                      key={i}
                                      className="flex items-center justify-center"
                                    >
                                      <span
                                        className={`text-[8px] ${notes[row][col].includes(i + 1)
                                            ? "text-muted-foreground"
                                            : "text-transparent"
                                          }`}
                                      >
                                        {i + 1}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Number input pad */}
                  <div className="p-4 flex justify-center">
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                      {Array.from({ length: 9 }).map((_, i) => (
                        <Button
                          key={i}
                          variant="outline"
                          className={`w-12 h-12 text-lg font-bold ${noteMode ? "border-primary/50" : ""
                            }`}
                          onClick={() => handleNumberInput(i + 1)}
                        >
                          {i + 1}
                        </Button>
                      ))}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-12 h-12 text-lg font-bold text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-900/40 dark:hover:bg-red-900/20"
                            onClick={() => handleNumberInput(0)}
                            aria-label={t("accessibility.clearCell")}
                            title={t("accessibility.clearCell")}
                          >
                            <Delete className="w-5 h-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t("accessibility.clearCell")}</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </div>
            
              

              {/* Most Read Sidebar - Takes 1 column on large screens */}
              <div className="lg:col-span-1">
                <HowToPlayInstruction 
                  title={t("games.sudoku.howToPlayNumbersudoku") || t("common.howToPlay")}
                  text=""
                >
                  <div className="text-[16px] space-y-3 text-white">
                    <p className="leading-relaxed">
                      {t("games.sudoku.fillInTheGridSoThatEveryRowAndColumnContainsTheDigits1Through9")}
                    </p>
                    <p className="leading-relaxed">
                      {t("games.sudoku.numbersCantRepeatInAnyRowOrColumn")}
                    </p>
                    <p className="leading-relaxed">
                      {t("games.sudoku.redColorInTheBackgroundIndicatesThatAWrongNumberHasBeenFilled")}
                    </p>
                    <div className="pt-2">
                      <h3 className="font-semibold mb-2 text-white">{t("games.sudoku.controls")}</h3>
                      <div className="rounded-md border border-white/30 divide-y divide-white/30 overflow-hidden bg-white/10">
                        <ControlRow action={t("games.sudoku.selectCell")} keyHint={t("games.sudoku.clickACell")} />
                        <ControlRow action={t("games.sudoku.enterANumber")} keyHint={t("games.sudoku.keys19")} />
                        <ControlRow action={t("games.sudoku.clearACell")} keyHint={t("games.sudoku.delBackspace")} />
                        <ControlRow action={t("games.sudoku.navigateCells")} keyHint={t("games.sudoku.arrowKeys")} />
                        <ControlRow action={t("games.sudoku.toggleNotesMode")} keyHint={t("games.sudoku.nKey")} />
                      </div>
                    </div>
                  </div>
                </HowToPlayInstruction>
                <MostReadSidebar />
              </div>
            </div>
          </div>
        </div>

          {/* Difficulty selection dialog */}
          <Dialog open={showDifficulty} onOpenChange={setShowDifficulty}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("common.selectDifficultyLevel")}</DialogTitle>
                <DialogDescription>
                  {t("games.sudoku.selectADifficultyLevelForANewGame")}
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <Button
                  variant={difficulty === "easy" ? "default" : "outline"}
                  onClick={() => {
                    newGame("easy");
                    setShowDifficulty(false);
                  }}
                  className="h-16"
                >
                  {t("games.sudoku.easy")}
                </Button>
                <Button
                  variant={difficulty === "medium" ? "default" : "outline"}
                  onClick={() => {
                    newGame("medium");
                    setShowDifficulty(false);
                  }}
                  className="h-16"
                >
                  {t("games.sudoku.medium")}
                </Button>
                <Button
                  variant={difficulty === "hard" ? "default" : "outline"}
                  onClick={() => {
                    newGame("hard");
                    setShowDifficulty(false);
                  }}
                  className="h-16"
                >
                  {t("games.sudoku.hard")}
                </Button>
                <Button
                  variant={difficulty === "expert" ? "default" : "outline"}
                  onClick={() => {
                    newGame("expert");
                    setShowDifficulty(false);
                  }}
                  className="h-16"
                >
                  {t("games.sudoku.expert")}
                </Button>
              </div>
              <DialogFooter>
                <Button
                  variant="ghost"
                  onClick={() => setShowDifficulty(false)}
                >
                  {t("common.cancel")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        {/* How to play dialog */}
        <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
          <DialogContent className="sm:max-w-md" dir={isArabic ? "rtl" : "ltr"}>
              <DialogHeader>
                <DialogTitle>{t("games.sudoku.howToPlayNumbersudoku")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="leading-relaxed text-foreground/80">
                  {t("games.sudoku.fillInTheGridSoThatEveryRowAndColumnContainsTheDigits1Through9")}
                </p>
                <p className="leading-relaxed text-foreground/80">
                  {t("games.sudoku.numbersCantRepeatInAnyRowOrColumn")}
                </p>

                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">{t("games.sudoku.controls")}</h3>
                  <div className="rounded-md border border-border divide-y divide-border overflow-hidden bg-muted/30">
                    <ControlRowBlack action={t("games.sudoku.selectCell")} keyHint={t("games.sudoku.clickACell")} />
                    <ControlRowBlack action={t("games.sudoku.enterANumber")} keyHint={t("games.sudoku.keys19")} />
                    <ControlRowBlack action={t("games.sudoku.clearACell")} keyHint={t("games.sudoku.delBackspace")} />
                    <ControlRowBlack action={t("games.sudoku.navigateCells")} keyHint={t("games.sudoku.arrowKeys")} />
                    <ControlRowBlack action={t("games.sudoku.toggleNotesMode")} keyHint={t("games.sudoku.nKey")} />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">{t("games.sudoku.tips")}</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm pl-4">
                    <li>{t("games.sudoku.numbersCantRepeatInAnyRowOrColumn")}</li>
                    <li>{t("games.sudoku.useNotesToTrackPossibleNumbersForEachCell")}</li>
                    <li>{t("games.sudoku.lookForCellsThatCanOnlyContainOnePossibleNumber")}</li>
                    <li>{t("games.sudoku.theOriginalNumbersCantBeChanged")}</li>
                  </ul>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => setShowInstructions(false)}>
                  {t("common.gotIt")}
                </Button>
              </DialogFooter>
            </DialogContent>

          </Dialog>

        {/* Congratulations dialog */}
        <Dialog
          open={showCongratulations}
          onOpenChange={setShowCongratulations}
        >
          <DialogContent dir={isArabic ? "rtl" : "ltr"}>
              <DialogHeader>
                <DialogTitle>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    <span>{t("games.sudoku.congratulations")}</span>
                  </div>
                </DialogTitle>
                <DialogDescription>
                  {t("games.sudoku.youSolvedTheNumbersudoku")}
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-center py-4">
                <div className="bg-muted/50 rounded-lg p-4 w-full max-w-xs">
                  <div className="text-center space-y-2">
                    <div className="text-sm text-muted-foreground">
                      {t("games.sudoku.difficulty")}
                    </div>
                    <div className="font-medium capitalize">{difficulty === "easy" ? t("games.sudoku.easy") : difficulty === "medium" ? t("games.sudoku.medium") : difficulty === "hard" ? t("games.sudoku.hard") : t("games.sudoku.expert")}</div>
                    <Separator />
                    <div className="text-sm text-muted-foreground">{t("common.time")}</div>
                    <div className="font-medium">{formatTime(time)}</div>
                    <Separator />
                    <div className="flex justify-center mt-4">
                      <Check className="h-8 w-8 text-green-500" />
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter className="flex gap-2">
                <Button
                  onClick={() => {
                    newGame(difficulty);
                    setShowCongratulations(false);
                  }}
                >
                  {t("games.sudoku.newGameSameDifficulty")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCongratulations(false);
                    setShowDifficulty(true);
                  }}
                >
                  {t("games.sudoku.chooseDifficulty")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        <Dialog open={dialog} onOpenChange={setDialog}>
          <DialogContent dir={isArabic ? "rtl" : "ltr"}>
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
                <Button onClick={() => setDialog(false)}>{t("common.noResume")}</Button>
                <Button
                  className="bg-gray-500"
                  onClick={() => {
                    setDialog(false);
                    navigate(leaderboardUrl);
                  }}
                >
                  {t("common.yesLeave")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
      </section>
    </Layout>
  );
};

export default SudokuGame;