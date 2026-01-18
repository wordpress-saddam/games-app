import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Layout from "../../components/Layout";
import { useToast } from "@/hooks/use-toast";
import { RotateCcw, ArrowLeft, Lightbulb, Home, ArrowRight } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Info, HelpCircle, RefreshCw } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import UserRegistrationDialog from "../../components/UserRegistrationDialog";
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
import { Input } from "@/components/ui/input";
import { ExternalLink } from "lucide-react";
import GamesServices from "../../../v2-services/games-service";
import { useUser } from "../../context/UserContext";
import LeaderboardModal from "./LeaderboardModal";
import { addUtmParams } from "@/lib/utils";

import { Trophy } from "lucide-react";

const ARABIC_ALPHABET = "ابتثجحخدذرزسشصضطظعغفقكلمنهوي".split('');

/**
 * Normalizes an Arabic string by removing diacritics and unifying character variants.
 * @param text The Arabic string to normalize.
 * @returns The normalized string.
 */
const normalizeArabic = (text: string): string => {
    if (!text) return "";
    return text
        // Remove diacritics (tashkeel)
        .replace(/[\u0617-\u061A\u064B-\u0652]/g, "")
        // Normalize Alef variants to a plain Alef
        .replace(/[أإآ]/g, "ا")
        // Normalize Alif Maqsurah to Yaa
        .replace(/ى/g, "ي");
};


interface GameData {
    id: string;
    data: {
        clue: string;
        word: string;
    };
    article_detail: {
        url: string;
        link: string;
        title: string;
        image_url: string;
        t: string;
        image: {
            th: string;
            o: string;
        };
    };
    article_guid: string;
}

interface HangmanProps {
    gameData: GameData[];
}

interface PlayedGame {
    handle_scramble: {
        gameIds: string[];
        lastGameData: string[];
        completedGames: { [gameId: string]: boolean };
    };
    hangman: {
        gameIds: string[];
        lastGameData: string[];
        completedGames: { [gameId: string]: boolean };
    };
}

interface AccumulatedScores {
    hangman: number;
    handle_scramble: number;
    quiz: number;
}

interface ReplayDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    finalScore?: number;
    totalGames?: number;
}

const ReplayDialog: React.FC<ReplayDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    finalScore = 0,
    totalGames = 0,
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent dir="rtl">
                <DialogHeader>
                    <DialogTitle>اللعبة انتهت!</DialogTitle>
                    <DialogDescription>
                        <div className="space-y-4 mt-4">
                            <div className="text-center bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-4 rounded-lg">
                                <div className="text-2xl font-bold text-primary mb-2">
                                    النتيجة النهائية: {finalScore}/{totalGames}
                                </div>
                                <div className="text-muted-foreground">
                                    {finalScore === totalGames
                                        ? "درجة كاملة! عمل رائع!"
                                        : finalScore > totalGames / 2
                                            ? "عمل جيد! أحسنت!"
                                            : "مجهود جيد! حاول مرة أخرى للتحسين!"}
                                </div>
                            </div>
                            <p className="text-center">هل تريد اللعب مرة أخرى؟</p>
                        </div>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex gap-2">
                    <Button variant="outline" onClick={onClose}>
                        لا، شكراً
                    </Button>
                    <Button onClick={onConfirm}>نعم، العب مجدداً</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const STORAGE_KEY = "played_games";
const SCORE_STORAGE_KEY = "accumulated_scores";

const Hangman: React.FC<HangmanProps> = ({ gameData }) => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useUser();
    const isArticleView = searchParams.get("src") === "article";
    const isMobile = useIsMobile();
    const [showCelebration, setShowCelebration] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const [currentGameIndex, setCurrentGameIndex] = useState(0);
    const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
    const [wrongGuesses, setWrongGuesses] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false);
    const [score, setScore] = useState(0);
    const [accumulatedScore, setAccumulatedScore] = useState(0);
    const [currentInput, setCurrentInput] = useState("");
    const [showDialog, setShowDialog] = useState(false);
    const [showReplayDialog, setShowReplayDialog] = useState(false);
    const [hasDeclinedReplay, setHasDeclinedReplay] = useState(false);
    const [allGamesCompleted, setAllGamesCompleted] = useState(false);
    const { toast } = useToast();
    const [showInstructions, setShowInstructions] = useState(false);

    // ref for the input box and handlers to manage single-letter input + Enter key
    const inputRef = useRef<HTMLInputElement | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value || "";
        // Keep only the last character typed so input behaves like single-letter entry
        setCurrentInput(val.slice(-1));
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            const letter = currentInput.trim();
            if (letter) {
                handleLetterGuess(letter);
                setCurrentInput("");
                // keep focus for quick successive guesses
                inputRef.current?.focus();
            }
        }
    };

    const maxWrongGuesses = 6;
    const currentGame = gameData[currentGameIndex];
    const word = currentGame?.data.word.toLowerCase() || "";
    const clue = currentGame?.data.clue || "";
    const game_id = gameData[currentGameIndex]?.id;

    const normalizedWord = useMemo(() => normalizeArabic(word), [word]);


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

    // Insert game score functionality
    const insertGameScore = useCallback(
        async (finalScore: number) => {
            const data = {
                score: finalScore,
                game_type: "hangman",
                user_name: user?.username,
                game_id: game_id,
                user: user?.user_id,
                email: user?.email,

            };

            try {
                const res = await GamesServices.insertScore(data);
                console.log("Score inserted successfully:", res);
            } catch (error) {
                console.error("Failed to insert Hangman game score:", error);
            }
        },
        [user?.username, game_id]
    );

    // Helper functions for localStorage management
    const getAccumulatedScores = (): AccumulatedScores => {
        try {
            const stored = localStorage.getItem(SCORE_STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error(
                "Error reading accumulated scores from localStorage:",
                error
            );
        }

        return {
            hangman: 0,
            handle_scramble: 0,
            quiz: 0,
        };
    };

    const updateAccumulatedScore = (
        gameType: string,
        newScore: number
    ): number => {
        const currentScores = getAccumulatedScores();
        const updatedScores = {
            ...currentScores,
            [gameType]:
                (currentScores[gameType as keyof AccumulatedScores] || 0) + newScore,
        };

        try {
            localStorage.setItem(SCORE_STORAGE_KEY, JSON.stringify(updatedScores));
            setAccumulatedScore(updatedScores.hangman);
            return updatedScores.hangman;
        } catch (error) {
            console.error("Error saving accumulated scores to localStorage:", error);
            return currentScores.hangman || 0;
        }
    };

    const getPlayedGames = (): PlayedGame => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (!parsed.hangman) {
                    parsed.hangman = {
                        gameIds: [],
                        lastGameData: [],
                        completedGames: {},
                    };
                }
                return parsed;
            }
        } catch (error) {
            console.error("Error reading from localStorage:", error);
        }

        return {
            handle_scramble: {
                gameIds: [],
                lastGameData: [],
                completedGames: {},
            },
            hangman: {
                gameIds: [],
                lastGameData: [],
                completedGames: {},
            },
        };
    };

    const savePlayedGames = (playedGames: PlayedGame) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(playedGames));
        } catch (error) {
            console.error("Error saving to localStorage:", error);
        }
    };

    const clearPlayedGames = () => {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(SCORE_STORAGE_KEY);
        setAccumulatedScore(0);
    };

    const checkGameDataChanged = (): boolean => {
        const playedGames = getPlayedGames();
        const currentGameIds = gameData.map((game) => game.id);
        const storedGameIds = playedGames.hangman.lastGameData || [];

        if (storedGameIds.length !== currentGameIds.length) {
            return true;
        }

        return !currentGameIds.every((id, index) => id === storedGameIds[index]);
    };

    const markGameAsPlayed = async (gameId: string, score: number) => {
        const playedGames = getPlayedGames();

        if (!playedGames.hangman.gameIds.includes(gameId)) {
            playedGames.hangman.gameIds.push(gameId);
        }

        playedGames.hangman.completedGames[gameId] = true;
        playedGames.hangman.lastGameData = gameData.map((game) => game.id);

        savePlayedGames(playedGames);
        updateAccumulatedScore("hangman", score);

        // Insert score to backend if user is logged in
        if (user?.username) {
            await insertGameScore(score);
        }
    };

    const isGamePlayed = (gameId: string): boolean => {
        const playedGames = getPlayedGames();
        return playedGames.hangman.completedGames[gameId] || false;
    };

    const findNextUnplayedGame = (startIndex: number = 0): number => {
        for (let i = startIndex; i < gameData.length; i++) {
            if (!isGamePlayed(gameData[i].id)) {
                return i;
            }
        }
        return -1;
    };

    const handleReplayClose = () => {
        setShowReplayDialog(false);
        setHasDeclinedReplay(true);
        setAllGamesCompleted(true);
    };

    const handleReplayConfirm = () => {
        clearPlayedGames();
        setCurrentGameIndex(0);
        setHasDeclinedReplay(false);
        setAllGamesCompleted(false);
        setShowReplayDialog(false);
        setScore(0);
        resetCurrentGame();
    };

    // Initialize game state
    useEffect(() => {
        if (gameData && gameData.length > 0) {
            const scores = getAccumulatedScores();
            setAccumulatedScore(scores.hangman);

            const playedGames = getPlayedGames();

            if (playedGames.hangman.gameIds.length > 0) {
                const gameDataHasChanged = checkGameDataChanged();

                if (gameDataHasChanged) {
                    clearPlayedGames();
                    setCurrentGameIndex(0);
                    setHasDeclinedReplay(false);
                    setAllGamesCompleted(false);
                    setScore(0);
                    return;
                }
            }

            if (isArticleView) {
                return;
            }

            const completedGameIds = playedGames.hangman.gameIds;
            const nextUncompletedIndex = gameData.findIndex(
                (game) => !completedGameIds.includes(game.id)
            );

            if (nextUncompletedIndex === -1) {
                setAllGamesCompleted(true);
                setShowReplayDialog(true);
            } else {
                setCurrentGameIndex(nextUncompletedIndex);
            }
        }
    }, [gameData, isArticleView]);

    useEffect(() => {
        if (currentGame) {
            setGuessedLetters(new Set());
            setWrongGuesses(0);
            setIsCompleted(false);
            setCurrentInput("");
        }
    }, [currentGame]);

    useEffect(() => {
        if (word && guessedLetters.size > 0) {
            const isWordComplete = normalizedWord
                .split("")
                .every((letter) => guessedLetters.has(normalizeArabic(letter)) || letter === " ");

            if (isWordComplete && !isCompleted) {
                // Initialize audio and play success sound
                initAudio();
                playSuccessSound();

                // Show celebration animation
                setShowCelebration(true);
                setTimeout(() => setShowCelebration(false), 3000);

                const gameScore = 1;
                markGameAsPlayed(game_id, gameScore);
                setIsCompleted(true);
                setScore(score + gameScore);
                toast({
                    title: "مبروك! 🎉",
                    className:
                        "bg-green-600 text-white font-semibold border-none shadow-xl",
                    description: "لقد خمّنت الكلمة بشكل صحيح!",
                });
            } else if (wrongGuesses >= maxWrongGuesses && !isCompleted) {
                const gameScore = 0;
                markGameAsPlayed(game_id, gameScore);
                setIsCompleted(true);
                toast({
                    title: "انتهت اللعبة!",
                    className:
                        "bg-red-500 text-white font-semibold border-none shadow-xl",
                    description: `الكلمة كانت: ${word}`,
                    variant: "destructive",
                });
            }
        }
    }, [guessedLetters, wrongGuesses, word, isCompleted, score, toast, game_id, initAudio, playSuccessSound]);


    const handleLetterGuess = (letter: string) => {
        const normalizedLetter = normalizeArabic(letter);
        if (guessedLetters.has(normalizedLetter) || isCompleted) return;
        setGuessedLetters(prev => new Set(prev).add(normalizedLetter));
        if (!normalizedWord.includes(normalizedLetter)) {
            setWrongGuesses(wrongGuesses + 1);
        }
    };

    const resetCurrentGame = () => {
        setGuessedLetters(new Set());
        setWrongGuesses(0);
        setIsCompleted(false);
    };

    const nextWord = () => {
        if (isArticleView) {
            const nextIndex = currentGameIndex + 1;
            if (nextIndex < gameData.length) {
                setCurrentGameIndex(nextIndex);
            } else {
                setAllGamesCompleted(true);
                setShowReplayDialog(true);
            }
            return;
        }

        const playedGames = getPlayedGames();
        const completedGameIds = playedGames.hangman.gameIds;

        const nextUncompletedIndex = gameData.findIndex(
            (game, index) =>
                index > currentGameIndex && !completedGameIds.includes(game.id)
        );

        if (nextUncompletedIndex !== -1) {
            setCurrentGameIndex(nextUncompletedIndex);
        } else {
            setAllGamesCompleted(true);
            setShowReplayDialog(true);
        }
    };

    const handleUserRegistrationSuccess = async (newUser: {
        username: string;
    }) => {
        window.location.href = leaderboardUrl;
    };

    const leaderboardUrl = isArticleView
        ? `/leaderboard?${new URLSearchParams({
            name: "Hangman",
            duration: "month",
            game_type: "hangman",
            top_k: "10",
            sort_order: "desc",
            score_type: "sum",
        }).toString()}`
        : `/games/leaderboard?${new URLSearchParams({
            name: "Hangman",
            duration: "month",
            game_type: "hangman",
            top_k: "10",
            sort_order: "desc",
            score_type: "sum",
        }).toString()}`;

    const renderWord = () => {
        return word.split("").map((letter, index) => (
            <span
                key={index}
                className="inline-block w-8 h-10 mx-1 text-2xl font-bold text-center border-b-2 border-gray-400 dark:border-gray-500"
            >
                {letter === " "
                    ? ""
                    : guessedLetters.has(normalizeArabic(letter))
                        ? letter
                        : ""}
            </span>
        ));
    };

    const renderHangman = () => {
        return (
            <div className="flex justify-center items-center bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                <svg width="200" height="250" viewBox="0 0 200 250" className="mx-auto">
                    {/* Base */}
                    <line x1="10" y1="230" x2="150" y2="230" stroke="currentColor" strokeWidth="4" />

                    {/* Vertical pole */}
                    <line x1="50" y1="230" x2="50" y2="20" stroke="currentColor" strokeWidth="4" />

                    {/* Top horizontal */}
                    <line x1="50" y1="20" x2="130" y2="20" stroke="currentColor" strokeWidth="4" />

                    {/* Rope */}
                    <line x1="130" y1="20" x2="130" y2="50" stroke="currentColor" strokeWidth="2" />

                    {/* Head - appears at wrongGuesses >= 1 */}
                    {wrongGuesses >= 1 && (
                        <circle cx="130" cy="70" r="20" stroke="currentColor" strokeWidth="3" fill="none" />
                    )}

                    {/* Body - appears at wrongGuesses >= 2 */}
                    {wrongGuesses >= 2 && (
                        <line x1="130" y1="90" x2="130" y2="150" stroke="currentColor" strokeWidth="3" />
                    )}

                    {/* Left arm - appears at wrongGuesses >= 3 */}
                    {wrongGuesses >= 3 && (
                        <line x1="130" y1="110" x2="100" y2="130" stroke="currentColor" strokeWidth="3" />
                    )}

                    {/* Right arm - appears at wrongGuesses >= 4 */}
                    {wrongGuesses >= 4 && (
                        <line x1="130" y1="110" x2="160" y2="130" stroke="currentColor" strokeWidth="3" />
                    )}

                    {/* Left leg - appears at wrongGuesses >= 5 */}
                    {wrongGuesses >= 5 && (
                        <line x1="130" y1="150" x2="100" y2="180" stroke="currentColor" strokeWidth="3" />
                    )}

                    {/* Right leg - appears at wrongGuesses >= 6 */}
                    {wrongGuesses >= 6 && (
                        <line x1="130" y1="150" x2="160" y2="180" stroke="currentColor" strokeWidth="3" />
                    )}
                </svg>
            </div>
        );
    };
    const renderGuessedLetters = () => {
        const guessedArray = Array.from(guessedLetters).sort();
        const correctLetters = guessedArray.filter((letter) =>
            word.includes(letter)
        );
        const wrongLetters = guessedArray.filter(
            (letter) => !word.includes(letter)
        );

        return (
            <div className="mb-4" dir="rtl">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-sm font-medium">صحيح: </span>
                    {correctLetters.map((letter) => (
                        <span
                            key={letter}
                            className="flex items-center justify-center w-7 h-7 bg-green-100 text-green-800 rounded text-sm font-bold"
                        >
                            {letter.toUpperCase()}
                        </span>
                    ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">خطأ: </span>
                    {wrongLetters.map((letter) => (
                        <span
                            key={letter}
                            className="flex items-center justify-center w-7 h-7 bg-red-100 text-red-800 rounded text-sm font-bold"
                        >
                            {letter.toUpperCase()}
                        </span>
                    ))}
                </div>
            </div>
        );
    };

    if (!currentGame) {
        const component = (
            <div className="text-center" dir="rtl">
                <h1 className="text-3xl font-bold mb-4">لا توجد بيانات لعبة متاحة</h1>
            </div>
        );
        return isArticleView ? component : <Layout>{component}</Layout>;
    }

    if (!user && !isArticleView) {
        navigate("/");
    }
    const component = (
        <div className="game-area relative" dir="rtl">
            {/* Enhanced Celebration Animation */}
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

            <div className="game-container"   style={{ maxWidth: '1300px', margin: '0 auto' }}>
                {isMobile && isArticleView && (
                    <button
                        onClick={() => (window.location.href = window.location.origin)}
                        className="absolute top-4 right-4 z-10 p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-full transition-colors"
                        aria-label="الذهاب للصفحة الرئيسية"
                    >
                        <Home size={20} className="text-slate-600 dark:text-slate-300" />
                    </button>
                )}

                {/* Header Section */}
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h1 className="text-2xl md:text-3xl font-bold mr-12 md:mr-0">
                            لعبة الرجل المشنوق
                        </h1>
                        {!user?.isAnonymous && (
                        isArticleView ? (
                            <a
                                href="#"
                                className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold shadow-lg rounded-md px-3 py-2 flex items-center"
                                onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                                    e.preventDefault();
                                    if (!user?.username) {
                                        setShowDialog(true);
                                    } else {
                                        window.location.href = leaderboardUrl;
                                    }
                                }}
                                rel="noopener noreferrer"
                            >
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span aria-label="لوحة المتصدرين">
                                            <Trophy size={18} />
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent>لوحة المتصدرين</TooltipContent>
                                </Tooltip>
                            </a>
                        ) : (
                            <Button
                                onClick={(): void => navigate(leaderboardUrl)}
                                className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold shadow-lg"
                            >
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span aria-label="لوحة المتصدرين">
                                            <Trophy size={18} />
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent>لوحة المتصدرين</TooltipContent>
                                </Tooltip>
                            </Button>
                        )
                        )}
                    </div>
                </div>

                {/* All Games Completed Message */}
                {allGamesCompleted && hasDeclinedReplay && !isArticleView && (
                    <div className="mb-6 bg-card border border-border p-6 rounded-lg shadow-lg text-center">
                        <h3 className="text-2xl font-semibold mb-4 text-primary">
                            جميع الألعاب اكتملت!
                        </h3>
                        <div className="text-center bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-4 rounded-lg mb-4">
                            <div className="text-xl font-semibold text-secondary mb-2">
                                النتيجة الإجمالية: {accumulatedScore}
                            </div>
                            <div className="text-muted-foreground">
                                {score === gameData.length
                                    ? "جلسة مثالية! عمل رائع!"
                                    : score > gameData.length / 2
                                        ? "جلسة رائعة! أحسنت!"
                                        : "مجهود جيد! حاول مرة أخرى للتحسين!"}
                            </div>
                        </div>
                        <p className="text-muted-foreground mb-6">
                            لقد أنهيت جميع الألعاب المتاحة. سنضيف ألعاباً جديدة قريباً!
                        </p>
                        <div className="space-y-3">
                            <Button
                                onClick={handleReplayConfirm}
                                className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-full transition-colors"
                            >
                                <RefreshCw className="ml-2 h-4 w-4" />
                                أعد اللعب
                            </Button>
                            <p className="text-sm text-muted-foreground">
                                أو انتظر إضافة ألعاب جديدة
                            </p>
                        </div>
                    </div>
                )}

                {/* Game Content */}
                {!(allGamesCompleted && hasDeclinedReplay && !isArticleView) && (
                    <div className="flex flex-col md:flex-row w-full gap-4">
                        <div className="bg-card border border-border rounded-lg shadow-lg overflow-hidden pb-3 w-full md:w-[70%]">
                            <div className="bg-muted/50 p-2 flex flex-wrap items-center justify-between gap-1 border-b border-border">
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm">
                                        النتيجة: {score}
                                    </Button>

                                    <Button variant="outline" size="sm">
                                        الإجمالي: {accumulatedScore}
                                    </Button>

                                    <Button variant="outline" size="sm">
                                        خطأ: {wrongGuesses}/{maxWrongGuesses}
                                    </Button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm">
                                        الجولة: {currentGameIndex + 1}/{gameData.length}
                                    </Button>
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

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-card rounded-lg p-6 shadow-lg border">
                                    <div className="mb-6">
                                        <h3 className="text-lg font-semibold mb-3 text-center">
                                            الرجل المشنوق
                                        </h3>
                                        {renderHangman()}
                                    </div>

                                    <div className="mb-6">
                                        <h3 className="text-lg font-semibold mb-3 text-center">
                                            الكلمة
                                        </h3>
                                        <div className="flex justify-center flex-wrap">
                                            {renderWord()}
                                        </div>
                                    </div>

                                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                        <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                                            التلميح: {clue}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-card rounded-lg p-6 shadow-lg border">
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <h3 className="text-lg font-semibold">قم بالتخمين</h3>
                                    </div>
                                    <div className="mb-4">
                                        <p className="text-xs text-muted-foreground mb-2">
                                            اكتب حرفاً واضغط Enter:
                                        </p>
                                        <Input
                                            autoComplete="off"
                                            ref={inputRef}
                                            id="letterInput"
                                            type="text"
                                            value={currentInput}
                                            onChange={handleInputChange}
                                            onKeyDown={handleKeyPress} // Changed from onKeyPress for better Enter key detection
                                            placeholder="أدخل حرفاً"
                                            className="text-center text-lg font-semibold h-10 border dark:border-white"
                                            disabled={isCompleted}
                                            dir="rtl"
                                        />
                                    </div>

                                    {guessedLetters.size > 0 && renderGuessedLetters()}

                                    <div className="flex flex-wrap gap-3 justify-center">
                                        {!isCompleted ? (
                                            <div key="reset-button">
                                                <button
                                                    onClick={resetCurrentGame}
                                                    className="flex items-center gap-2 px-5 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                                                >
                                                    <RotateCcw size={16} />
                                                    إعادة تعيين
                                                </button>
                                            </div>
                                        ) : !isArticleView ? (
                                            <div key="next-word-button">
                                                <button
                                                    onClick={nextWord}
                                                    className="px-8 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all font-medium shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
                                                >
                                                    <ArrowLeft size={18} />
                                                    الكلمة التالية
                                                </button>
                                            </div>
                                        ) : (
                                            <div key="replay-button">
                                                <button
                                                    onClick={handleReplayConfirm}
                                                    className="px-8 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                                                >
                                                    العب مجدداً
                                                </button>
                                            </div>
                                        )}
                                    </div>
    {/* On-screen Arabic Keyboard - Always Visible */}
                        <div
                            className="
                                w-full bg-card border-t border-border p-3 md:p-4 mt-4
                                md:static md:border-none md:shadow-none md:bg-transparent md:mt-0
                                fixed bottom-0 left-0 right-0 
                                md:w-full md:max-w-lg md:mx-auto
                            "
                        >
                            <div className="grid grid-cols-7 sm:grid-cols-8 gap-1.5 sm:gap-2">
                                {ARABIC_ALPHABET.map((letter) => {
                                    const isGuessed = guessedLetters.has(letter);
                                    const isCorrect = isGuessed && normalizedWord.includes(letter);
                                    const isWrong = isGuessed && !normalizedWord.includes(letter);

                                    return (
                                        <button
                                            key={letter}
                                            onClick={() => handleLetterGuess(letter)}
                                            disabled={isGuessed || isCompleted}
                                            className={`
                                                h-10 sm:h-12 rounded-lg text-lg font-bold transition-all duration-150
                                                flex items-center justify-center
                                                active:scale-95 hover:scale-105
                                                ${isCorrect
                                                    ? 'bg-green-500 text-white'
                                                    : isWrong
                                                        ? 'bg-red-500 text-white'
                                                        : 'bg-muted hover:bg-muted/80'
                                                }
                                                disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
                                            `}
                                        >
                                            {letter}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                                    {!isArticleView && currentGame?.article_detail &&
                                        (isMobile ? (
                                            <a
                                                href={addUtmParams(currentGame?.article_detail?.link || "")}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex mb-4 items-start mt-4 gap-4 p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 hover:shadow-md transition-shadow"
                                            >
                                                {/* Right: Image for RTL */}
                                                <div className="w-24 sm:w-28 md:w-32 lg:w-40 flex items-center justify-center h-[120px] sm:h-[140px] ">
                                                    <img
                                                        src={currentGame?.article_detail?.image_url}
                                                        alt="صورة المقال"
                                                        className="h-full w-full object-cover rounded-md"
                                                        onError={(e) => {
                                                            e.currentTarget.onerror = null;
                                                            e.currentTarget.src =
                                                                "https://idea410.digital.uic.edu/wp-content/themes/koji/assets/images/default-fallback-image.png";
                                                        }}
                                                    />
                                                </div>

                                                {/* Left: Headline Text for RTL */}
                                                <div className="flex-1 text-right">
                                                    <h3 className="font-semibold mb-1 text-blue-900 dark:text-blue-100">
                                                        اقرأ المزيد عن المقال:{" "}
                                                    </h3>
                                                    <p className="text-blue-800 dark:text-blue-200 font-medium leading-relaxed hover:underline cursor-pointer">
                                                        {currentGame?.article_detail?.title}
                                                        <span className="mr-2 align-middle inline-block">
                                                            <ExternalLink
                                                                className="w-5 h-5 text-primary mb-2"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    window.open(
                                                                        addUtmParams(currentGame?.article_detail?.link || ""),
                                                                        "_blank"
                                                                    );
                                                                }}
                                                            />
                                                        </span>
                                                    </p>
                                                </div>
                                            </a>
                                        ) : (
                                            <a
                                                href={addUtmParams(currentGame?.article_detail?.link || "")}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex flex-col mb-4 items-center gap-4 p-4 rounded-xl  hover:shadow-md transition-shadow "
                                            >
                                                {/* Image */}
                                                <div className="w-24 sm:w-28 md:w-32 lg:w-40 flex items-center justify-center h-[120px] sm:h-[140px]">
                                                    <img
                                                        src={currentGame?.article_detail?.image_url}
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
                                                        {currentGame?.article_detail?.title}
                                                        <span className="mr-2 align-middle inline-block">
                                                            <ExternalLink
                                                                className="w-5 h-5 text-primary mb-2"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    window.open(
                                                                        addUtmParams(currentGame?.article_detail?.link || ""),
                                                                        "_blank"
                                                                    );
                                                                }}
                                                            />
                                                        </span>
                                                    </p>
                                                </div>
                                            </a>
                                        ))}
                                </div>
                            </div>

                            {isCompleted && (
                                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <h3 className="font-semibold mb-2 text-center">
                                        الكلمة: {word.toUpperCase()}
                                    </h3>
                                </div>
                            )}
                        </div>
                    

                        <div className="w-full md:w-[30%]">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">كيفية اللعب</CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm space-y-2">
                                    <p className="text-sm text-muted-foreground italic mt-2">
                        انقر على حرف لتخمينه. لديك{" "}
                                        <span className="font-bold text-red-500">6 فرص</span> لارتكاب أخطاء. بعد ذلك، تنتهي اللعبة. اختر حروفك بحكمة!
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}
            </div>

            <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
                <DialogContent dir="rtl">
                    <DialogHeader>
                        <DialogTitle>كيفية لعب لعبة الرجل المشنوق</DialogTitle>
                        <DialogDescription>
                            <div className="space-y-4 mt-4">
                                <p className="text-sm text-muted-foreground italic mt-2">
                  انقر على حرف لتخمينه. لديك{" "}
                                    <span className="font-bold text-red-500">6 فرص</span> لارتكاب أخطاء. بعد ذلك، تنتهي اللعبة. اختر حروفك بحكمة!
                                </p>
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button onClick={() => setShowInstructions(false)}>فهمت</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <UserRegistrationDialog
                isOpen={showDialog}
                onClose={() => setShowDialog(false)}
                onSuccess={handleUserRegistrationSuccess}
                title="املأ التفاصيل لعرض لوحة المتصدرين"
            />

            <ReplayDialog
                isOpen={showReplayDialog}
                onClose={handleReplayClose}
                onConfirm={handleReplayConfirm}
                finalScore={score}
                totalGames={gameData.length}
            />


            <style>{`
        .celebration-container {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .confetti-card {
          animation: confetti-fall linear forwards;
          pointer-events: none;
        }

        .celebration-text {
          animation: celebration-pulse 2s ease-in-out;
        }

        @keyframes confetti-fall {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0.3;
          }
        }

        @keyframes celebration-pulse {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            transform: translate(-50%, -50%) scale(1.1);
          }
        }

        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% {
            transform: translate3d(0, 0, 0);
          }
          40%, 43% {
            transform: translate3d(0, -10px, 0);
          }
          70% {
            transform: translate3d(0, -5px, 0);
          }
          90% {
            transform: translate3d(0, -2px, 0);
          }
        }

        .animate-bounce {
          animation: bounce 1s ease-in-out;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
        </div>
    );

    return isArticleView ? component : <Layout>{component}</Layout>;
};

export default Hangman;