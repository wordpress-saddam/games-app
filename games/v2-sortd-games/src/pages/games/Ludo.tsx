import React, { useState, useEffect } from 'react';
import Layout from "../../components/Layout";
import { useTranslation } from "react-i18next";
import { useUser } from "../../context/UserContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../hooks/use-toast";
import BackToHome from "../../components/ui/BackToHome";
import GamesMainHeadline from "../../components/ui/GamesMainHeadline";
import HowToPlayInstruction from "../../components/ui/HowToPlayInstruction";
import { ResetButtonTopRounded } from "../../components/ui/GamesButton";
import HumanIcon from "../../components/ui/HumanIcon";
import ComputerIcon from "../../components/ui/ComputerIcon";
import { RefreshCw, Users, User } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Game Types and Constants
type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';
type Mode = 'human-vs-computer' | 'human-vs-human';

interface Token {
    id: number;
    position: number; // -1: base, 0-51: main path, 52-57: home stretch, 99: home
    status: 'base' | 'active' | 'home';
}

interface Player {
    color: PlayerColor;
    tokens: Token[];
    isComputer: boolean;
    hasFinished: boolean;
}

const SAFE_SPOTS = [0, 8, 13, 21, 26, 34, 39, 47]; // Global path indices

// Path Offsets for each color
const START_OFFSETS: Record<PlayerColor, number> = {
    red: 0,
    green: 13,
    yellow: 26,
    blue: 39
};

const Ludo = () => {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === 'ar';
    const { user } = useUser();
    const navigate = useNavigate();
    const { toast } = useToast();

    // Game State
    const [gameMode, setGameMode] = useState<Mode>('human-vs-computer');
    const [players, setPlayers] = useState<Player[]>([]);
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
    const [diceValue, setDiceValue] = useState<number | null>(null);
    const [waitingForRoll, setWaitingForRoll] = useState(true);
    const [waitingForMove, setWaitingForMove] = useState(false);
    const [winner, setWinner] = useState<PlayerColor | null>(null);

    // UI State
    const [showModeDialog, setShowModeDialog] = useState(true);
    const [selectionStep, setSelectionStep] = useState<'mode' | 'players'>('mode');
    const [tempMode, setTempMode] = useState<Mode>('human-vs-computer');

    const [isRolling, setIsRolling] = useState(false);

    // Initialize Game
    const initGame = (mode: Mode, playerCount: number) => {
        let colors: PlayerColor[] = [];
        if (playerCount === 2) {
            colors = ['red', 'yellow']; // Opposite corners
        } else if (playerCount === 3) {
            colors = ['red', 'green', 'yellow'];
        } else {
            colors = ['red', 'green', 'yellow', 'blue'];
        }

        const newPlayers: Player[] = colors.map(color => ({
            color,
            tokens: createTokens(),
            isComputer: mode === 'human-vs-computer' && color !== 'red', // Red is always human in PvC
            hasFinished: false
        }));

        setPlayers(newPlayers);
        setGameMode(mode);
        setCurrentPlayerIndex(0);
        setDiceValue(null);
        setWaitingForRoll(true);
        setWaitingForMove(false);
        setWinner(null);
        setShowModeDialog(false);
        setSelectionStep('mode');
    };

    const createTokens = (): Token[] => {
        return [0, 1, 2, 3].map(id => ({ id, position: -1, status: 'base' }));
    };

    const getGlobalPosition = (color: PlayerColor, localPos: number): number => {
        if (localPos === -1) return -1; // Base
        if (localPos >= 56) return 99; // Home
        if (localPos > 50) return -2; // In home straight

        let offset = START_OFFSETS[color];
        return (localPos + offset) % 52;
    };

    // Dice Logic
    const rollDice = () => {
        if (!waitingForRoll || winner) return;

        setIsRolling(true);

        // Simple animation delay
        setTimeout(() => {
            const roll = Math.floor(Math.random() * 6) + 1;
            setDiceValue(roll);
            setIsRolling(false);
            setWaitingForRoll(false);

            // Check if moves are possible
            const currentPlayer = players[currentPlayerIndex];
            const canMove = currentPlayer.tokens.some(token => canTokenMove(token, roll));

            if (canMove) {
                setWaitingForMove(true);
            } else {
                toast({ title: t(`games.ludo.playerTurn`, { player: t(`games.ludo.${currentPlayer.color}`) }), description: t('games.ludo.noMoves'), duration: 1000 });
                setTimeout(nextTurn, 1000);
            }
        }, 500);
    };

    const canTokenMove = (token: Token, roll: number): boolean => {
        if (token.status === 'home') return false;
        if (token.status === 'base') return roll === 6;
        if (token.position + roll > 56) return false;
        return true;
    };

    const handleTokenClick = (playerIndex: number, tokenIndex: number) => {
        if (winner) return;
        if (waitingForRoll) return;
        if (playerIndex !== currentPlayerIndex) return;
        if (players[playerIndex].isComputer) return;

        attemptMove(tokenIndex);
    };

    const attemptMove = (tokenIndex: number) => {
        const player = players[currentPlayerIndex];
        const token = player.tokens[tokenIndex];

        if (!diceValue || !canTokenMove(token, diceValue)) return;

        moveToken(currentPlayerIndex, tokenIndex, diceValue);
    };

    const moveToken = (pIdx: number, tIdx: number, steps: number) => {
        setWaitingForMove(false);
        const newPlayers = [...players];
        const player = newPlayers[pIdx];
        const token = player.tokens[tIdx];

        // Move logic
        if (token.status === 'base') {
            token.position = 0;
            token.status = 'active';
        } else {
            token.position += steps;
            if (token.position === 56) {
                token.status = 'home';
            }
        }

        // Cutting Logic
        if (token.status !== 'home') {
            const globalPos = getGlobalPosition(player.color, token.position);
            // Note: getGlobalPosition returns -2 for home straight, so no cutting there
            if (!SAFE_SPOTS.includes(globalPos) && globalPos >= 0) {
                newPlayers.forEach((otherPlayer, otherPIdx) => {
                    if (pIdx === otherPIdx) return;
                    otherPlayer.tokens.forEach(otherToken => {
                        if (otherToken.status === 'active') {
                            const otherGlobal = getGlobalPosition(otherPlayer.color, otherToken.position);
                            if (otherGlobal === globalPos) {
                                // Cut!
                                otherToken.position = -1;
                                otherToken.status = 'base';
                                toast({
                                    title: "Cut!",
                                    description: `${t(`games.ludo.${player.color}`)} sent ${t(`games.ludo.${otherPlayer.color}`)} home!`,
                                    variant: "destructive"
                                });
                            }
                        }
                    });
                });
            }
        }

        // Check Win
        if (player.tokens.every(t => t.status === 'home')) {
            player.hasFinished = true;
            setWinner(player.color);
            toast({
                title: t('games.ludo.gameWon', { player: t(`games.ludo.${player.color}`) }),
                className: "bg-green-600 text-white"
            });
            setPlayers(newPlayers);
            return;
        }

        setPlayers(newPlayers);

        // Turn logic
        if (steps === 6) {
            setDiceValue(null);
            setWaitingForRoll(true);
            setWaitingForMove(false);
            toast({ description: t('games.ludo.extraTurn'), duration: 1000 });
        } else {
            nextTurn();
        }
    };

    const nextTurn = () => {
        setDiceValue(null);
        setWaitingForRoll(true);
        setWaitingForMove(false);

        let nextIndex = (currentPlayerIndex + 1) % players.length;
        // Skip finished players (not implemented fully for multi-player continue, but safety check)
        // For now, if someone wins, game ends.
        setCurrentPlayerIndex(nextIndex);
    };

    // AI Logic
    useEffect(() => {
        if (!winner && players[currentPlayerIndex]?.isComputer && waitingForRoll) {
            const timer = setTimeout(() => {
                rollDice();
            }, 1000);
            return () => clearTimeout(timer);
        }
        if (!winner && players[currentPlayerIndex]?.isComputer && waitingForMove && diceValue) {
            const timer = setTimeout(() => {
                const player = players[currentPlayerIndex];
                const movableTokens = player.tokens
                    .map((t, i) => ({ t, i }))
                    .filter(item => canTokenMove(item.t, diceValue));

                if (movableTokens.length > 0) {
                    // AI Strategy: 
                    // 1. Cut opponent
                    // 2. Move token out of base
                    // 3. Move closest to home?

                    // Random for now is fine, or simple priority
                    const pick = movableTokens[Math.floor(Math.random() * movableTokens.length)];
                    moveToken(currentPlayerIndex, pick.i, diceValue);
                } else {
                    nextTurn();
                }
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [currentPlayerIndex, waitingForRoll, waitingForMove, diceValue, players, winner]);


    if (!user) {
        navigate("/");
        return null;
    }

    const handleModeSelect = (mode: Mode) => {
        setTempMode(mode);
        setSelectionStep('players');
    };

    return (
        <Layout>
            <section className="py-8" style={{ fontFamily: "'Noto Naskh Arabic', system-ui, sans-serif" }}>
                <div className="container mx-auto px-4" dir={isArabic ? "rtl" : "ltr"}>
                    <div className="game-container3 text-center">
                        {/* Header */}
                        <div className="mb-6">
                            <GamesMainHeadline title={t("common.games")} width={isArabic ? 120 : 144} />
                            <div className={`flex items-center justify-between mb-4 px-2 ${isArabic ? "text-right" : "text-left"}`}>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-2xl md:text-3xl font-bold">{t("games.ludo.name")}</h2>
                                </div>
                                <div className="flex items-center gap-4">
                                    <BackToHome text={t("common.backToHome")} />
                                </div>
                            </div>
                            <hr className="w-full border-0 border-t-2 border-dotted border-gray-300 opacity-80" />
                        </div>

                        <div className="flex flex-col lg:flex-row gap-8 mt-8 items-start justify-center">
                            {/* Game Board Area */}
                            <div className="flex-1 max-w-[600px] mx-auto bg-card border border-[#DEDEDE] rounded-[5px] shadow-lg p-4">

                                <div className="mb-4 flex justify-between items-center bg-gray-100 p-2 rounded">
                                    <div className="font-bold flex items-center gap-2">
                                        {t('games.ludo.playerTurn', { player: t(`games.ludo.${players[currentPlayerIndex]?.color}`) })}
                                        <div className={`w-4 h-4 rounded-full bg-${players[currentPlayerIndex]?.color}-500 inline-block ring-2 ring-offset-1`}></div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-xl font-bold bg-white px-4 py-2 rounded shadow min-w-[3rem] text-center">
                                            {isRolling ? <RefreshCw className="animate-spin h-6 w-6 inline" /> : (diceValue || <span className="opacity-50">🎲</span>)}
                                        </div>
                                        <Button
                                            onClick={rollDice}
                                            disabled={!waitingForRoll || players[currentPlayerIndex]?.isComputer || !!winner}
                                            className={`${players[currentPlayerIndex]?.color === 'red' ? 'bg-red-500 hover:bg-red-600' :
                                                players[currentPlayerIndex]?.color === 'green' ? 'bg-green-500 hover:bg-green-600' :
                                                    players[currentPlayerIndex]?.color === 'yellow' ? 'bg-yellow-500 hover:bg-yellow-600' :
                                                        'bg-blue-500 hover:bg-blue-600'} text-white`}
                                        >
                                            {t('games.ludo.roll')}
                                        </Button>
                                    </div>
                                </div>

                                <LudoBoard
                                    players={players}
                                    onTokenClick={handleTokenClick}
                                    currentPlayerColor={players[currentPlayerIndex]?.color}
                                    canMove={waitingForMove && !players[currentPlayerIndex]?.isComputer}
                                />

                            </div>

                            {/* Sidebar */}
                            <div className="w-full lg:w-80 space-y-4">
                                <HowToPlayInstruction title={t("common.howToPlay")} text="">
                                    <ul className="list-disc pl-5 text-sm space-y-2 text-white">
                                        <li>{t('games.ludo.rollSixToStart')}</li>
                                        <li>{players.length} {t('games.ludo.selectPlayers')}</li>
                                    </ul>
                                </HowToPlayInstruction>

                                <div className="bg-white p-4 rounded shadow border">
                                    <h3 className="font-bold mb-2">{t('games.ludo.description')}</h3>
                                    <Button variant="outline" className="w-full mb-2" onClick={() => { setSelectionStep('mode'); setShowModeDialog(true); }}>
                                        {t('games.ludo.selectMode')}
                                    </Button>
                                    <ResetButtonTopRounded onClick={() => { setSelectionStep('mode'); setShowModeDialog(true); }} className='w-full justify-center'>
                                        {t("common.newGame")}
                                    </ResetButtonTopRounded>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Selection Dialog */}
            <Dialog open={showModeDialog} onOpenChange={setShowModeDialog}>
                <DialogContent dir={isArabic ? "rtl" : "ltr"}>
                    <DialogHeader>
                        <DialogTitle>
                            {selectionStep === 'mode' ? t("games.ludo.selectMode") : t("games.ludo.selectPlayers")}
                        </DialogTitle>
                    </DialogHeader>

                    {selectionStep === 'mode' ? (
                        <div className="grid grid-cols-1 gap-4 mt-4">
                            <Button onClick={() => handleModeSelect('human-vs-computer')} className="h-16 text-lg justify-start gap-4" variant="outline">
                                <ComputerIcon /> {t("games.ludo.humanVsComputer")}
                            </Button>
                            <Button onClick={() => handleModeSelect('human-vs-human')} className="h-16 text-lg justify-start gap-4" variant="outline">
                                <HumanIcon /> {t("games.ludo.humanVsHuman")}
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-4 mt-4">
                            <Button onClick={() => initGame(tempMode, 2)} className="h-20 text-xl flex-col gap-2" variant="outline">
                                <Users className="h-6 w-6" />
                                {t("games.ludo.twoPlayers")}
                            </Button>
                            <Button onClick={() => initGame(tempMode, 3)} className="h-20 text-xl flex-col gap-2" variant="outline">
                                <Users className="h-6 w-6" />
                                3 Players
                            </Button>
                            <Button onClick={() => initGame(tempMode, 4)} className="h-20 text-xl flex-col gap-2" variant="outline">
                                <Users className="h-6 w-6" />
                                {t("games.ludo.fourPlayers")}
                            </Button>
                            <Button variant="ghost" onClick={() => setSelectionStep('mode')} className="col-span-3 text-sm text-gray-500">
                                {t("common.backToHome")}
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </Layout>
    );
};

// --- Refactored CSS Grid Board ---
const LudoBoard = ({ players, onTokenClick, currentPlayerColor, canMove }: { players: Player[], onTokenClick: (p: number, t: number) => void, currentPlayerColor: PlayerColor, canMove: boolean }) => {

    // Grid Setup: 15x15
    // Bases are 6x6 blocks.
    // Center is 3x3.
    // Arms are 3x6.

    // Helper: Map token state to coordinates
    const getTokenCoord = (playerColor: PlayerColor, token: Token) => {
        if (token.status === 'base') {
            const baseMap = {
                red: [{ r: 1, c: 1 }, { r: 1, c: 4 }, { r: 4, c: 1 }, { r: 4, c: 4 }], // Relative to base top-left (0,0) -> mapped in render
                green: [{ r: 1, c: 1 }, { r: 1, c: 4 }, { r: 4, c: 1 }, { r: 4, c: 4 }],
                yellow: [{ r: 1, c: 1 }, { r: 1, c: 4 }, { r: 4, c: 1 }, { r: 4, c: 4 }],
                blue: [{ r: 1, c: 1 }, { r: 1, c: 4 }, { r: 4, c: 1 }, { r: 4, c: 4 }]
            };
            const rel = baseMap[playerColor][token.id];

            // Adjust to global based on color
            if (playerColor === 'red') return { r: rel.r, c: rel.c };
            if (playerColor === 'green') return { r: rel.r, c: rel.c + 9 };
            if (playerColor === 'yellow') return { r: rel.r + 9, c: rel.c + 9 };
            if (playerColor === 'blue') return { r: rel.r + 9, c: rel.c };
            return { r: 0, c: 0 };
        }

        if (token.status === 'home') {
            // Stack at center
            return { r: 7, c: 7 }; // Center of board logic handled better?
        }

        // Active logic same as before...
        const START_OFFSETS: Record<PlayerColor, number> = { red: 0, green: 13, yellow: 26, blue: 39 };

        // Path handling copy-paste from before, or shared function
        // Re-defining internal helper inside render for simplicity or move out
        // ... For brevity, including the mapping logic here:

        const MAIN_PATH_COORDS = [
            { r: 6, c: 1 }, { r: 6, c: 2 }, { r: 6, c: 3 }, { r: 6, c: 4 }, { r: 6, c: 5 },
            { r: 5, c: 6 }, { r: 4, c: 6 }, { r: 3, c: 6 }, { r: 2, c: 6 }, { r: 1, c: 6 }, { r: 0, c: 6 },
            { r: 0, c: 7 }, { r: 0, c: 8 },
            { r: 1, c: 8 }, { r: 2, c: 8 }, { r: 3, c: 8 }, { r: 4, c: 8 }, { r: 5, c: 8 },
            { r: 6, c: 9 }, { r: 6, c: 10 }, { r: 6, c: 11 }, { r: 6, c: 12 }, { r: 6, c: 13 }, { r: 6, c: 14 },
            { r: 7, c: 14 }, { r: 8, c: 14 },
            { r: 8, c: 13 }, { r: 8, c: 12 }, { r: 8, c: 11 }, { r: 8, c: 10 }, { r: 8, c: 9 },
            { r: 9, c: 8 }, { r: 10, c: 8 }, { r: 11, c: 8 }, { r: 12, c: 8 }, { r: 13, c: 8 }, { r: 14, c: 8 },
            { r: 14, c: 7 }, { r: 14, c: 6 },
            { r: 13, c: 6 }, { r: 12, c: 6 }, { r: 11, c: 6 }, { r: 10, c: 6 }, { r: 9, c: 6 },
            { r: 8, c: 5 }, { r: 8, c: 4 }, { r: 8, c: 3 }, { r: 8, c: 2 }, { r: 8, c: 1 }, { r: 8, c: 0 },
            { r: 7, c: 0 }
        ];

        const HOME_PATHS = {
            red: [{ r: 7, c: 1 }, { r: 7, c: 2 }, { r: 7, c: 3 }, { r: 7, c: 4 }, { r: 7, c: 5 }, { r: 7, c: 6 }],
            green: [{ r: 1, c: 7 }, { r: 2, c: 7 }, { r: 3, c: 7 }, { r: 4, c: 7 }, { r: 5, c: 7 }, { r: 6, c: 7 }],
            yellow: [{ r: 7, c: 13 }, { r: 7, c: 12 }, { r: 7, c: 11 }, { r: 7, c: 10 }, { r: 7, c: 9 }, { r: 7, c: 8 }],
            blue: [{ r: 13, c: 7 }, { r: 12, c: 7 }, { r: 11, c: 7 }, { r: 10, c: 7 }, { r: 9, c: 7 }, { r: 8, c: 7 }]
        };

        if (token.position < 51) {
            const offset = START_OFFSETS[playerColor];
            const globalIndex = (token.position + offset) % 52;
            return MAIN_PATH_COORDS[globalIndex];
        } else {
            const stretchIndex = token.position - 51;
            // Handle home stack nicely by using stretchIndex or center
            if (stretchIndex < 6) return HOME_PATHS[playerColor][stretchIndex];
            return { r: 7, c: 7 };
        }
    };

    return (
        <div className="relative w-full aspect-square bg-white border-2 border-black max-h-[600px] select-none shadow-xl"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(15, 1fr)', gridTemplateRows: 'repeat(15, 1fr)' }}>

            {/* Bases - Spanned Elements */}
            <div className="bg-red-100 border-4 border-red-500 m-1 rounded-2xl relative" style={{ gridColumn: '1 / span 6', gridRow: '1 / span 6' }}>
                <div className="absolute inset-4 bg-white rounded-xl flex items-center justify-center border-2 border-red-200">
                    <div className="grid grid-cols-2 gap-4 p-4">
                        {[1, 2, 3, 4].map(n => <div key={n} className="w-6 h-6 rounded-full bg-red-100 border border-red-300"></div>)}
                    </div>
                </div>
            </div>
            <div className="bg-green-100 border-4 border-green-500 m-1 rounded-2xl relative" style={{ gridColumn: '10 / span 6', gridRow: '1 / span 6' }}>
                <div className="absolute inset-4 bg-white rounded-xl flex items-center justify-center border-2 border-green-200">
                    <div className="grid grid-cols-2 gap-4 p-4">
                        {[1, 2, 3, 4].map(n => <div key={n} className="w-6 h-6 rounded-full bg-green-100 border border-green-300"></div>)}
                    </div>
                </div>
            </div>
            <div className="bg-blue-100 border-4 border-blue-500 m-1 rounded-2xl relative" style={{ gridColumn: '1 / span 6', gridRow: '10 / span 6' }}>
                <div className="absolute inset-4 bg-white rounded-xl flex items-center justify-center border-2 border-blue-200">
                    <div className="grid grid-cols-2 gap-4 p-4">
                        {[1, 2, 3, 4].map(n => <div key={n} className="w-6 h-6 rounded-full bg-blue-100 border border-blue-300"></div>)}
                    </div>
                </div>
            </div>
            <div className="bg-yellow-100 border-4 border-yellow-500 m-1 rounded-2xl relative" style={{ gridColumn: '10 / span 6', gridRow: '10 / span 6' }}>
                <div className="absolute inset-4 bg-white rounded-xl flex items-center justify-center border-2 border-yellow-200">
                    <div className="grid grid-cols-2 gap-4 p-4">
                        {[1, 2, 3, 4].map(n => <div key={n} className="w-6 h-6 rounded-full bg-yellow-100 border border-yellow-300"></div>)}
                    </div>
                </div>
            </div>

            {/* Path Cells */}
            {/* We iterate but only render if NOT in base area */}
            {Array.from({ length: 15 * 15 }).map((_, i) => {
                const r = Math.floor(i / 15);
                const c = i % 15;

                // Skip base areas
                if (r < 6 && c < 6) return null;
                if (r < 6 && c > 8) return null;
                if (r > 8 && c < 6) return null;
                if (r > 8 && c > 8) return null;
                // Skip Center
                if (r >= 6 && r <= 8 && c >= 6 && c <= 8) return null;

                // Render Path Cell
                const isStar = (r === 6 && c === 1) || (r === 2 && c === 6) || (r === 1 && c === 8) || (r === 6 && c === 12) ||
                    (r === 8 && c === 13) || (r === 12 && c === 8) || (r === 13 && c === 6) || (r === 8 && c === 2);

                const isRedStart = r === 6 && c === 1;
                const isGreenStart = r === 1 && c === 8;
                const isYellowStart = r === 8 && c === 13;
                const isBlueStart = r === 13 && c === 6;

                let bgClass = "bg-white";
                if (r === 7 && c >= 1 && c <= 5) bgClass = "bg-red-200";
                if (c === 7 && r >= 1 && r <= 5) bgClass = "bg-green-200";
                if (r === 7 && c >= 9 && c <= 13) bgClass = "bg-yellow-200";
                if (c === 7 && r >= 9 && r <= 13) bgClass = "bg-blue-200";
                // Start spots
                if (isRedStart) bgClass = "bg-red-500 text-white";
                if (isGreenStart) bgClass = "bg-green-500 text-white";
                if (isYellowStart) bgClass = "bg-yellow-500 text-white";
                if (isBlueStart) bgClass = "bg-blue-500 text-white";

                return (
                    <div key={i} className={`border border-gray-300 flex items-center justify-center relative ${bgClass} text-[10px]`}>
                        {isStar && !isRedStart && !isGreenStart && !isYellowStart && !isBlueStart && <span className="text-gray-400 opacity-50">★</span>}
                        {isRedStart && "→"}
                        {isGreenStart && "↓"}
                        {isYellowStart && "←"}
                        {isBlueStart && "↑"}
                    </div>
                );
            })}

            {/* Center Area (with triangle overlay) */}
            <div className="relative bg-white" style={{ gridColumn: '7 / span 3', gridRow: '7 / span 3' }}>
                <div className="absolute inset-0 bg-red-500" style={{ clipPath: 'polygon(0 0, 0 100%, 50% 50%)' }}></div>
                <div className="absolute inset-0 bg-green-500" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 50%)' }}></div>
                <div className="absolute inset-0 bg-yellow-500" style={{ clipPath: 'polygon(100% 0, 100% 100%, 50% 50%)' }}></div>
                <div className="absolute inset-0 bg-blue-500" style={{ clipPath: 'polygon(0 100%, 100% 100%, 50% 50%)' }}></div>
            </div>

            {/* Tokens Layer */}
            {players.map((player, pIdx) => (
                player.tokens.map((token, tIdx) => {
                    const coord = getTokenCoord(player.color, token);
                    if (!coord) return null;

                    const isCurrent = currentPlayerColor === player.color;
                    const isClickable = isCurrent && canMove;

                    // Add some noise to multiple tokens on same spot?
                    // Simple offset if in base is already handled by fixed positions.

                    return (
                        <div
                            key={`${player.color}-${token.id}`}
                            onClick={() => onTokenClick(pIdx, tIdx)}
                            className={`absolute transform transition-all duration-300 flex items-center justify-center
                                ${isClickable ? 'cursor-pointer hover:scale-125 z-50 ring-2 ring-white' : 'z-20'}
                                shadow-md rounded-full border border-black/20
                            `}
                            style={{
                                width: '4.5%',
                                height: '4.5%',
                                left: `${coord.c * (100 / 15) + (100 / 15 / 2) - 2.25}%`,
                                top: `${coord.r * (100 / 15) + (100 / 15 / 2) - 2.25}%`,
                                backgroundColor: player.color === 'yellow' ? '#FBBF24' : player.color === 'red' ? '#EF4444' : player.color === 'green' ? '#10B981' : '#3B82F6'
                            }}
                        >
                            <div className="w-2/3 h-2/3 rounded-full bg-gradient-to-br from-white/40 to-black/10"></div>
                        </div>
                    );
                })
            ))}

        </div>
    );
};

export default Ludo;
