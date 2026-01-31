import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import GamesServices from "../../../v2-services/games-service";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Trophy, HelpCircle, RefreshCw, Lightbulb, Check, Clock, Delete, Eye } from "lucide-react";
import { ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useGameSchema } from "../../hooks/useGameSchema";
import GamesMainHeadline from "../../components/ui/GamesMainHeadline";
import MostReadSidebar from "@/components/MostReadSidebar";
import CrosswordImage from "../../assets/crossword.png";
import BackToHome from "../../components/ui/BackToHome";
import LeaderboardButton from "../../components/ui/LeaderboardButton";
import HowToPlayInstruction from "../../components/ui/HowToPlayInstruction";
import { LightButton, BlueButton, GradientButton } from "../../components/ui/GamesButton";
import ReadmoreArticleWidget from "@/components/ui/ReadmoreArticleWidget";
type Clue = { word: string; clue: string };
type CrosswordArticle = {
  title: string;
  clues: Clue[];
  project_id: string;
  game_type: string;
  category_id: string;
  link: string;
  image_url: string;
};

type Direction = "across" | "down";

type PlacedWord = {
  number: number;
  answer: string;
  clue: string;
  direction: Direction;
  row: number;
  col: number;
  articleUrl?: string;
};

type CrosswordPuzzle = {
  grid: string[][];
  words: PlacedWord[];
};

let GRID_SIZE = 10; // Start with 10, can be increased
const MAX_WORDS = 10;
const GAME_TYPE = "crossword";

const ARABIC_ALPHABET = "ابتثجحخدذرزسشصضطظعغفقكلمنهوي".split('');
const ENGLISH_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');

// Normalize Arabic text by removing diacritics and handling hamza variations
const sanitizeArabic = (s: string) => {
  return (s || "")
    .replace(/[ًٌٍَُِّْٰ]/g, "") // Remove Arabic diacritics
    .replace(/[أإآ]/g, "ا") // Normalize alef variations
    .replace(/[ؤئ]/g, "ء")  // Normalize hamza-on-chair
    .replace(/ء/g, "")    // Remove standalone hamza
    .replace(/[ىئ]/g, "ي") // Normalize yaa variations
    .replace(/ة/g, "ه") // Normalize taa marbuta
    .replace(/\s+/g, "")
    .toUpperCase();
};

const buildCrosswordFromClues = (clues: Clue[]): CrosswordPuzzle => {
  const candidates = clues
    .map(c => ({ answer: sanitizeArabic(c.word), clue: c.clue }))
    .filter(p => p.answer.length >= 3)
    .sort((a, b) => b.answer.length - a.answer.length)
    .slice(0, MAX_WORDS);

  // Dynamically adjust grid size
  const longestWordLength = candidates.length > 0 ? candidates[0].answer.length : 0;
  if (longestWordLength > 10) {
    GRID_SIZE = Math.min(15, longestWordLength + 2);
  } else {
    GRID_SIZE = 10;
  }
    
  const grid: (string | null)[][] = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => null)
  );

  const words: PlacedWord[] = [];
  let number = 1;

  const placeWord = (word: { answer: string; clue: string }) => {
    if (words.length >= MAX_WORDS) return;

    if (words.length === 0) {
      // Place the first word in the middle
      const dir: Direction = word.answer.length > GRID_SIZE / 2 ? 'down' : 'across';
      const row = Math.floor((GRID_SIZE - (dir === 'down' ? word.answer.length : 1)) / 2);
      const col = Math.floor((GRID_SIZE - (dir === 'across' ? word.answer.length : 1)) / 2);
      for (let i = 0; i < word.answer.length; i++) {
        if (dir === 'across') grid[row][col + i] = word.answer[i];
        else grid[row + i][col] = word.answer[i];
      }
      words.push({ ...word, direction: dir, row, col, number: number++ });
      return;
    }

    let bestPlacement: { row: number; col: number; direction: Direction; score: number } | null = null;

    for (const existingWord of words) {
      for (let i = 0; i < existingWord.answer.length; i++) {
        for (let j = 0; j < word.answer.length; j++) {
          if (existingWord.answer[i] === word.answer[j]) {
            const newDirection: Direction = existingWord.direction === 'across' ? 'down' : 'across';
            let row: number, col: number;

            if (newDirection === 'across') {
              row = existingWord.row;
              col = (existingWord.direction === 'across' ? existingWord.col + i : existingWord.col) - j;
            } else {
              row = (existingWord.direction === 'down' ? existingWord.row + i : existingWord.row) - j;
              col = existingWord.col;
            }

            // Check validity
            if (row < 0 || col < 0 || (newDirection === 'across' && col + word.answer.length > GRID_SIZE) || (newDirection === 'down' && row + word.answer.length > GRID_SIZE)) {
              continue;
            }

            let isValid = true;
            let score = 1; // Base score for one intersection
            for (let k = 0; k < word.answer.length; k++) {
              const r = newDirection === 'down' ? row + k : row;
              const c = newDirection === 'across' ? col + k : col;

              if (grid[r][c] && grid[r][c] !== word.answer[k]) {
                isValid = false;
                break;
              }
              if (grid[r][c] && grid[r][c] === word.answer[k]) {
                score++; // Higher score for more intersections
              }
            }

            if (isValid) {
              if (!bestPlacement || score > bestPlacement.score) {
                bestPlacement = { row, col, direction: newDirection, score };
              }
            }
          }
        }
      }
    }

    if (bestPlacement) {
      const { row, col, direction } = bestPlacement;
      for (let i = 0; i < word.answer.length; i++) {
        if (direction === 'across') grid[row][col + i] = word.answer[i];
        else grid[row + i][col] = word.answer[i];
      }
      words.push({ ...word, ...bestPlacement, number: number++ });
    } else {
      // Fallback: place word without intersection if no valid spot was found
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          // Try placing across
          if (c + word.answer.length <= GRID_SIZE && !grid[r][c]) {
            let canPlace = true;
            for (let i = 0; i < word.answer.length; i++) {
              if (grid[r][c + i]) { canPlace = false; break; }
            }
            if (canPlace) {
              for (let i = 0; i < word.answer.length; i++) {
                grid[r][c + i] = word.answer[i];
              }
              words.push({ ...word, direction: 'across', row: r, col: c, number: number++ });
              return; // Word placed, exit
            }
          }
        }
      }
    }
  };

  for (const word of candidates) {
    placeWord(word);
  }

  const solution: string[][] = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill("#"));
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const ch = grid[r][c];
      solution[r][c] = ch ? ch : "#";
    }
  }
  return { grid: solution, words };
};

type CrosswordProps = {
  games: CrosswordArticle[];
  gameId?: string;
};

const Crossword: React.FC<CrosswordProps> = ({ games, gameId }) => {
  console.log("[Saddam] games", games);
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isArticleView = searchParams.get("src") === "article";

  // State for current game index
  const [currentGameIndex, setCurrentGameIndex] = useState(0);

  // Memoized current game data
  const current = useMemo(() => games?.[currentGameIndex], [games, currentGameIndex]);
  const title = current?.title || t("games.crossword.name");
  
  // Game schema for SEO
  const baseUrl = typeof window !== "undefined" 
    ? `${window.location.protocol}//${window.location.host}` 
    : "https://asharqgames-uat.sortd.pro";
  const gameUrl = `${baseUrl}${location.pathname}${location.search ? location.search : ""}`;
  const gameName = t("games.crossword.name");
  
  useGameSchema(
    {
      name: gameName,
      headline: `${gameName} - ${t("common.asharqGames")}`,
      description: t("games.crossword.description"),
      url: gameUrl,
      image: `${baseUrl}/assets/crossword.jpg`,
      isAccessibleForFree: true,
    },
  );

  // Memoized puzzle generation
  const initialPuzzle = useMemo(() => buildCrosswordFromClues(current?.clues || []), [current]);

  const [puzzle, setPuzzle] = useState<CrosswordPuzzle>(initialPuzzle);
  const [userGrid, setUserGrid] = useState<string[][]>(() =>
    initialPuzzle.grid.map(row => row.map(ch => (ch === "#" ? "#" : "")))
  );
  const [selected, setSelected] = useState<{ row: number; col: number } | null>(null);
  const [direction, setDirection] = useState<Direction>("across");
  const [timer, setTimer] = useState<number>(0);
  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showSolution, setShowSolution] = useState(false); // This is for visual indication of solution
  const [showCongratulations, setShowCongratulations] = useState(false); // For user-solved game
  const [gameCompleted, setGameCompleted] = useState(false);
  const [showRevealConfirm, setShowRevealConfirm] = useState(false);
  
  // New states for solution reveal flow
  const [solutionRevealed, setSolutionRevealed] = useState(false); // Specific flag if solution was revealed
  const [showSolutionRevealedDialog, setShowSolutionRevealedDialog] = useState(false); // Dialog for revealed state

  useEffect(() => {
    const id = setInterval(() => setTimer(t => t + 1), 1000);
    setTimerId(id);
    return () => clearInterval(id);
  }, []);

  // Reset game function, can advance to next puzzle
  const resetGame = useCallback((advanceToNext = false) => {
    let nextIndex = currentGameIndex;
    if (advanceToNext) {
      nextIndex = (currentGameIndex + 1) % games.length;
      setCurrentGameIndex(nextIndex); // Update index state
    }
    const next = buildCrosswordFromClues(games?.[nextIndex]?.clues || []);
    setPuzzle(next);
    setUserGrid(next.grid.map(row => row.map(ch => (ch === "#" ? "#" : ""))));
    setSelected(null);
    setDirection("across");
    setTimer(0);
    setHintsUsed(0);
    setShowSolution(false);
    setGameCompleted(false);
    if (timerId) clearInterval(timerId);
    const id = setInterval(() => setTimer(t => t + 1), 1000);
    setTimerId(id);
  }, [currentGameIndex, games, timerId]);

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleCellClick = (row: number, col: number) => {
    if (puzzle.grid[row][col] === "#" || gameCompleted) return; // Disable if game is completed (solved or revealed)
    if (selected && selected.row === row && selected.col === col) {
      setDirection(d => (d === "across" ? "down" : "across"));
    } else {
      setSelected({ row, col });
    }
  };
  
  const handleKeyPress = (key: string) => {
    if (!selected || gameCompleted || showSolution) return;
    const { row, col } = selected;
    if (puzzle.grid[row][col] === "#") return;

    // Handle Arabic letters and English letters
    const arabicChar = /^[\u0600-\u06FF]$/;
    if (arabicChar.test(key) || /^[a-zA-Z]$/.test(key)) {
      const ch = sanitizeArabic(key);
      setUserGrid(prev => {
        const next = prev.map(r => [...r]);
        next[row][col] = ch;
        return next;
      });
      // Move to next cell based on direction (RTL aware)
      if (direction === "across") {
        if (col + 1 < GRID_SIZE && puzzle.grid[row][col + 1] !== '#') {
          setSelected({ row, col: col + 1 });
        }
      } else if (direction === "down" && row + 1 < GRID_SIZE && puzzle.grid[row + 1][col] !== '#') {
        setSelected({ row: row + 1, col });
      }
    } else if (key === "Backspace" || key === "Delete") {
      setUserGrid(prev => {
        const next = prev.map(r => [...r]);
        next[row][col] = "";
        return next;
      });
    } else if (key.startsWith("Arrow")) {
      // Arrow keys for RTL
      if (key === "ArrowLeft" && col < GRID_SIZE - 1) setSelected({ row, col: col + 1 });
      if (key === "ArrowRight" && col > 0) setSelected({ row, col: col - 1 });
      if (key === "ArrowUp" && row > 0) setSelected({ row: row - 1, col });
      if (key === "ArrowDown" && row < GRID_SIZE - 1) setSelected({ row: row + 1, col });
    } else if (key === " ") {
      setDirection(d => (d === "across" ? "down" : "across"));
    };
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => handleKeyPress(e.key);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey); 
  }, [selected, direction, puzzle.grid, gameCompleted]); // Add gameCompleted to dependencies

  const isComplete = useMemo(() => {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (puzzle.grid[r][c] === "#") continue;
        if (!userGrid[r][c] || userGrid[r][c] !== puzzle.grid[r][c]) return false;
      }
    }
    return true;
  }, [userGrid, puzzle.grid]);

  // Handle game completion (user solved)
  useEffect(() => {
    if (isComplete && !solutionRevealed) { // Only trigger if solved by user, not revealed
      if (!gameCompleted) { // Only run once
        setGameCompleted(true);
        if (timerId) clearInterval(timerId);
        setShowCongratulations(true);

        if (hintsUsed <= 3) {
          const finalScore = Math.max(0, 1000 - timer - hintsUsed * 50);
          if (user?.user_id) {
            GamesServices.insertScore({
              score: finalScore,
              game_id: gameId,
              game_type: GAME_TYPE,
              user_name: user?.username,
              user: user?.user_id,
              email: user?.email,
            }).catch(err => console.error("Failed to insert crossword score:", err));
          }
        }
      }
    }
  }, [isComplete, timerId, timer, hintsUsed, user, gameId, gameCompleted, solutionRevealed]);

  const giveHintLetter = () => {
    if (!selected || gameCompleted) return; // Disable if game is completed
    const { row, col } = selected;
    if (puzzle.grid[row][col] === "#" || userGrid[row][col] === puzzle.grid[row][col]) return;
    setUserGrid(prev => {
      const next = prev.map(r => [...r]);
      next[row][col] = puzzle.grid[row][col];
      return next;
    });
    setHintsUsed(h => h + 1);
  };

  // Modified revealFullSolution
  const revealFullSolution = () => {
    setUserGrid(puzzle.grid.map(row => [...row]));
    setGameCompleted(true); // Game is completed (revealed)
    setShowSolution(true); // Visual flag for solution display
    setSolutionRevealed(true); // Specific flag for solution revealed state
    setShowRevealConfirm(false);
    if (timerId) {
      clearInterval(timerId);
    }
    setShowSolutionRevealedDialog(true); // Show new dialog for revealed state
  };

  const revealWord = () => {
    if (!selected || gameCompleted) return; // Disable if game is completed
    const target = puzzle.words.find(w => {
      if (w.direction === "across") {
        return selected.row === w.row && selected.col >= w.col && selected.col < w.col + w.answer.length && direction === "across";
      } else {
        return selected.col === w.col && selected.row >= w.row && selected.row < w.row + w.answer.length;
      }
    });
    if (!target) return;
    setUserGrid(prev => {
      const next = prev.map(r => [...r]);
      if (target.direction === "across") {
        for (let i = 0; i < target.answer.length; i++) next[target.row][target.col + i] = target.answer[i];
      } else {
        for (let i = 0; i < target.answer.length; i++) next[target.row + i][target.col] = target.answer[i];
      }
      return next;
    });
    setHintsUsed(h => h + Math.max(1, Math.ceil(target.answer.length / 2)));
  };

  const highlightCell = (row: number, col: number) => {
    if (!selected) return "";
    if (row === selected.row || col === selected.col) return "bg-muted/30";
    return "";
  };

  const cellNumberMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const w of puzzle.words) map[`${w.row}-${w.col}`] = w.number;
    return map;
  }, [puzzle.words]);

  const across = useMemo(() => puzzle.words.filter(w => w.direction === "across"), [puzzle.words]);
  const down = useMemo(() => puzzle.words.filter(w => w.direction === "down"), [puzzle.words]);

  const renderList = (list: typeof puzzle.words) => (
    <ul className="space-y-2">
      {list.map(w => (
        <li key={w.number} className="text-sm">
          <span className="font-semibold">{w.number}. {w.direction === "across" ? t("games.crossword.across") : t("games.crossword.down")}</span>{" "}
          <span className="text-foreground/80">{w.clue}</span>
        </li>
      ))}
    </ul>
  );

  // New function to move to next puzzle
  const moveToNextPuzzle = () => {
    setShowCongratulations(false);
    resetGame(true); // Pass true to advance to next game
    setShowSolutionRevealedDialog(false);
  };

  // New function for "Admire Puzzle"
  const admirePuzzle = () => {
    setShowSolutionRevealedDialog(false);
    // Game remains in revealed state, buttons will be disabled by gameCompleted=true
    // The "Reset" and "Next Puzzle" buttons will be added to the main UI.
  };

  if (!user && !isArticleView) {
    navigate("/"); // Redirect to home only if not in article view and not logged in
  }

  const leaderboardUrl = `/leaderboard?${new URLSearchParams({
    name: t("games.crossword.name"),
    duration: "month",
    game_type: GAME_TYPE,
    top_k: "10",
    sort_order: "desc",
    score_type: "max",
  }).toString()}`;

  return (
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
                    <img src={CrosswordImage} alt="Crossword Logo" className="w-20 h-20" />
                    <h2 className="text-xl md:text-3xl font-bold" translate="no">{t("games.crossword.name")}</h2>
                  </div>
                  <div className="flex w-full md:w-auto md:flex-row gap-2">
                    {/* Leaderboard Button */}
                    {!user?.isAnonymous && (
                      isArticleView ? (
                        <a
                          href="#"
                          className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold shadow-lg rounded-md px-3 py-2 flex items-center"
                          onClick={(e) => {
                            e.preventDefault();
                            if (!user?.username) {
                              // Handle registration if needed
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
                        <LeaderboardButton text={t("common.leaderboard")} leaderboardUrl={leaderboardUrl} />
                      )
                    )}
                    {/* Back to Home Button */}
                    <BackToHome text={t("common.backToHome")} />
                  </div>
                </div>
              </div>

              <hr className="w-full border-0 border-t-2 border-dotted border-gray-300 opacity-80" />

              {/* Game Content */}
              <div className="flex flex-col md:flex-row w-full gap-4 mt-8" translate="no">
                <div className="bg-card border border-[#DEDEDE] rounded-[5px] shadow-lg overflow-hidden pb-0 w-full md:w-[100%]" translate="no">
                  {/* Score and Round Info */}
                  <div
                    className="
                      bg-[#F0F0F0]
                      p-3 md:p-4
                      border-b border-[#DEDEDE]
                      flex flex-col gap-3
                      md:flex-row md:flex-wrap md:items-center md:justify-between
                      flex-row-reverse
                    "
                  >
                    {/* LEFT GROUP */}
                    <div
                      className="
                        grid grid-cols-2 gap-2 w-full
                        md:flex md:flex-wrap md:w-auto
                      "
                    >
                      <LightButton disabled={gameCompleted}>
                        <span>{formatTime(timer)}</span>
                        <Clock className="h-4 w-4 shrink-0" />
                      </LightButton>

                      <LightButton
                        onClick={() => giveHintLetter()}
                        disabled={gameCompleted}
                      >
                        <span>
                          {t("games.crossword.hintLetter")}
                        </span>
                        <Lightbulb className={`${isArabic ? "ml-1" : "mr-1"} h-4 w-4 shrink-0`} />
                      </LightButton>

                      <LightButton
                        onClick={() => revealWord()}
                        disabled={gameCompleted}
                      >
                        <span>
                          {t("games.crossword.revealWord")}
                        </span>
                        <Lightbulb className={`${isArabic ? "ml-1" : "mr-1"} h-4 w-4 shrink-0`} />
                      </LightButton>

                      <LightButton
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowInstructions(true)}
                        className="
                          col-span-2
                          bg-white text-black font-[700] text-[14px] md:text-[16px]
                          rounded-[100px] flex items-center justify-center gap-2
                          border border-transparent hover:bg-white hover:text-black
                        "
                      >
                        {t("games.crossword.help")}
                        <HelpCircle className="h-4 w-4 shrink-0" />
                      </LightButton>

                      <BlueButton
                        onClick={() => setShowRevealConfirm(true)}
                        disabled={gameCompleted}
                      >
                        <span>
                          {t("games.crossword.revealFullSolution")}
                        </span>
                        <Eye className={`${isArabic ? "ml-1" : "mr-1"} h-4 w-4 shrink-0`} />
                      </BlueButton>
                      
                      <GradientButton
                        onClick={() => resetGame(false)}
                        disabled={gameCompleted}
                        className="col-span-2 md:col-span-1"
                      >
                        {t("games.crossword.reset")}
                        <RefreshCw className={`${isArabic ? "ml-1" : "mr-1"} h-4 w-4 shrink-0`} />
                      </GradientButton>
                    </div>

                    {/* RIGHT GROUP */}
                    <div
                      className="
                        grid grid-cols-2 gap-2 w-full
                        md:flex md:w-auto
                      "
                    >

                      {gameCompleted && !solutionRevealed && (
                        <GradientButton disabled className="col-span-2 md:col-span-1">
                          {isArabic ? "مكتمل" : "Completed"}
                        </GradientButton>
                      )}
                    </div>
                  </div>

                  {/* Game Controls */}
                    
                  {gameCompleted && (
                  <div className="bg-muted/50 p-2 flex flex-wrap items-center justify-between gap-1 border-b border-[#DEDEDE]">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={moveToNextPuzzle}>
                          <RefreshCw className={`${isArabic ? "ml-1" : "mr-1"} h-4 w-4`} /> {t("games.crossword.nextPuzzle")}
                        </Button>
                    </div>
                  </div>
                  )}

              <div className="p-4 flex justify-center">
                <div className="inline-grid grid-cols-10 gap-[1px] bg-border p-[1px]">
                  {Array.from({ length: GRID_SIZE }).map((_, r) =>
                      Array.from({ length: GRID_SIZE }).map((_, c) => {
                      const isBlock = puzzle.grid[r][c] === "#";
                      const num = cellNumberMap[`${r}-${c}`];
                      return (
                        <div
                          key={`${r}-${c}`}
                          className={`relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-base font-medium cursor-pointer select-none
                            ${isBlock ? "bg-foreground/10" : "bg-card border border-border"}
                            ${!isBlock ? highlightCell(r, c) : ""}
                              ${selected && selected.row === r && selected.col === c ? "ring-2 ring-primary" : ""} ${showSolution && !isBlock ? "bg-green-100 dark:bg-green-900/30" : ""} ${gameCompleted && !showSolution && !isBlock ? "bg-blue-100 dark:bg-blue-900/20" : ""}
                          `}
                          onClick={() => handleCellClick(r, c)}
                        >
                          {!isBlock && num ? (
                            <span className="absolute top-0 right-0 text-[10px] text-muted-foreground mr-[2px]">{num}</span>
                          ) : null}
                          {!isBlock ? (
                            <span className="font-bold">{userGrid[r][c] || ""}</span>
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </div>
                
              </div>
              {/* On-screen Keyboard */}
              <div
                className="
                  w-full bg-card border-t border-border p-3 md:p-4 mt-4
                  md:static md:border-none md:shadow-none md:bg-transparent md:mt-0
                  fixed bottom-0 left-0 right-0 
                  md:w-full md:max-w-lg md:mx-auto
                "
              >
              <div className={`grid gap-1.5 sm:gap-2 ${isArabic ? "grid-cols-7 sm:grid-cols-8" : "grid-cols-7 sm:grid-cols-9"}`}>
              {(isArabic ? ARABIC_ALPHABET : ENGLISH_ALPHABET).map((letter) => (
                <button
                  key={letter}
                  onClick={() => handleKeyPress(letter)}
                  className={`
                    h-10 sm:h-12 rounded-lg text-lg font-bold transition-all duration-150
                    flex items-center justify-center
                    active:scale-95 hover:scale-105
                    bg-muted hover:bg-muted/80
                    ${gameCompleted ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {letter}
                </button>
              ))}
              <button
                onClick={() => handleKeyPress('Backspace')}
                className={`
                  h-10 sm:h-12 rounded-lg text-lg font-bold transition-all duration-150
                  flex items-center justify-center
                  active:scale-95 hover:scale-105
                  bg-muted hover:bg-muted/80 col-span-2 sm:col-span-1
                  ${gameCompleted ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                aria-label="Backspace"
              >
                <Delete className="w-6 h-6" />
              </button>
              </div>
              </div>
                  {/* Article Link - Hidden on mobile, shown on desktop */}
                  {current?.link && (
                    <div className="px-6 py-3 flex-1 overflow-y-auto">
                      <ReadmoreArticleWidget article_detail={{
                        title: current?.title,
                        link: current?.link,
                        image_url: current?.image_url,
                      }} />
                    </div>
                  )}
                  </div>
                </div>
              </div>

              {/* Most Read Sidebar - Takes 1 column on large screens */}
              <div className="lg:col-span-1">
                <HowToPlayInstruction 
                  title={t("games.crossword.howToPlay")} 
                  text={t("games.crossword.fillCrosswordByTypingLetters")} 
                  > 
                  
                  {/* Controls Card */}
                  <div className="mt-4">
                    <div>
                      <div className="text-lg font-bold">{t("games.crossword.controls")}</div>
                    </div>
                    <div className={`text-sm space-y-2 ${isArabic ? "text-right" : "text-left"}`}>
                      <div className="divide-y divide-white overflow-hidden">
                        <div className={`flex items-center justify-between py-2 ${isArabic ? "flex-row-reverse" : ""}`}>
                          <span className="font-medium">{t("games.crossword.selectCell")}</span>
                          <span>{t("games.crossword.clickACell")}</span>
                        </div>
                        <div className={`flex items-center justify-between py-2 ${isArabic ? "flex-row-reverse" : ""}`}>
                          <span className="font-medium">{t("games.crossword.enterALetter")}</span>
                          <span>{t("games.crossword.arabicLetters")}</span>
                        </div>
                        <div className={`flex items-center justify-between py-2 ${isArabic ? "flex-row-reverse" : ""}`}>
                          <span className="font-medium">{t("games.crossword.switchDirection")}</span>
                          <span>{t("games.crossword.space")}</span>
                        </div>
                        <div className={`flex items-center justify-between py-2 ${isArabic ? "flex-row-reverse" : ""}`}>
                          <span className="font-medium">{t("games.crossword.navigate")}</span>
                          <span>{t("games.crossword.arrowKeys")}</span>
                        </div>
                        <div className={`flex items-center justify-between py-2 ${isArabic ? "flex-row-reverse" : ""}`}>
                          <span className="font-medium">{t("games.crossword.clearALetter")}</span>
                          <span>{t("games.crossword.backspaceDel")}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </HowToPlayInstruction>
                
                

                {/* Clues Card */}
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-lg">{t("games.crossword.clues")}</CardTitle>
                  </CardHeader>
                  <CardContent className={`text-sm space-y-2 ${isArabic ? "text-right" : "text-left"}`}>
                    <div className="md:hidden">
                      <Tabs defaultValue="across" className="w-full">
                        <TabsList className="w-full grid grid-cols-2">
                          <TabsTrigger value="across">{t("games.crossword.across")}</TabsTrigger>
                          <TabsTrigger value="down">{t("games.crossword.down")}</TabsTrigger>
                        </TabsList>
                        <TabsContent value="across" className="mt-3">
                          {renderList(across)}
                        </TabsContent>
                        <TabsContent value="down" className="mt-3">
                          {renderList(down)}
                        </TabsContent>
                      </Tabs>
                    </div>
                    <div className="hidden md:grid md:grid-cols-2 md:gap-4">
                      <div>
                        <h4 className="font-medium mb-2">{t("games.crossword.across")}</h4>
                        {renderList(across)}
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">{t("games.crossword.down")}</h4>
                        {renderList(down)}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <MostReadSidebar />
              </div>
            </div>
          </div>
        </div>

        <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
          <DialogContent className="sm:max-w-md" dir={isArabic ? "rtl" : "ltr"}>
            <DialogHeader>
              <DialogTitle>{t("games.crossword.howToPlayCrossword")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>{t("games.crossword.complete10x10Grid")}</p>
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">{t("games.crossword.scoring")}</h3>
                <ul className={`list-disc list-inside space-y-1 text-sm ${isArabic ? "pr-4" : "pl-4"}`}>
                  <li>{t("games.crossword.basePoints")}</li>
                  <li>{t("games.crossword.penaltyPerSecond")}</li>
                  <li>{t("games.crossword.penaltyPerHint")}</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">{t("games.crossword.tips")}</h3>
                <ul className={`list-disc list-inside space-y-1 text-sm ${isArabic ? "pr-4" : "pl-4"}`}>
                  <li>{t("games.crossword.clickCellToSelect")}</li>
                  <li>{t("games.crossword.useArrowKeysToNavigate")}</li>
                  <li>{t("games.crossword.useCluesList")}</li>
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowInstructions(false)}>{t("games.crossword.gotIt")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showCongratulations} onOpenChange={setShowCongratulations}>
          <DialogContent dir={isArabic ? "rtl" : "ltr"}>
            <DialogHeader>
              <DialogTitle>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>{t("games.crossword.wellDone")}</span>
                </div>
              </DialogTitle>
              <DialogDescription>{t("games.crossword.youSolvedTheCrossword")}</DialogDescription>
            </DialogHeader>
            <div className="flex justify-center py-4">
              <div className="bg-muted/50 rounded-lg p-4 w-full max-w-xs">
                <div className="text-center space-y-2">
                  <div className="text-sm text-muted-foreground">{t("games.crossword.time")}</div>
                  <div className="font-medium">{formatTime(timer)}</div>
                  <Separator />
                  <div className="text-sm text-muted-foreground">{t("games.crossword.hintsUsed")}</div>
                  <div className="font-medium">{hintsUsed}</div>
                </div>
              </div>
            </div>
            <DialogFooter className={isArabic ? "flex-row-reverse" : "flex-row"}>
              <Button onClick={() => {
                setShowCongratulations(false);
                resetGame(false); // Reset current game, don't advance
              }}>{t("games.crossword.newPuzzle")}</Button>
              <Button
                variant="outline"
                className={isArabic ? "ml-2" : "mr-2"}
                onClick={() =>
                  navigate(
                    `/leaderboard?${new URLSearchParams({
                      name: t("games.crossword.name"),
                      duration: "month",
                      game_type: GAME_TYPE,
                      top_k: "10",
                      sort_order: "desc",
                      score_type: "max",
                    }).toString()}`
                  )
                }
              >
                {t("games.crossword.leaderboard")}
              </Button>
              <Button onClick={moveToNextPuzzle} className={isArabic ? "ml-2" : "mr-2"}>
                {t("games.crossword.nextPuzzle")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showRevealConfirm} onOpenChange={setShowRevealConfirm}>
          <DialogContent dir={isArabic ? "rtl" : "ltr"}>
            <DialogHeader>
              <DialogTitle>{t("games.crossword.revealFullSolutionQuestion")}</DialogTitle>
              <DialogDescription>
                {t("games.crossword.areYouSureRevealSolution")}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className={isArabic ? "flex-row-reverse" : "flex-row"}>
              <Button
                variant="destructive"
                onClick={revealFullSolution}
              >
                {t("games.crossword.yesRevealSolution")}
              </Button>
              <Button variant="outline" onClick={() => setShowRevealConfirm(false)}>{t("games.crossword.cancel")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Dialog for Solution Revealed */}
        <Dialog open={showSolutionRevealedDialog} onOpenChange={setShowSolutionRevealedDialog}>
          <DialogContent dir={isArabic ? "rtl" : "ltr"}>
            <DialogHeader>
              <DialogTitle>{t("games.crossword.solutionRevealed")}</DialogTitle>
              <DialogDescription>
                {t("games.crossword.fullSolutionRevealed")}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className={isArabic ? "flex-row-reverse" : "flex-row"}>
              <Button onClick={admirePuzzle}>
                {t("games.crossword.reviewPuzzle")}
              </Button>
              <Button variant="outline" onClick={moveToNextPuzzle}>
                {t("games.crossword.nextPuzzle")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </section>
  );
};

export default Crossword;