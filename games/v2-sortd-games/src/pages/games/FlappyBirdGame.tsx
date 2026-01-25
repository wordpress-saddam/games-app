
import React, { useState, useEffect, useRef, useCallback } from "react";
import Layout from "../../components/Layout";
import { useLocation, useNavigate } from "react-router-dom";
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
import {
  RefreshCw,
  Volume2,
  VolumeX,
  Trophy,
  Info,
  HelpCircle,
} from "lucide-react";
import GamesServices from "../../../v2-services/games-service";
import { useUser } from "../../context/UserContext";
import LeaderboardModal from "./LeaderboardModal";
import { useTranslation } from "react-i18next";
import { useGameSchema } from "../../hooks/useGameSchema";
import GamesMainHeadline from "../../components/ui/GamesMainHeadline";
import MostReadSidebar from "@/components/MostReadSidebar";
import FlappyBirdImage from "../../assets/Flappy.jpg";
import BackToHome from "../../components/ui/BackToHome";
import LeaderboardButton from "../../components/ui/LeaderboardButton";
import HowToPlayInstruction from "../../components/ui/HowToPlayInstruction";
import { LightButton } from "../../components/ui/GamesButton";

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

const FlappyBirdGame = () => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const { user } = useUser();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const CANVAS_WIDTH = 360;
  const CANVAS_HEIGHT = 450;
  const location = useLocation();
  // Game refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Game state
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [muted, setMuted] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [dialog, setDialog] = useState(false);

  // Game objects state
  const [birdPos, setBirdPos] = useState({ x: 80, y: 150, velocity: 0 });
  const [pipes, setPipes] = useState<
    { x: number; y: number; passed: boolean }[]
  >([]);
  const [bgPosition, setBgPosition] = useState(0);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const isAndroid = /Android/i.test(navigator.userAgent);
const isIPad = /iPad/.test(navigator.userAgent) || 
               (navigator.userAgent.includes("Macintosh") && 'ontouchend' in document);
               
  // Game settings
  const gravity = isAndroid ? 0.1 : 0.4;
  const jumpStrength = isAndroid ? -2.5 : -6;
  const pipeWidth = 80;
  const pipeGap = 180;
  const pipeSpeed = isAndroid ? 2.5 : 6;
  const pipeSpawnInterval =  isAndroid ? 1000 : 1200;

  // Game colors
  const colors = {
    sky: "#70C5CE",
    ground: "#DED895",
    pipe: "#73BF2E",
    pipeHighlight: "#8ED53F",
    bird: "#FFC700",
    birdOutline: "#000000",
    text: "#FFFFFF",
    shadow: "#553800",
  };

  // Bird animation
  const [birdFrame, setBirdFrame] = useState(0);
  const birdFrames = [0, 1, 4, 3]; // Animation sequence
  const maxBirdFrames = birdFrames.length;
  const [birdFrameCount, setBirdFrameCount] = useState(0);


  // Game schema for SEO
  const baseUrl = typeof window !== "undefined" 
    ? `${window.location.protocol}//${window.location.host}` 
    : "https://asharqgames-uat.sortd.pro";
  const gameUrl = `${baseUrl}${location.pathname}${location.search ? location.search : ""}`;
  const gameName = "Flappy Bird";
  
  useGameSchema(
    {
      name: gameName,
      headline: `${gameName} - Asharq Games`,
      description: "Play Flappy Bird to test your reflexes!",
      url: gameUrl,
      image: `${baseUrl}/assets/flappy-bird.jpg`,
      isAccessibleForFree: true,
    },
  );

  // Load high score from localStorage on component mount
  useEffect(() => {
    const savedHighScore = localStorage.getItem("sky-hopper-highscore");
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }
  }, []);

  // Initialize audio context
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioContextRef.current = new AudioContext();
      }
    }
  }, []);

  // Create sound using Web Audio API
  const playSound = useCallback(
    (
      frequency: number,
      duration: number,
      type: "jump" | "score" | "crash" = "jump"
    ) => {
      if (muted || !audioContextRef.current) return;

      try {
        const oscillator = audioContextRef.current.createOscillator();
        const gainNode = audioContextRef.current.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContextRef.current.destination);

        oscillator.frequency.setValueAtTime(
          frequency,
          audioContextRef.current.currentTime
        );

        if (type === "jump") {
          oscillator.type = "square";
          gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            audioContextRef.current.currentTime + duration
          );
        } else if (type === "score") {
          oscillator.type = "sine";
          gainNode.gain.setValueAtTime(0.2, audioContextRef.current.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(
            frequency * 2,
            audioContextRef.current.currentTime + duration
          );
          gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            audioContextRef.current.currentTime + duration
          );
        } else if (type === "crash") {
          oscillator.type = "sawtooth";
          gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(
            frequency * 0.5,
            audioContextRef.current.currentTime + duration
          );
          gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            audioContextRef.current.currentTime + duration
          );
        }

        oscillator.start(audioContextRef.current.currentTime);
        oscillator.stop(audioContextRef.current.currentTime + duration);
      } catch (error) {
        console.error("Audio playback failed:", error);
      }
    },
    [muted]
  );

  const insertGameScore = useCallback(
    async (finalScore: number) => {
      const data = {
        score: finalScore,
        game_type: "sky-hopper",
        user_name: user?.username,
        email:user?.email,
        game_id: "8343eabd-0072-4bd0-8fd4-e219d3f5a1f3",
        user: user?.user_id,
      };

      try {
        await GamesServices.insertScore(data);
      } catch (error) {
        console.error("Failed to insert flappy score:", error);
      }
    },
    [user?.username, user?.user_id]
  );

  const handleJump = useCallback(() => {
    initAudio();

    if (gameStarted && !gameOver && !paused) {
      setBirdPos((prev) => ({ ...prev, velocity: jumpStrength }));
      playSound(800, 0.1, "jump");
    } else if (!gameStarted && !gameOver) {
      // Start the game on first click/tap
      setGameStarted(true);
    } else if (gameOver) {
      // Restart the game if game over
      resetGame();
    }
  }, [gameStarted, gameOver, paused, playSound, initAudio]);

  // Reset the game
  const resetGame = () => {
    setBirdPos({ x: 80, y: 150, velocity: 0 });
    setPipes([]);
    setScore(0);
    setGameOver(false);
    setGameStarted(false);
    setBgPosition(0);
  };

  // Toggle pause
  const togglePause = () => {
    setPaused(!paused);
  };

  // Toggle mute
  const toggleMute = () => {
    setMuted(!muted);
  };

  // Update high score and save to localStorage
  const updateHighScore = useCallback(
    (newScore: number) => {
      if (newScore > highScore) {
        setHighScore(newScore);
        localStorage.setItem("sky-hopper-highscore", newScore.toString());
      }
    },
    [highScore]
  );

  // Update bird animation frame
  useEffect(() => {
    if (gameStarted && !gameOver && !paused) {
      const interval = setInterval(() => {
        setBirdFrameCount((prev) => (prev + 1) % 5);
        if (birdFrameCount === 4) {
          setBirdFrame((prev) => (prev + 1) % maxBirdFrames);
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, [gameStarted, gameOver, paused, birdFrameCount]);

  // Spawn pipes at regular intervals with random gap positions
  useEffect(() => {
    if (gameStarted && !gameOver && !paused) {
      const pipeInterval = setInterval(() => {
        // Random pipe height with more variation for gap position
        const minHeight = 80;
        const maxHeight = CANVAS_HEIGHT - pipeGap - 120;
        const randomHeight = Math.floor(
          Math.random() * (maxHeight - minHeight) + minHeight
        );

        setPipes((prevPipes) => [
          ...prevPipes,
          { x: CANVAS_WIDTH, y: randomHeight, passed: false },
        ]);
      }, pipeSpawnInterval);

      return () => clearInterval(pipeInterval);
    }
  }, [gameStarted, gameOver, paused]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        handleJump();
      } else if (e.code === "KeyP") {
        if (gameStarted && !gameOver) {
          togglePause();
        }
      } else if (e.code === "KeyR") {
        resetGame();
      } else if (e.code === "KeyM") {
        toggleMute();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleJump, gameStarted, gameOver]);

  // Main game loop
  useEffect(() => {
    // Get canvas context
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear and draw the game
    const drawGame = () => {
      // Clear canvas
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw sky
      ctx.fillStyle = colors.sky;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw pipes
      pipes.forEach((pipe) => {
        // Draw top pipe
        ctx.fillStyle = colors.pipe;
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.y);

        // Draw top pipe highlight
        ctx.fillStyle = colors.pipeHighlight;
        ctx.fillRect(pipe.x + 5, 0, 10, pipe.y);

        // Draw pipe cap
        ctx.fillStyle = colors.pipe;
        ctx.fillRect(pipe.x - 5, pipe.y - 30, pipeWidth + 10, 30);

        // Draw bottom pipe
        ctx.fillStyle = colors.pipe;
        ctx.fillRect(
          pipe.x,
          pipe.y + pipeGap,
          pipeWidth,
          CANVAS_HEIGHT - pipe.y - pipeGap
        );

        // Draw bottom pipe highlight
        ctx.fillStyle = colors.pipeHighlight;
        ctx.fillRect(
          pipe.x + 5,
          pipe.y + pipeGap,
          10,
          CANVAS_HEIGHT - pipe.y - pipeGap
        );

        // Draw pipe cap
        ctx.fillStyle = colors.pipe;
        ctx.fillRect(pipe.x - 5, pipe.y + pipeGap, pipeWidth + 10, 30);
      });

      // Draw ground
      ctx.fillStyle = colors.ground;
      ctx.fillRect(0, CANVAS_HEIGHT - 80, CANVAS_WIDTH, 80);

      // Draw ground pattern
      ctx.fillStyle = "#C6B471";
      for (let i = 0; i < CANVAS_WIDTH; i += 30) {
        ctx.fillRect(i - (bgPosition % 30), CANVAS_HEIGHT - 80, 15, 80);
      }

      // Draw bird
      const birdSize = 30;
      ctx.save();
      ctx.translate(birdPos.x + birdSize / 2, birdPos.y + birdSize / 2);

      // Rotate bird based on velocity
      const rotation =
        (Math.min(Math.max(birdPos.velocity * 3, -45), 45) * Math.PI) / 180;
      ctx.rotate(rotation);

      // Draw bird body
      ctx.fillStyle = colors.bird;
      ctx.beginPath();
      ctx.arc(-birdSize / 4, 0, birdSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = colors.birdOutline;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw bird face
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc(0, -5, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "black";
      ctx.beginPath();
      ctx.arc(3, -5, 3, 0, Math.PI * 2);
      ctx.fill();

      // Draw bird beak
      ctx.fillStyle = "orange";
      ctx.beginPath();
      ctx.moveTo(5, 0);
      ctx.lineTo(20, 0);
      ctx.lineTo(5, 5);
      ctx.closePath();
      ctx.fill();

      // Draw bird wings (based on animation frame)
      ctx.fillStyle = "#EDB200";
      ctx.beginPath();
      if (birdFrames[birdFrame] === 0) {
        ctx.ellipse(-15, 0, 12, 5, 0, 0, Math.PI * 2);
      } else if (birdFrames[birdFrame] === 1) {
        ctx.ellipse(-15, 0, 12, 8, 0, 0, Math.PI * 2);
      } else {
        ctx.ellipse(-15, 0, 12, 10, 0, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.strokeStyle = colors.birdOutline;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();

      // Draw score
      ctx.fillStyle = "white";
      ctx.strokeStyle = "black";
      ctx.lineWidth = 4;
      ctx.font = "bold 48px sans-serif";
      ctx.textAlign = "center";
      ctx.strokeText(score.toString(), CANVAS_WIDTH / 2, 60);
      ctx.fillText(score.toString(), CANVAS_WIDTH / 2, 60);

      // Draw start message
      if (!gameStarted && !gameOver) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = "white";
        ctx.font = "bold 36px sans-serif";
        ctx.textAlign = "center";

        ctx.font = "20px sans-serif";

        // Draw animated bird
        const centerBirdY =
          CANVAS_HEIGHT / 2 + 70 + Math.sin(Date.now() / 300) * 15;

        // Bird body
        ctx.fillStyle = colors.bird;
        ctx.beginPath();
        ctx.arc(CANVAS_WIDTH / 2 - 5, centerBirdY, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = colors.birdOutline;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Bird face
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(CANVAS_WIDTH / 2 + 5, centerBirdY - 5, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(CANVAS_WIDTH / 2 + 8, centerBirdY - 5, 3, 0, Math.PI * 2);
        ctx.fill();

        // Bird beak
        ctx.fillStyle = "orange";
        ctx.beginPath();
        ctx.moveTo(CANVAS_WIDTH / 2 + 10, centerBirdY);
        ctx.lineTo(CANVAS_WIDTH / 2 + 25, centerBirdY);
        ctx.lineTo(CANVAS_WIDTH / 2 + 10, centerBirdY + 5);
        ctx.closePath();
        ctx.fill();
      }

      // Game over screen
      if (gameOver) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = "white";
        ctx.font = "bold 36px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(t("games.skyHopper.gameOver"), CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);

        ctx.font = "24px sans-serif";
        ctx.fillText(`${t("common.score")}: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        ctx.fillText(
          `${t("games.skyHopper.best")} ${Math.max(score, highScore)}`,
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 + 40
        );

        ctx.font = "20px sans-serif";
        ctx.fillText(
          t("games.skyHopper.tapOrPressSpaceToRestart"),
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 + 100
        );
      }

      // Pause indicator
      if (paused && gameStarted && !gameOver) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = "white";
        ctx.font = "bold 36px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(t("games.skyHopper.paused"), CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

        ctx.font = "20px sans-serif";
        ctx.fillText(
          t("games.skyHopper.pressPToResume"),
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 + 50
        );
      }
    };

    // Game update function
    const updateGame = () => {
      if (gameStarted && !gameOver && !paused) {
        // Update bird position
        setBirdPos((prev) => {
          const newY = prev.y + prev.velocity;
          return {
            ...prev,
            y: newY,
            velocity: prev.velocity + gravity,
          };
        });

        // Update pipes position
        setPipes((prevPipes) => {
          return prevPipes
            .map((pipe) => {
              const updatedPipe = { ...pipe, x: pipe.x - pipeSpeed };

              // Check if pipe is passed
              if (!pipe.passed && updatedPipe.x + pipeWidth < birdPos.x) {
                setScore((prevScore) => prevScore + 1);
                playSound(1000, 0.2, "score");
                return { ...updatedPipe, passed: true };
              }
              return updatedPipe;
            })
            .filter((pipe) => pipe.x > -pipeWidth); // Remove pipes that are off screen
        });

        // Update background position
        setBgPosition((prev) => (prev + 1) % 30);

        // Check for collisions

        // Ground collision
        if (birdPos.y > CANVAS_HEIGHT - 80 - 15) {
          setGameOver(true);
          updateHighScore(score);
          insertGameScore(score);
          playSound(200, 0.5, "crash");
        }

        // Pipe collisions
        for (const pipe of pipes) {
          // Check if bird collides with top pipe
          if (
            birdPos.x + 15 > pipe.x &&
            birdPos.x - 15 < pipe.x + pipeWidth &&
            birdPos.y - 15 < pipe.y
          ) {
            setGameOver(true);
            updateHighScore(score);
            insertGameScore(score);
            playSound(200, 0.5, "crash");
            break;
          }

          // Check if bird collides with bottom pipe
          if (
            birdPos.x + 15 > pipe.x &&
            birdPos.x - 15 < pipe.x + pipeWidth &&
            birdPos.y + 15 > pipe.y + pipeGap
          ) {
            setGameOver(true);
            updateHighScore(score);
            insertGameScore(score);
            playSound(200, 0.5, "crash");
            break;
          }
        }
      }
    };

    // Game loop
    const gameLoop = () => {
      updateGame();
      drawGame();
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    // Start the game loop
    animationFrameRef.current = requestAnimationFrame(gameLoop);

    // Clean up
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [
    gameStarted,
    gameOver,
    paused,
    birdPos,
    pipes,
    score,
    highScore,
    birdFrame,
    bgPosition,
    muted,
    playSound,
    updateHighScore,
    insertGameScore,
  ]);

  // Handle canvas click/tap with improved mobile support
  const handleCanvasClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleJump();
  }, [handleJump]);

  // Handle touch events for better mobile support
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleJump();
  }, [handleJump]);

  const leaderboardUrl = `/games/leaderboard?${new URLSearchParams({
    name: t("games.skyHopper.name"),
    duration: "month",
    game_type: "sky-hopper",
    top_k: "10",
    sort_order: "desc",
    score_type: "max",
  }).toString()}`;

  const handleLeaderBoard = () => {
    if (gameOver || score == 0) {
      navigate(leaderboardUrl);
    } else {
      setPaused(true);
      setDialog(true);
    }
  };

  if (!user) {
    navigate("/");
    return null;
  }

  return (
    <Layout>
      <section className="py-8" style={{ fontFamily: "'Noto Naskh Arabic', system-ui, sans-serif" }}>
        <div className="container mx-auto px-4" dir={isArabic ? "rtl" : "ltr"}>
          <div className="game-container3" translate="no">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
              {/* Main Content: Games Grid - Takes 2 columns on large screens */}
              <div className="lg:col-span-2">
                {/* Header Section */}
                <div className="mb-6" translate="no">
                  <GamesMainHeadline title={t("common.games")} width={isArabic ? 120 : 144} />
                  <div className={`flex items-center justify-between mb-4 px-2 ${isArabic ? "text-right" : "text-left"}`} translate="no">
                    <div className="flex items-center gap-2">
                      <img src={FlappyBirdImage} alt="Flappy Bird Logo" className="w-20 h-20" />
                      <h2 className="text-2xl md:text-3xl font-bold" translate="no">{t("games.skyHopper.name")}</h2>
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
                      {/* Help Button */}
                      <LightButton onClick={() => setShowInstructions(true)}>
                        <HelpCircle className="h-4 w-4" />
                        {t("common.help")}
                      </LightButton>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Pause Button (Desktop only) */}
                      {!isMobile && (
                        <LightButton onClick={togglePause} disabled={!gameStarted || gameOver}>
                          {paused ? t("common.resume") : t("common.pause")}
                        </LightButton>
                      )}
                      {/* Mute Button */}
                      <LightButton onClick={toggleMute}>
                        {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                        {muted ? t("games.skyHopper.unmute") : t("games.skyHopper.mute")}
                      </LightButton>
                      {/* Score Button */}
                      <LightButton>
                        {t("common.score")}: {score}
                      </LightButton>
                    </div>
                  </div>

              <div className="flex justify-center items-center pt-2">
                <div className="w-full max-w-md bg-background border border-border rounded-lg overflow-hidden shadow-xl text-center">
                  <div className="relative text-center">
                    <canvas
                      ref={canvasRef}
                      width={CANVAS_WIDTH}
                      height={CANVAS_HEIGHT}
                      onClick={handleCanvasClick}
                      onTouchStart={handleTouchStart}
                      className="w-full touch-none select-none"
                      style={{ 
                        height: "auto",
                        touchAction: "none",
                        WebkitTouchCallout: "none",
                        WebkitUserSelect: "none",
                        userSelect: "none"
                      }}
                    />
                    {!gameStarted && !gameOver && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center">
                          <h2 className="text-2xl font-bold text-white drop-shadow-lg">
                            {t("games.skyHopper.name")}
                          </h2>
                          <p className="text-white drop-shadow-md mt-2">
                            {isMobile ? t("games.skyHopper.tapToStart") : t("games.skyHopper.tapOrPressSpaceToStart")}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
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
                    <p>
                      {isMobile 
                        ? t("games.skyHopper.tapTheScreenToMakeTheBirdFlyUpward")
                        : t("games.skyHopper.tapTheScreenOrPressTheSpaceBarToMakeTheBirdFlyUpward")
                      } {t("games.skyHopper.avoidTheGreenPipesAndDontHitTheGround")}
                    </p>
                    {!isMobile && (
                      <div className="bg-white/10 p-3 rounded-md">
                        <h4 className="font-medium mb-2 text-white">{t("games.skyHopper.controls")}</h4>
                        <ul className="space-y-1 text-sm text-white">
                          <li>
                            • <span className="font-medium">{t("games.skyHopper.spaceMakeTheBirdFly")}</span>
                          </li>
                          <li>
                            • <span className="font-medium">{t("games.skyHopper.pPauseTheGame")}</span>
                          </li>
                          <li>
                            • <span className="font-medium">{t("games.skyHopper.rRestartTheGame")}</span>
                          </li>
                          <li>
                            • <span className="font-medium">{t("games.skyHopper.mToggleSound")}</span>
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                </HowToPlayInstruction>
                <MostReadSidebar />
              </div>
            </div>
          </div>

        {/* Instructions Dialog */}
        <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
          <DialogContent dir={isArabic ? "rtl" : "ltr"}>
            <DialogHeader>
            <DialogTitle>{t("games.skyHopper.howToPlaySkyHopper")}</DialogTitle>
            <DialogDescription>
              <div className="space-y-4 mt-4">
                <p>
                  {isMobile 
                    ? t("games.skyHopper.tapTheScreenToMakeTheBirdFlyUpward")
                    : t("games.skyHopper.tapTheScreenOrPressTheSpaceBarToMakeTheBirdFlyUpward")
                  } {t("games.skyHopper.avoidTheGreenPipesAndDontHitTheGround")}
                </p>

                {!isMobile && (
                  <div className="bg-muted p-3 rounded-md">
                    <h4 className="font-medium mb-2">{t("games.skyHopper.controls")}</h4>
                    <ul className="space-y-1 text-sm">
                      <li>
                        • <span className="font-medium">{t("games.skyHopper.spaceMakeTheBirdFly")}</span>
                      </li>
                      <li>
                        • <span className="font-medium">{t("games.skyHopper.pPauseTheGame")}</span>
                      </li>
                      <li>
                        • <span className="font-medium">{t("games.skyHopper.rRestartTheGame")}</span>
                      </li>
                      <li>
                        • <span className="font-medium">{t("games.skyHopper.mToggleSound")}</span>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowInstructions(false)}>{t("common.gotIt")}</Button>
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
              <Button
                onClick={() => {
                  setDialog(false);
                  setPaused(false);
                }}
              >
                {t("common.noResume")}
              </Button>
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
      </div>
      </section>
    </Layout>
  );
};

export default FlappyBirdGame;
