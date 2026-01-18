import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { Separator } from "@/components/ui/separator";import { Trophy, HelpCircle, RefreshCw, Lightbulb, Check, Clock, Delete, Eye } from "lucide-react";
import { ExternalLink } from "lucide-react";
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
  const { user } = useUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isArticleView = searchParams.get("src") === "article";

  // State for current game index
  const [currentGameIndex, setCurrentGameIndex] = useState(0);

  // Memoized current game data
  const current = useMemo(() => games?.[currentGameIndex], [games, currentGameIndex]);
  const title = current?.title || "الكلمات المتقاطعة";

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
          <span className="font-semibold">{w.number}. {w.direction === "across" ? "أفقي" : "عمودي"}</span>{" "}
          <span className="text-foreground/80">{w.clue}</span>
        </li>
      ))}
    </ul>
  );

  // New function to move to next puzzle
  const moveToNextPuzzle = () => {
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

  return (
    <div className="game-area" dir="rtl">
      <div className="game-container">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4 px-2">
            <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-background rounded-md px-3 py-1 text-sm font-medium border border-border">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{formatTime(timer)}</span>
              </div>
              {!user?.isAnonymous && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() =>
                      navigate(
                        `/games/leaderboard?${new URLSearchParams({
                          name: "Crossword",
                          duration: "month",
                          game_type: GAME_TYPE,
                          top_k: "10",
                          sort_order: "desc",
                          score_type: "max",
                        }).toString()}`
                      )
                    }
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold shadow-lg"
                  >
                    <Trophy size={18} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>لوحة المتصدرين</TooltipContent>
              </Tooltip>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row w-full gap-4">
          <div className="bg-card border border-border rounded-lg shadow-lg overflow-hidden pb-3 w-full md:w-[70%]">
            <div className="bg-muted/50 p-2 flex flex-wrap items-center justify-between gap-1 border-b border-border">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => resetGame(false)}>
                  <RefreshCw className="ml-1 h-4 w-4" /> إعادة تعيين
                </Button>
                <Button variant="outline" size="sm" onClick={giveHintLetter} disabled={gameCompleted}>
                  <Lightbulb className="ml-1 h-4 w-4" /> حرف مساعد
                </Button>
                <Button variant="outline" size="sm" onClick={revealWord} disabled={gameCompleted}>
                  <Lightbulb className="ml-1 h-4 w-4" /> كشف الكلمة
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setShowRevealConfirm(true)} disabled={gameCompleted}>
                  <Eye className="ml-1 h-4 w-4" /> إظهار الحل الكامل
                </Button>
              </div>
              <div className="flex items-center gap-2">
                {gameCompleted && (
                  <Button variant="outline" size="sm" onClick={moveToNextPuzzle}>
                    <RefreshCw className="ml-1 h-4 w-4" /> اللغز التالي
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInstructions(true)}
                  className="bg-muted flex items-center gap-2"
                >
                  <HelpCircle className="ml-1 h-4 w-4" /> مساعدة
                </Button>
              </div>
            </div>

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
              {/* On-screen Arabic Keyboard */}
          <div
            className="
              w-full bg-card border-t border-border p-3 md:p-4 mt-4
              md:static md:border-none md:shadow-none md:bg-transparent md:mt-0
              fixed bottom-0 left-0 right-0 
              md:w-full md:max-w-lg md:mx-auto
            "
          >
            <div className="grid grid-cols-7 sm:grid-cols-8 gap-1.5 sm:gap-2">
              {ARABIC_ALPHABET.map((letter) => (
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
          <div className="hidden md:block">
            <a
                href={current?.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col mb-4 items-center gap-4 p-4 rounded-xl  hover:shadow-md transition-shadow "
            >
                {/* Image */}
                <div className="w-24 sm:w-28 md:w-32 lg:w-40 flex items-center justify-center h-[120px] sm:h-[140px]">
                    <img
                        src={current?.image_url}
                        alt="صورة المقال"
                        className="h-full w-full object-cover rounded-md"
                        onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src =
                                "https://idea410.digital.uic.edu/wp-content/themes/koji/assets/images/default-fallback-image.png";
                        }}
                    />
                </div>

                <div className="flex-1 text-center">
                    <h3 className="font-semibold mb-1 text-blue-900 dark:text-blue-100">
                        اقرأ المزيد عن المقال :{" "}
                    </h3>
                    <p className="text-blue-800 dark:text-blue-200 font-medium leading-relaxed hover:underline cursor-pointer">
                        {current?.title}
                        <span className="mr-2 align-middle inline-block">
                            <ExternalLink
                                className="w-5 h-5 text-primary mb-2"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(
                                      current?.link,
                                        "_blank"
                                    );
                                }}
                            />
                        </span>
                    </p>
                </div>
            </a>
          </div>
          </div>

        

          <div className="w-full md:w-[30%]">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">كيفية اللعب</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-4 text-muted-foreground">
                <p className="leading-relaxed text-foreground/80">
                  املأ الكلمات المتقاطعة بكتابة الأحرف. استخدم المسافة للتبديل بين الاتجاهات (أفقي/عمودي).
                </p>
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">التحكم</h3>
                  <div className="rounded-md border border-border divide-y divide-border overflow-hidden bg-muted/30">
                    <div className="flex items-center justify-between px-3 py-2">
                      <span className="font-medium text-foreground">اختر خلية</span>
                      <span className="text-muted-foreground">انقر على خلية</span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2">
                      <span className="font-medium text-foreground">إدخال حرف</span>
                      <span className="text-muted-foreground">أحرف عربية</span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2">
                      <span className="font-medium text-foreground">تبديل الاتجاه</span>
                      <span className="text-muted-foreground">مسافة</span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2">
                      <span className="font-medium text-foreground">التنقل</span>
                      <span className="text-muted-foreground">مفاتيح الأسهم</span>
                    </div>
                    <div className="flex items-center justify-between px-3 py-2">
                      <span className="font-medium text-foreground">مسح حرف</span>
                      <span className="text-muted-foreground">Backspace / Del</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">القرائن</h3>
                  <div className="md:hidden">
                    <Tabs defaultValue="across" className="w-full">
                      <TabsList className="w-full grid grid-cols-2">
                        <TabsTrigger value="across">أفقي</TabsTrigger>
                        <TabsTrigger value="down">عمودي</TabsTrigger>
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
                      <h4 className="font-medium mb-2">أفقي</h4>
                      {renderList(across)}
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">عمودي</h4>
                      {renderList(down)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
          <DialogContent className="sm:max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>كيفية لعب الكلمات المتقاطعة</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>أكمل الشبكة 10×10 بملء الكلمات من القرائن. هناك ما يصل إلى 10 كلمات؛ 5 أفقية و 5 عمودية. تتقاطع الكلمات حيث تتطابق الأحرف.</p>
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">التسجيل</h3>
                <ul className="list-disc list-inside space-y-1 text-sm pr-4">
                  <li>النقاط الأساسية: 1000</li>
                  <li>العقوبة: -1 لكل ثانية</li>
                  <li>العقوبة: -50 لكل حرف مساعد؛ كشف الكلمة يكلف أحرف/2 تلميحات</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">نصائح</h3>
                <ul className="list-disc list-inside space-y-1 text-sm pr-4">
                  <li>انقر على خلية للاختيار. اضغط على المسافة للتبديل بين الاتجاهات.</li>
                  <li>استخدم مفاتيح الأسهم للتنقل عبر الشبكة.</li>
                  <li>استخدم قائمة القرائن؛ كل قرينة يمكن أن ترتبط بالمقال المصدر.</li>
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowInstructions(false)}>فهمت</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showCongratulations} onOpenChange={setShowCongratulations}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>أحسنت!</span>
                </div>
              </DialogTitle>
              <DialogDescription>لقد حللت الكلمات المتقاطعة!</DialogDescription>
            </DialogHeader>
            <div className="flex justify-center py-4">
              <div className="bg-muted/50 rounded-lg p-4 w-full max-w-xs">
                <div className="text-center space-y-2">
                  <div className="text-sm text-muted-foreground">الوقت</div>
                  <div className="font-medium">{formatTime(timer)}</div>
                  <Separator />
                  <div className="text-sm text-muted-foreground">التلميحات المستخدمة</div>
                  <div className="font-medium">{hintsUsed}</div>
                </div>
              </div>
            </div>
            <DialogFooter className="flex-row-reverse">
              <Button onClick={() => {
                setShowCongratulations(false);
                resetGame(false); // Reset current game, don't advance
              }}>لغز جديد</Button>
              <Button
                variant="outline"
                className="ml-2"
                onClick={() =>
                  navigate(
                    `/games/leaderboard?${new URLSearchParams({
                      name: "Crossword",
                      duration: "month",
                      game_type: GAME_TYPE,
                      top_k: "10",
                      sort_order: "desc",
                      score_type: "max",
                    }).toString()}`
                  )
                }
              >
                لوحة المتصدرين
              </Button>
              <Button onClick={moveToNextPuzzle} className="ml-2">
                اللغز التالي
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showRevealConfirm} onOpenChange={setShowRevealConfirm}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>إظهار الحل الكامل؟</DialogTitle>
              <DialogDescription>
                هل أنت متأكد أنك تريد إظهار الحل الكامل؟ لن يتم تسجيل نتيجتك إذا قمت بذلك.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-row-reverse">
              <Button
                variant="destructive"
                onClick={revealFullSolution}
              >
                نعم، أظهر الحل
              </Button>
              <Button variant="outline" onClick={() => setShowRevealConfirm(false)}>إلغاء</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Dialog for Solution Revealed */}
        <Dialog open={showSolutionRevealedDialog} onOpenChange={setShowSolutionRevealedDialog}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>تم عرض الحل!</DialogTitle>
              <DialogDescription>
                لقد تم عرض الحل الكامل للغز. يمكنك الآن مراجعة اللغز أو الانتقال إلى اللغز التالي.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-row-reverse">
              <Button onClick={admirePuzzle}>
                مراجعة اللغز
              </Button>
              <Button variant="outline" onClick={moveToNextPuzzle}>
                اللغز التالي
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
};

export default Crossword;