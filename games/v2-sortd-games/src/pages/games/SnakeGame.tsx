import React, { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Trophy,
  HelpCircle,
  Play,
  Pause,
  Settings,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import GamesServices from "../../../v2-services/games-service";
import { useUser } from "../../context/UserContext";
import Layout from "../../components/Layout";
import { useTranslation } from "react-i18next";
import { formatNumberForDisplay } from "../../utils/numberFormatter";
import { addUtmParams } from "@/lib/utils";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface GameData {
  id: string;
  data: {
    headline: string;
    randomized: string[];
  };
  article_detail: {
    link: string;
    image_url: string;
    image: {
      th: string;
      o: string;
    };
  };
  article_guid: string;
}

interface SnakeProps {
  gameData: GameData[];
}

// Types
type Direction = "UP" | "RIGHT" | "DOWN" | "LEFT" | null;
type Position = { x: number; y: number };
type Snake = Position[];
type Difficulty = "easy" | "medium" | "hard";

const GRID_SIZE = 18;
const CELL_SIZE = 20;

// Difficulty settings
const DIFFICULTY_SETTINGS = {
  easy: { initialSpeed: 100, speedDecrease: 8, threshold: 40 },
  medium: { initialSpeed: 150, speedDecrease: 5, threshold: 70 },
  hard: { initialSpeed: 200, speedDecrease: 3, threshold: 100 },
};

const SnakeGame: React.FC<SnakeProps> = ({ gameData }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
   const { user } = useUser();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState<Snake>([{ x: 1, y: 10 }]);
  const [food, setFood] = useState<Position>(() => {
    // Randomize initial food each game, avoid initial snake position
    const initialSnake: Snake = [{ x: 1, y: 10 }];
    let newFood: Position = { x: 0, y: 0 };
    let attempts = 0;
    const maxAttempts = 100;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      attempts++;
    } while (
      initialSnake.some(
        (segment) => segment.x === newFood.x && segment.y === newFood.y
      ) && attempts < maxAttempts
    );
    return newFood;
  });
  const [direction, setDirection] = useState<Direction>(null);
  const [nextDirection, setNextDirection] = useState<Direction>(null);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [gameSpeed, setGameSpeed] = useState<number>(
    DIFFICULTY_SETTINGS.medium.initialSpeed
  );
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [dialog, setDialog] = useState(false);
  const [showDifficultyDialog, setShowDifficultyDialog] = useState(false);
  const [collisionPosition, setCollisionPosition] = useState<Position | null>(
    null
  );
  const gameLoopRef = useRef<number | null>(null);
  const lastMoveTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [showInstructions, setShowInstructions] = useState(false);

  // Word unlocking states
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState<number>(0);
  const [unlockedWords, setUnlockedWords] = useState<number>(0);
  const [completedSentences, setCompletedSentences] = useState<number[]>([]);
  const [allArticlesCompleted, setAllArticlesCompleted] = useState(false);
  const [showAllCompletedDialog, setShowAllCompletedDialog] = useState(false);

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchEndRef = useRef<{ x: number; y: number } | null>(null);
  // Theme detection state
  const [isDarkMode, setIsDarkMode] = useState(false);
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



  const getCurrentSentence = useCallback(() => {
    if (!gameData || gameData.length === 0) return null;
    return gameData[currentSentenceIndex % gameData.length];
  }, [gameData, currentSentenceIndex]);

  const currentSentence = getCurrentSentence();

  // Detect theme changes
  useEffect(() => {
    const detectTheme = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setIsDarkMode(isDark);
    };

    // Initial detection
    detectTheme();

    // Watch for theme changes
    const observer = new MutationObserver(() => {
      detectTheme();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Redraw canvas when theme changes
  useEffect(() => {
    if (canvasRef.current) {
      drawGame(snake, food, collisionPosition);
    }
  }, [isDarkMode]);

 const insertGameScore = useCallback(async (finalScore: number) => {
    const data = {
      score: finalScore,
      game_type: "hungry-trail",
      user_name: user?.username,
      user: user?.user_id,
      game_id: "c12d8bc0-2e0b-4b3f-8c10-9ff2e2a9a456",
      email:user?.email,

    };

    try {
      const res = await GamesServices.insertScore(data);
    } catch (error) {
      console.error("Failed to insert snake game score:", error);
    }
  }, []);

  // Generate random food position
  const generateFood = useCallback((currentSnake: Snake): Position => {
    let newFood: Position;
    let attempts = 0;
    const maxAttempts = 100;

    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      attempts++;
    } while (
      currentSnake.some(
        (segment) => segment.x === newFood.x && segment.y === newFood.y
      ) &&
      attempts < maxAttempts
    );

    return newFood;
  }, []);

  // Get computed CSS custom property values
  const getThemeColor = useCallback((property: string): string => {
    if (typeof window === "undefined") return "#000";
    const root = document.documentElement;
    const value = getComputedStyle(root).getPropertyValue(property).trim();
    return value ? `hsl(${value})` : "#000";
  }, []);

  // Draw realistic snake with directional eyes
  const drawRealisticSnake = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      currentSnake: Snake,
      currentDirection: Direction,
      collision: Position | null = null
    ) => {
      const primaryColor = getThemeColor("--primary");
      const secondaryColor = getThemeColor("--secondary");

      currentSnake.forEach((segment, index) => {
        const x = segment.x * CELL_SIZE;
        const y = segment.y * CELL_SIZE;

        // Check if this segment is the collision point
        const isCollisionCell =
          collision && segment.x === collision.x && segment.y === collision.y;

        if (index === 0) {
          // Draw head with rounded corners
          const headGradient = ctx.createRadialGradient(
            x + CELL_SIZE / 2,
            y + CELL_SIZE / 2,
            0,
            x + CELL_SIZE / 2,
            y + CELL_SIZE / 2,
            CELL_SIZE / 2
          );

          if (isCollisionCell) {
            headGradient.addColorStop(0, "#ff6b6b");
            headGradient.addColorStop(1, "#ef4444");
          } else {
            headGradient.addColorStop(0, "#4ade80");
            headGradient.addColorStop(0.7, "#22c55e");
            headGradient.addColorStop(1, "#16a34a");
          }

          ctx.fillStyle = headGradient;
          ctx.beginPath();
          ctx.roundRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2, 8);
          ctx.fill();

          // Draw directional eyes based on snake direction
          if (!isCollisionCell) {
            ctx.fillStyle = isDarkMode ? "#ffffff" : "#000000";

            let eye1X = x + 6,
              eye1Y = y + 6;
            let eye2X = x + 14,
              eye2Y = y + 6;

            // Adjust eye positions based on direction
            switch (currentDirection) {
              case "UP":
                eye1Y = y + 4;
                eye2Y = y + 4;
                break;
              case "DOWN":
                eye1Y = y + 16;
                eye2Y = y + 16;
                break;
              case "LEFT":
                eye1X = x + 4;
                eye2X = x + 4;
                eye1Y = y + 6;
                eye2Y = y + 14;
                break;
              case "RIGHT":
                eye1X = x + 16;
                eye2X = x + 16;
                eye1Y = y + 6;
                eye2Y = y + 14;
                break;
              default:
                // Default to right-facing eyes
                break;
            }

            // Draw eyes
            ctx.beginPath();
            ctx.arc(eye1X, eye1Y, 2, 0, 2 * Math.PI);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(eye2X, eye2Y, 2, 0, 2 * Math.PI);
            ctx.fill();

            // Eye highlights
            ctx.fillStyle = isDarkMode ? "#000000" : "#ffffff";
            ctx.beginPath();
            ctx.arc(eye1X + 0.5, eye1Y - 0.5, 0.8, 0, 2 * Math.PI);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(eye2X + 0.5, eye2Y - 0.5, 0.8, 0, 2 * Math.PI);
            ctx.fill();
          }
        } else {
          // Draw body segments with gradient
          const bodyGradient = ctx.createLinearGradient(
            x,
            y,
            x + CELL_SIZE,
            y + CELL_SIZE
          );

          if (isCollisionCell) {
            bodyGradient.addColorStop(0, "#ff6b6b");
            bodyGradient.addColorStop(1, "#ef4444");
          } else {
            const alpha = Math.max(0.6, 1 - index * 0.03);
            bodyGradient.addColorStop(0, `rgba(34, 197, 94, ${alpha})`);
            bodyGradient.addColorStop(1, `rgba(22, 163, 74, ${alpha * 0.8})`);
          }

          ctx.fillStyle = bodyGradient;
          ctx.beginPath();
          ctx.roundRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2, 6);
          ctx.fill();

          // Add subtle pattern for realism
          if (!isCollisionCell) {
            ctx.fillStyle = `rgba(255, 255, 255, 0.1)`;
            ctx.fillRect(x + 3, y + 3, CELL_SIZE - 6, 2);
            ctx.fillRect(x + 3, y + CELL_SIZE - 5, CELL_SIZE - 6, 2);
          }
        }

        // Add border for definition
        if (!isCollisionCell) {
          ctx.strokeStyle = isDarkMode
            ? "rgba(255,255,255,0.2)"
            : "rgba(0,0,0,0.2)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(
            x + 1,
            y + 1,
            CELL_SIZE - 2,
            CELL_SIZE - 2,
            index === 0 ? 8 : 6
          );
          ctx.stroke();
        }
      });
    },
    [getThemeColor, isDarkMode]
  );

  // Draw enhanced food with word preview
  const drawFood = useCallback(
    (ctx: CanvasRenderingContext2D, currentFood: Position) => {
      const foodX = currentFood.x * CELL_SIZE + CELL_SIZE / 2;
      const foodY = currentFood.y * CELL_SIZE + CELL_SIZE / 2;

      // Enhanced apple-like food with glow effect
      const gradient = ctx.createRadialGradient(
        foodX,
        foodY,
        0,
        foodX,
        foodY,
        12
      );
      gradient.addColorStop(0, "#ff6b6b");
      gradient.addColorStop(0.6, "#ef4444");
      gradient.addColorStop(0.8, "#dc2626");
      gradient.addColorStop(1, "rgba(220, 38, 38, 0.3)");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(foodX, foodY, 10, 0, 2 * Math.PI);
      ctx.fill();

      // Inner apple
      ctx.fillStyle = "#ff4444";
      ctx.beginPath();
      ctx.arc(foodX, foodY, 7, 0, 2 * Math.PI);
      ctx.fill();

      // Highlight
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.beginPath();
      ctx.arc(foodX - 2, foodY - 2, 2, 0, 2 * Math.PI);
      ctx.fill();

      // Word letter indicator inside the food ball
      if (
        currentSentence &&
        currentSentence.data.randomized.length > unlockedWords &&
        !allArticlesCompleted
      ) {
        const nextWord = currentSentence.data.randomized[unlockedWords];
        if (nextWord && nextWord.length > 0) {
          const letter = nextWord.charAt(0).toUpperCase();
          const fontSize = Math.max(10, Math.round(CELL_SIZE * 0.6));
          ctx.save();
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.font = `bold ${fontSize}px Arial`;
          // Outline for contrast
          ctx.lineWidth = 2;
          ctx.strokeStyle = "rgba(0,0,0,0.6)";
          ctx.strokeText(letter, foodX, foodY);
          // Fill with bright color
          ctx.fillStyle = "#ffffff";
          // Subtle shadow
          ctx.shadowColor = "rgba(0,0,0,0.35)";
          ctx.shadowBlur = 3;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 1;
          ctx.fillText(letter, foodX, foodY);
          ctx.restore();
        }
      }
    },
    [currentSentence, unlockedWords, isDarkMode, allArticlesCompleted]
  );

  // Enhanced draw game function
  const drawGame = useCallback(
    (
      currentSnake: Snake,
      currentFood: Position,
      collision: Position | null = null
    ) => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Get theme colors
      const backgroundColor = getThemeColor("--card");

      // Clear canvas with theme background
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw simple grid
      ctx.strokeStyle = isDarkMode
        ? "rgba(255, 255, 255, 0.03)"
        : "rgba(0, 0, 0, 0.2)";
      ctx.lineWidth = 1;

      for (let i = 0; i <= GRID_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, GRID_SIZE * CELL_SIZE);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(GRID_SIZE * CELL_SIZE, i * CELL_SIZE);
        ctx.stroke();
      }

      // Draw food
      drawFood(ctx, currentFood);

      // Draw realistic snake
      drawRealisticSnake(ctx, currentSnake, direction, collision);

      // Removed canvas-drawn start overlay in favor of higher-quality DOM overlay

      // Draw pause overlay
      if (isPaused && direction !== null) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#fff";
        ctx.font = "24px Arial";
        ctx.textAlign = "center";
        ctx.fillText(t("games.hungryTrail.paused"), canvas.width / 2, canvas.height / 2);

        ctx.font = "14px Arial";
        ctx.fillText(
          isMobile ? t("games.hungryTrail.clickToResumeButton") : t("games.hungryTrail.pressSpaceToResume"),
          canvas.width / 2,
          canvas.height / 2 + 30
        );
      }
    },
    [
      getThemeColor,
      direction,
      gameOver,
      isPaused,
      isMobile,
      isDarkMode,
      drawRealisticSnake,
      drawFood,
    ]
  );

  // Animation loop for smooth rendering
  useEffect(() => {
    const animate = () => {
      if (canvasRef.current && (direction !== null || !gameOver)) {
        drawGame(snake, food, collisionPosition);
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [drawGame, snake, food, collisionPosition, direction, gameOver]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };

      if (direction === null && !gameOver) {
        startGame();
      }
    },
    [direction, gameOver]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current || gameOver) return;

      const touch = e.changedTouches[0];
      touchEndRef.current = { x: touch.clientX, y: touch.clientY };

      const deltaX = touchEndRef.current.x - touchStartRef.current.x;
      const deltaY = touchEndRef.current.y - touchStartRef.current.y;

      const minSwipeDistance = 50;

      if (
        Math.abs(deltaX) > minSwipeDistance ||
        Math.abs(deltaY) > minSwipeDistance
      ) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          handleDirectionChange(deltaX > 0 ? "RIGHT" : "LEFT");
        } else {
          handleDirectionChange(deltaY > 0 ? "DOWN" : "UP");
        }
      }

      touchStartRef.current = null;
      touchEndRef.current = null;
    },
    [gameOver]
  );

  const handleDirectionChange = useCallback(
    (newDirection: Direction) => {
      if (gameOver || !newDirection) return;

      const currentEffectiveDirection = direction;

      if (currentEffectiveDirection) {
        const isOppositeDirection =
          (newDirection === "UP" && currentEffectiveDirection === "DOWN") ||
          (newDirection === "DOWN" && currentEffectiveDirection === "UP") ||
          (newDirection === "LEFT" && currentEffectiveDirection === "RIGHT") ||
          (newDirection === "RIGHT" && currentEffectiveDirection === "LEFT");

        if (isOppositeDirection) {
          console.log(
            `Blocked reversal: ${newDirection} while going ${currentEffectiveDirection}`
          );
          return;
        }
      }

      // Don't queue the same direction multiple times
      if (nextDirection === newDirection) return;

      console.log(`Direction change queued: ${newDirection}`);
      setNextDirection(newDirection);
    },
    [direction, nextDirection, gameOver]
  );

  // Handle word unlocking when food is eaten
  const unlockNextWord = useCallback(() => {
    if (!currentSentence) return;

    const totalWords = currentSentence.data.randomized.length;
    const newUnlockedWords = unlockedWords + 1;

    setUnlockedWords(newUnlockedWords);

    // Check if sentence is complete
    if (newUnlockedWords >= totalWords) {
      setScore((prevScore) => prevScore + 1);
      setCompletedSentences((prev) => [...prev, currentSentenceIndex]);

      // Check if all articles are completed
      if (gameData && currentSentenceIndex >= gameData.length - 1) {
        // All articles completed
  initAudio();
      playSuccessSound();


         setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);


        setAllArticlesCompleted(true);
        setIsPaused(true);

        setShowAllCompletedDialog(true);
        
    
      } else {
        // Move to next sentence
        setCurrentSentenceIndex((prev) => prev + 1);
        setUnlockedWords(0);

        toast({
          title: t("common.articleUnlocked"),
          description: t("common.scoreIncreasedNewArticleAvailableToRead"),
          className:
            "bg-purple-500 text-white font-semibold border-none shadow-xl",
        });
      }
    }
  }, [currentSentence, unlockedWords, currentSentenceIndex, gameData, toast]);

  const gameLoop = useCallback(
    (timestamp: number) => {
      if (gameOver || isPaused) return;

      if (timestamp - lastMoveTimeRef.current < gameSpeed) {
        gameLoopRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      lastMoveTimeRef.current = timestamp;

      const currentDirection = nextDirection || direction;
      if (!currentDirection) {
        gameLoopRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      if (nextDirection) {
        setDirection(nextDirection);
        setNextDirection(null);
      }

      setSnake((currentSnake) => {
        const head = { ...currentSnake[0] };

        switch (currentDirection) {
          case "UP":
            head.y -= 1;
            break;
          case "RIGHT":
            head.x += 1;
            break;
          case "DOWN":
            head.y += 1;
            break;
          case "LEFT":
            head.x -= 1;
            break;
        }

        if (
          head.x < 0 ||
          head.x >= GRID_SIZE ||
          head.y < 0 ||
          head.y >= GRID_SIZE
        ) {
          setGameOver(true);
          setCollisionPosition(head);
          insertGameScore(score);
          setTimeout(
            () =>
              toast({
                title: t("common.gameOver"),
                className:
                  "bg-red-500 text-white font-semibold border-none shadow-xl",
                description: t("common.youHitAWallFinalScore", { score }),
                variant: "destructive",
              }),
            0
          );
          return currentSnake;
        }

        const selfCollision = currentSnake.find(
          (segment) => segment.x === head.x && segment.y === head.y
        );
        if (selfCollision) {
          setGameOver(true);
          setCollisionPosition(head);
          insertGameScore(score);
          setTimeout(
            () =>
              toast({
                title: t("common.gameOver"),
                className:
                  "bg-red-500 text-white font-semibold border-none shadow-xl",
                description: t("common.youBitYourselfFinalScore", { score }),
                variant: "destructive",
              }),
            0
          );
          return currentSnake;
        }

        const newSnake = [head, ...currentSnake];

        if (head.x === food.x && head.y === food.y) {
          // Always increase score when eating food
          if (allArticlesCompleted) {
            // Just increase score, don't unlock new words
            setScore((prevScore) => prevScore + 1);
          } else {
            // Unlock next word (score increments inside unlockNextWord when sentence completes)
            unlockNextWord();
          }

          // Increase speed every 10 food items eaten
          const totalFoodEaten = snake.length;
          if (totalFoodEaten > 0 && totalFoodEaten % 10 === 0) {
            const settings = DIFFICULTY_SETTINGS[difficulty];
            if (gameSpeed > settings.threshold) {
              setGameSpeed((prev) => prev - settings.speedDecrease);
            }
          }

          const newFood = generateFood(newSnake);
          setFood(newFood);
          return newSnake;
        } else {
          newSnake.pop();
          return newSnake;
        }
      });

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    },
    [
      direction,
      nextDirection,
      gameOver,
      isPaused,
      gameSpeed,
      food,
      generateFood,
      score,
      toast,
      insertGameScore,
      difficulty,
      unlockNextWord,
      snake.length,
      allArticlesCompleted,
    ]
  );

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      e.preventDefault();

      switch (e.key) {
        case "ArrowUp":
          if (direction === null && !gameOver) startGame();
          else handleDirectionChange("UP");
          break;
        case "ArrowRight":
          if (direction === null && !gameOver) startGame();
          else handleDirectionChange("RIGHT");
          break;
        case "ArrowDown":
          if (direction === null && !gameOver) startGame();
          else handleDirectionChange("DOWN");
          break;
        case "ArrowLeft":
          if (direction === null && !gameOver) startGame();
          else handleDirectionChange("LEFT");
          break;
        case " ":
          if (direction === null && !gameOver) startGame();
          else togglePause();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    };
  }, [direction, nextDirection, gameOver, isPaused]);

  useEffect(() => {
    if (!gameOver && !isPaused && direction !== null) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    } else if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    };
  }, [gameLoop, gameOver, isPaused, direction]);

  const togglePause = useCallback(() => {
    if (gameOver || direction === null) return;
    setIsPaused((prev) => !prev);
  }, [gameOver, direction]);

  const resetGame = () => {
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }

    const initialSnake = [{ x: 1, y: 10 }];
    const initialFood = generateFood(initialSnake);

    setSnake(initialSnake);
    setFood(initialFood);
    setDirection(null);
    setNextDirection(null);
    setGameOver(false);
    setIsPaused(false);
    setScore(0);
    setGameSpeed(DIFFICULTY_SETTINGS[difficulty].initialSpeed);
    setCollisionPosition(null);

    // Reset word unlocking progress
    setCurrentSentenceIndex(0);
    setUnlockedWords(0);
    setCompletedSentences([]);
    setAllArticlesCompleted(false);
    setShowAllCompletedDialog(false);
  };

  const startGame = () => {
    if (!direction && !gameOver) {
      // Randomize a fresh food position at start as well to ensure variability
      setFood(generateFood([{ x: 1, y: 10 }]));
      setDirection("RIGHT");
    }
  };

  const handleDifficultyChange = (newDifficulty: Difficulty) => {
    setDifficulty(newDifficulty);
    setGameSpeed(DIFFICULTY_SETTINGS[newDifficulty].initialSpeed);
    setShowDifficultyDialog(false);

    if (direction !== null || gameOver) {
      resetGame();
    }
  };

  const params = new URLSearchParams({
    name: "Hungry Trail",
    duration: "month",
    game_type: "hungry-trail",
    top_k: "10",
    sort_order: "desc",
    score_type: "max",
  });

  const handleLeaderBoard = () => {
    if (gameOver || score === 0) {
      navigate(`/games/leaderboard?${params.toString()}`);
    } else {
      setIsPaused(true);
      setDialog(true);
    }
  };

  // Handle article click
  const handleArticleClick = (url: string) => {
    const urlWithUtm = addUtmParams(url);
    window.open(urlWithUtm, "_blank", "noopener,noreferrer");
  };

  // Create blur effect for unrevealed words
  const createBlurredText = (word: string) => {
    return (
      <span
        className="relative inline-block"
        style={{
          filter: "blur(4px)",
          userSelect: "none",
          color: "#888",
        }}
      >
        {word}
      </span>
    );
  };

  const handleContinueGame = () => {
    setShowAllCompletedDialog(false);
  };

 
  const handleQuitGame = () => {
    setShowAllCompletedDialog(false);
    setGameOver(true);
    insertGameScore(score);
  };

    if (!user) {
    navigate("/");
    return null;
  }
  
  
  // Render unlocked words for current sentence
  const renderCurrentSentence = () => {
    if (!currentSentence) return null;

    return (
      <div className="space-y-3">
        {/* Sentence display */}
        <div className="overflow-y-auto max-h-40 p-2 rounded-md bg-muted/30 custom-scrollbar">
          <div className="flex flex-wrap gap-2">
            {currentSentence.data.randomized.map((word, index) => (
              <span
                key={index}
                className={`text-sm font-medium transition-all duration-300 ${
                  index < unlockedWords
                    ? "text-foreground dark:text-white"
                    : "text-gray-400"
                }`}
              >
                {index < unlockedWords ? word : createBlurredText(word)}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render completed sentences
  const renderCompletedSentences = () => {
    if (completedSentences.length === 0) {
      return (
        <div className="h-36 flex items-center justify-center bg-muted/30 rounded-md border border-dashed border-blue-300 dark:border-blue-700">
          <div className="text-center animate-pulse px-4">
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-300">
              {t("common.eatFoodToUnlockArticleHeadlines")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("common.completeEachHeadlineToEarnPointsStayHungry")}
            </p>
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-3">
        <div className="space-y-3 h-36 overflow-y-auto custom-scrollbar">
          {completedSentences.map((sentenceIndex) => {
            const sentence = gameData[sentenceIndex];
            if (!sentence) return null;

            return (
              <div
                key={sentenceIndex}
                onClick={() => handleArticleClick(sentence.article_detail.link)}
                className="p-3 border border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 hover:shadow-md transition-shadow rounded-lg cursor-pointer group shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={sentence?.article_detail?.image_url}
                    alt={t("accessibility.articleThumbnail")}
                    className="w-16 h-12 object-cover rounded-md flex-shrink-0"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src =
                        "https://images.unsplash.com/photo-1585241645927-c7a8e5840c42?w=150&h=100&fit=crop";
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-purple-900 dark:text-gray-300 line-clamp-2 mb-1">
                      {sentence.data.headline}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-purple-600">
                        {t("common.clickToReadArticle")}
                      </span>
                      <ExternalLink
                        size={14}
                        className="text-purple-600 group-hover:text-purple-800 flex-shrink-0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Layout>

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
    <div className="game-area">
      <div className="game-container">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4 px-2">
            <h1 className="text-2xl md:text-3xl font-bold">{t("games.hungryTrail.name")}</h1>
            {!user?.isAnonymous && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleLeaderBoard}
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold shadow-lg"
                    aria-label={t("accessibility.leaderboard")}
                  >
                    <Trophy size={18} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("common.leaderboard")}</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row w-full gap-4">
          <div className="bg-card border border-border rounded-lg shadow-lg overflow-hidden pb-3 w-full lg:w-[60%]">
            <div className="bg-muted/50 p-2 flex flex-wrap items-center justify-between gap-1 border-b border-border">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  {t("common.score")}: {formatNumberForDisplay(score)}
                </Button>
                {isMobile && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPaused(!isPaused)}
                  >
                    {isPaused ? t("common.resume") : t("common.pause")}
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setShowDifficultyDialog(true)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Settings size={16} />
                  {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
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
            <div className="bg-muted/50 p-2">{renderCurrentSentence()}</div>
            <div className="p-4">
              <div
                className="flex justify-center mb-3 relative"
                style={{ touchAction: "none" }}
              >
                <canvas
                  ref={canvasRef}
                  width={GRID_SIZE * CELL_SIZE}
                  height={GRID_SIZE * CELL_SIZE}
                  className="border border-border rounded-md bg-card shadow-lg cursor-pointer"
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                  onClick={() => {
                    if (direction === null && !gameOver) {
                      startGame();
                    }
                  }}
                />
              {direction === null && !gameOver && (
                <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
                  <div className="w-full max-w-sm bg-background/80 backdrop-blur-md border border-border rounded-xl shadow-xl p-5 text-center space-y-4">
                    <div className="mx-auto w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center">
                      <Play className="text-green-600" size={26} />
                    </div>
                    <h3 className="text-xl font-semibold">{t("common.readyToPlay")}</h3>
                    <p className="text-sm text-muted-foreground">
                      {isMobile ? (
                        <>{t("games.hungryTrail.touchTheGreenButtonToStart")} {t("games.hungryTrail.swipeToMoveTheSnake")}</>
                      ) : (
                        <>{t("common.pressTheStartButtonBelow")}</>
                      )}
                    </p>
                    <div className="flex flex-col items-center gap-2">
                      <Button
                        onClick={startGame}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6"
                      >
                        {t("common.startGame")}
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        {t("games.hungryTrail.eatFoodAvoidWallsAndYourself")}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              </div>

              {gameOver && (
                <div className="text-center">
                  <button
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-4 py-2 rounded-lg transition-colors text-md"
                    onClick={resetGame}
                  >
                    {t("common.playAgain")}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="w-full lg:w-[40%] space-y-4">
            {/* Word Progress Card - Fixed Height */}
            <Card className="h-60">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg leading-none">
                    {t("common.youHaveUnlocked")} {formatNumberForDisplay(score)} {score === 1 ? t("common.story") : t("common.stories")}
                  </CardTitle>
                </div>
              </CardHeader>

              <CardContent className=" overflow-hidden flex flex-col">
                <div className="flex-1 space-y-4 overflow-y-auto">
                  {renderCompletedSentences()}
                </div>
              </CardContent>
            </Card>

            {/* Instructions Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("common.howToPlay")}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>
                    {isMobile ? (
                      <>{t("games.hungryTrail.touchTheGameAreaOrSwipeToStartTheGame")}</>
                    ) : (
                      <>
                        Press any{" "}
                        <span className="font-semibold">{t("games.hungryTrail.arrowKeys")}</span> {t("games.hungryTrail.or")}{" "}
                        <span className="font-semibold">{t("games.hungryTrail.space")}</span> {t("games.hungryTrail.toStart")}.
                      </>
                    )}
                  </li>
                  <li>
                    {isMobile ? (
                      <>{t("games.hungryTrail.swipeInTheDirectionYouWantTheSnakeToMove")}</>
                    ) : (
                      <>
                        {t("games.hungryTrail.arrowKeysDescription")}
                        <span className="font-semibold">{t("games.hungryTrail.arrowKeys")}</span> {t("games.hungryTrail.or")}{" "}
                        <span className="font-semibold">{t("games.hungryTrail.space")}</span> {t("games.hungryTrail.toStart")}.
                      </>
                    )}
                  </li>
                  <li>
                    <span className="font-semibold text-primary">{t("games.hungryTrail.newFeature")}</span> 
                    {t("games.hungryTrail.eachFoodEatenUnlocksAWordFromNewsHeadlines")}
                  </li>
                  <li>
                    <span className="font-semibold text-primary">{t("games.hungryTrail.scoringSystem")}</span>{" "}
                    {t("games.hungryTrail.completeFullHeadlinesToEarnPoints")} ({t("games.hungryTrail.onePointPerArticle")}).
                  </li>
                  <li>
                    {t("games.hungryTrail.completeSentencesToUnlockClickableArticlesWithImages")}
                  </li>
                  <li>
                    {t("games.hungryTrail.chooseDifficulty")}
                  </li>
                  <li>{t("games.hungryTrail.avoidHittingWallsOrYourselfGameEndsIfYouDo")}</li>
                  <li>
                    {!isMobile && (
                      <>
                        {t("games.hungryTrail.press")} <span className="font-semibold">{t("games.hungryTrail.space")}</span> to {t("games.hungryTrail.pauseResume")}.
                      </>
                    )}
                    {isMobile && (
                      <>
                        {t("games.hungryTrail.clickTo")} {" "}
                        <span className="font-semibold">{t("games.hungryTrail.pauseResume")} </span>
                        {t("games.hungryTrail.buttonToPauseResume")}.
                      </>
                    )}
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* All Articles Completed Dialog */}
      <Dialog
        open={showAllCompletedDialog}
        onOpenChange={() => {}} // Prevent closing by clicking outside
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>🎉 {t("common.allArticlesUnlocked")}</DialogTitle>
            <DialogDescription>
              {t("common.congratulationsYouHaveSuccessfullyUnlockedAllAvailableArticles")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={handleContinueGame} className="bg-green-600 hover:bg-green-700">
              {t("common.continuePlaying")}
            </Button>
            <Button
              onClick={handleQuitGame}
              variant="outline"
              className="border-red-500 text-red-500 hover:bg-red-50"
            >
              {t("common.quitGame")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Difficulty Selection Dialog */}
      <Dialog
        open={showDifficultyDialog}
        onOpenChange={setShowDifficultyDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("common.selectDifficultyLevel")}</DialogTitle>
            <DialogDescription>
              {t("common.chooseYourPreferredDifficultyLevelChangingDifficultyWillResetTheCurrentGame")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 my-4 ">
            {Object.entries(DIFFICULTY_SETTINGS).map(([level, settings]) => (
              <Button
                key={level}
                variant={difficulty === level ? "default" : "outline"}
                onClick={() => handleDifficultyChange(level as Difficulty)}
                className={`justify-start p-8 ${difficulty === level ? 'text-primary-foreground' : 'text-foreground'}`}
              >
                <div className="text-left">
                  <div className={`font-semibold ${difficulty === level ? 'text-primary-foreground' : 'text-foreground'}`}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </div>
                  <div className={`${difficulty === level ? 'text-primary-foreground/90' : 'text-foreground/90'} text-sm`}>
                    {t("common.speed")}:{" "}
                    {level === "easy"
                      ? t("games.hungryTrail.slow")
                      : level === "medium"
                      ? t("games.hungryTrail.normal")
                      : t("games.hungryTrail.fast")}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Instructions Dialog */}
      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("common.howToPlayHungryTrailGame")}</DialogTitle>
            <DialogDescription>
              <div className="space-y-4 mt-4">
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    {isMobile ? (
                      <>{t("games.hungryTrail.touchTheGameAreaOrSwipeToStartTheGame")}</>
                    ) : (
                      <>
                        {t("common.pressAnyArrowKeyOrSpaceToStart")}
                      </>
                    )}
                  </li>
                  <li>
                    {isMobile ? (
                      <>{t("games.hungryTrail.swipeInTheDirectionYouWantTheSnakeToMove")}</>
                    ) : (
                      <>
                        {t("common.controlTheSnakeUsingYourArrowKeys")}
                      </>
                    )}
                  </li>
                  <li>
                    <span className="font-semibold text-primary">
                      {t("games.hungryTrail.newFeature")}
                    </span>{" "}
                    {t("games.hungryTrail.eachFoodEatenUnlocksAWordFromNewsHeadlines")}
                  </li>
                  <li>
                    <span className="font-semibold text-primary">
                      {t("games.hungryTrail.scoringSystem")}
                    </span>{" "}
                    {t("common.completeFullHeadlinesToEarnPointsOnePointPerCompletedArticleHeadline")}
                  </li>
                  <li>
                    {t("common.completeFullSentencesByEatingEnoughFoodToUnlockAllWords")}
                  </li>
                  <li>
                    {t("games.hungryTrail.completedSentencesBecomeClickableAndOpenTheFullNewsArticle")}
                  </li>
                  <li>{t("games.hungryTrail.chooseFromThreeDifficultyLevels")}</li>
                  <ul className="list-disc pl-5 mt-2">
                    <li>
                      <strong>{t("games.hungryTrail.easy")}</strong> {t("games.hungryTrail.slowerSpeedGoodForBeginners")}
                    </li>
                    <li>
                      <strong>{t("games.hungryTrail.medium")}</strong> {t("games.hungryTrail.normalSpeedBalancedGameplay")}
                    </li>
                    <li>
                      <strong>{t("games.hungryTrail.hard")}</strong> {t("games.hungryTrail.fastSpeedChallengingExperience")}
                    </li>
                  </ul>
                  <li>{t("games.hungryTrail.avoidHittingWallsOrYourselfGameEndsIfYouDo")}</li>
                  <li>
                    {!isMobile && (
                      <>
                        {t("games.hungryTrail.press")} <span className="font-semibold">{t("games.hungryTrail.space")}</span> {t("games.hungryTrail.to")} {t("games.hungryTrail.pauseResume")}.
                      </>
                    )}
                    {isMobile && (
                      <>
                        {t("games.hungryTrail.clickTo")}{" "}
                        <span className="font-semibold">{t("games.hungryTrail.pauseResume")}</span>{" "}
                        {t("games.hungryTrail.buttonToPauseResume")}
                      </>
                    )}
                  </li>
                  <li>{t("games.hungryTrail.theSnakeGetsFasterAsYouEatMoreFood")}</li>
                  <li>
                    {t("games.hungryTrail.tryToUnlockAsManyArticlesAsPossibleToMaximizeYourScore")}
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
          <DialogFooter className="flex flex-col flex-wrap gap-3 justify-center">
            <Button onClick={() => setDialog(false)}>{t("common.noResume")}</Button>
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
    </Layout>
  );
};

export default SnakeGame;