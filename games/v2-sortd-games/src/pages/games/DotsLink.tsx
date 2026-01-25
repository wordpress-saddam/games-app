import React, { useState, useEffect, useRef } from "react";
import Layout from "../../components/Layout";
import { useToast } from "../../hooks/use-toast";
import { useUser } from "../../context/UserContext";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { RotateCcw, HelpCircle, ArrowRight, Settings } from "lucide-react";
import GamesMainHeadline from "../../components/ui/GamesMainHeadline";
import MostReadSidebar from "@/components/MostReadSidebar";
import BackToHome from "../../components/ui/BackToHome";
import HowToPlayInstruction from "../../components/ui/HowToPlayInstruction";
import { BlueButton, LightButton, NextButtonTopRounded } from "../../components/ui/GamesButton";
import LinkGameImage from "../../assets/dots-link.png";

// --- Types ---

type Color = string; // Hex color map key or actual color
type Point = { r: number; c: number };

type PuzzleConfig = {
    id: number;
    rows: number;
    cols: number;
    pairs: { color: Color; start: Point; end: Point }[];
};

type LevelStage = {
    id: number;
    puzzles: PuzzleConfig[];
};

// --- Levels Data ---
const STAGES: LevelStage[] = [
    {
        id: 1,
        puzzles: [
            {
                id: 1, rows: 5, cols: 5, pairs: [
                    { color: "#FF0000", start: { r: 0, c: 0 }, end: { r: 4, c: 0 } },
                    { color: "#00FF00", start: { r: 0, c: 1 }, end: { r: 4, c: 1 } },
                    { color: "#0000FF", start: { r: 0, c: 2 }, end: { r: 2, c: 2 } },
                    { color: "#FFFF00", start: { r: 0, c: 3 }, end: { r: 3, c: 3 } },
                    { color: "#FFA500", start: { r: 0, c: 4 }, end: { r: 4, c: 4 } },
                ]
            },
            {
                id: 2, rows: 5, cols: 5, pairs: [
                    { color: "#FF0000", start: { r: 0, c: 0 }, end: { r: 4, c: 4 } },
                    { color: "#00FF00", start: { r: 0, c: 4 }, end: { r: 4, c: 0 } },
                    { color: "#0000FF", start: { r: 0, c: 2 }, end: { r: 4, c: 2 } },
                    { color: "#FFFF00", start: { r: 2, c: 0 }, end: { r: 2, c: 4 } },
                ]
            },
            {
                id: 3, rows: 5, cols: 5, pairs: [
                    { color: "#FF0000", start: { r: 0, c: 0 }, end: { r: 0, c: 4 } },
                    { color: "#00FF00", start: { r: 1, c: 0 }, end: { r: 1, c: 4 } },
                    { color: "#0000FF", start: { r: 2, c: 0 }, end: { r: 2, c: 4 } },
                    { color: "#FFFF00", start: { r: 3, c: 0 }, end: { r: 3, c: 4 } },
                    { color: "#FFA500", start: { r: 4, c: 0 }, end: { r: 4, c: 4 } },
                ]
            }
        ]
    },
    {
        id: 2,
        puzzles: [
            {
                id: 1, rows: 6, cols: 6, pairs: [
                    { color: "#FF0000", start: { r: 0, c: 0 }, end: { r: 0, c: 5 } },
                    { color: "#00FF00", start: { r: 5, c: 0 }, end: { r: 5, c: 5 } },
                    { color: "#0000FF", start: { r: 1, c: 0 }, end: { r: 4, c: 0 } },
                    { color: "#FFFF00", start: { r: 1, c: 5 }, end: { r: 4, c: 5 } },
                    { color: "#FFA500", start: { r: 2, c: 2 }, end: { r: 3, c: 3 } },
                ]
            },
            {
                id: 2, rows: 6, cols: 6, pairs: [
                    { color: "#FF0000", start: { r: 0, c: 0 }, end: { r: 5, c: 5 } },
                    { color: "#00FF00", start: { r: 0, c: 5 }, end: { r: 5, c: 0 } },
                    { color: "#0000FF", start: { r: 0, c: 2 }, end: { r: 5, c: 2 } },
                    { color: "#FFFF00", start: { r: 0, c: 3 }, end: { r: 5, c: 3 } },
                    { color: "#FFA500", start: { r: 2, c: 0 }, end: { r: 2, c: 5 } },
                ]
            },
            {
                id: 3, rows: 7, cols: 7, pairs: [
                    { color: "#FF0000", start: { r: 0, c: 0 }, end: { r: 6, c: 0 } },
                    { color: "#00FF00", start: { r: 0, c: 6 }, end: { r: 6, c: 6 } },
                    { color: "#0000FF", start: { r: 0, c: 1 }, end: { r: 6, c: 1 } },
                    { color: "#FFFF00", start: { r: 0, c: 5 }, end: { r: 6, c: 5 } },
                    { color: "#FFA500", start: { r: 3, c: 2 }, end: { r: 3, c: 4 } },
                    { color: "#800080", start: { r: 1, c: 3 }, end: { r: 5, c: 3 } },
                ]
            }
        ]
    },
    {
        id: 3,
        puzzles: [
            {
                id: 1, rows: 8, cols: 8, pairs: [
                    { color: "#FF0000", start: { r: 0, c: 0 }, end: { r: 0, c: 7 } },
                    { color: "#00FF00", start: { r: 7, c: 0 }, end: { r: 7, c: 7 } },
                    { color: "#0000FF", start: { r: 1, c: 0 }, end: { r: 6, c: 0 } },
                    { color: "#FFFF00", start: { r: 1, c: 7 }, end: { r: 6, c: 7 } },
                    { color: "#FFA500", start: { r: 2, c: 2 }, end: { r: 2, c: 5 } },
                    { color: "#800080", start: { r: 5, c: 2 }, end: { r: 5, c: 5 } },
                ]
            },
            {
                id: 2, rows: 8, cols: 8, pairs: [
                    { color: "#FF0000", start: { r: 0, c: 0 }, end: { r: 7, c: 7 } },
                    { color: "#00FF00", start: { r: 0, c: 7 }, end: { r: 7, c: 0 } },
                    { color: "#0000FF", start: { r: 3, c: 0 }, end: { r: 3, c: 7 } },
                    { color: "#FFFF00", start: { r: 0, c: 3 }, end: { r: 7, c: 3 } },
                    { color: "#FFA500", start: { r: 4, c: 0 }, end: { r: 4, c: 7 } },
                    { color: "#800080", start: { r: 0, c: 4 }, end: { r: 7, c: 4 } },
                ]
            },
            {
                id: 3, rows: 9, cols: 9, pairs: [
                    { color: "#FF0000", start: { r: 0, c: 0 }, end: { r: 8, c: 0 } },
                    { color: "#00FF00", start: { r: 0, c: 8 }, end: { r: 8, c: 8 } },
                    { color: "#0000FF", start: { r: 0, c: 1 }, end: { r: 8, c: 1 } },
                    { color: "#FFFF00", start: { r: 0, c: 7 }, end: { r: 8, c: 7 } },
                    { color: "#FFA500", start: { r: 4, c: 2 }, end: { r: 4, c: 6 } },
                    { color: "#800080", start: { r: 2, c: 3 }, end: { r: 2, c: 5 } },
                ]
            }
        ]
    }
];

const COLORS: Record<string, string> = {
    "#FF0000": "bg-red-500",
    "#00FF00": "bg-green-500",
    "#0000FF": "bg-blue-500",
    "#FFFF00": "bg-yellow-400",
    "#FFA500": "bg-orange-500",
    "#800080": "bg-purple-500",
};

const LinkGame = () => {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === 'ar';
    const { user } = useUser();
    const navigate = useNavigate();
    const { toast } = useToast();

    // Game State
    const [currentStageIndex, setCurrentStageIndex] = useState(0);
    const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);

    // Board State
    const [grid, setGrid] = useState<Color[][]>([]);
    const [paths, setPaths] = useState<Record<Color, Point[]>>({});
    const [isDragging, setIsDragging] = useState(false);
    const [currentColor, setCurrentColor] = useState<Color | null>(null);
    const [showInstructions, setShowInstructions] = useState(false);
    const [showLevelSelect, setShowLevelSelect] = useState(false);
    const [levelComplete, setLevelComplete] = useState(false);

    const gridRef = useRef<HTMLDivElement>(null);
    const [cellSize, setCellSize] = useState(0);

    // Derived
    const currentStage = STAGES[currentStageIndex];
    const currentPuzzle = currentStage.puzzles[currentPuzzleIndex];

    useEffect(() => {
        initLevel();
    }, [currentStageIndex, currentPuzzleIndex]);

    useEffect(() => {
        const updateCellSize = () => {
            if (gridRef.current) {
                const width = gridRef.current.offsetWidth;
                setCellSize(width / currentPuzzle.cols);
            }
        };
        updateCellSize();
        window.addEventListener("resize", updateCellSize);
        return () => window.removeEventListener("resize", updateCellSize);
    }, [currentPuzzle]);

    const initLevel = () => {
        const newGrid: Color[][] = Array(currentPuzzle.rows).fill(null).map(() => Array(currentPuzzle.cols).fill(null));

        currentPuzzle.pairs.forEach(pair => {
            newGrid[pair.start.r][pair.start.c] = pair.color;
            newGrid[pair.end.r][pair.end.c] = pair.color;
        });

        setGrid(newGrid);
        setPaths({});
        setIsDragging(false);
        setCurrentColor(null);
        setLevelComplete(false);
    };

    const isSamePoint = (p1: Point, p2: Point) => p1.r === p2.r && p1.c === p2.c;

    const getPointColor = (r: number, c: number): Color | null => {
        const pair = currentPuzzle.pairs.find(p => isSamePoint(p.start, { r, c }) || isSamePoint(p.end, { r, c }));
        if (pair) return pair.color;
        for (const [color, path] of Object.entries(paths)) {
            if (path.some(p => isSamePoint(p, { r, c }))) return color;
        }
        return null;
    };

    const isEndpoint = (r: number, c: number, color?: Color) => {
        return currentPuzzle.pairs.some(p => {
            const matchesPoint = isSamePoint(p.start, { r, c }) || isSamePoint(p.end, { r, c });
            if (color) return matchesPoint && p.color === color;
            return matchesPoint;
        });
    };

    const handleDown = (r: number, c: number) => {
        if (levelComplete) return;
        const color = getPointColor(r, c);
        if (color) {
            setIsDragging(true);
            setCurrentColor(color);
            if (isEndpoint(r, c, color)) {
                setPaths(prev => ({ ...prev, [color]: [{ r, c }] }));
            } else {
                const currentPath = paths[color] || [];
                const index = currentPath.findIndex(p => isSamePoint(p, { r, c }));
                if (index !== -1) {
                    setPaths(prev => ({ ...prev, [color]: currentPath.slice(0, index + 1) }));
                }
            }
        }
    };

    const handleEnter = (r: number, c: number) => {
        if (!isDragging || !currentColor || levelComplete) return;

        const currentPath = paths[currentColor] || [];
        const lastPoint = currentPath[currentPath.length - 1];

        const isAdjacent = Math.abs(r - lastPoint.r) + Math.abs(c - lastPoint.c) === 1;
        if (!isAdjacent) return;

        if (currentPath.length > 1) {
            const prevPoint = currentPath[currentPath.length - 2];
            if (isSamePoint(prevPoint, { r, c })) {
                setPaths(prev => ({ ...prev, [currentColor]: currentPath.slice(0, -1) }));
                return;
            }
        }

        if (currentPath.some(p => isSamePoint(p, { r, c }))) return;

        const existingColorAtPoint = getPointColor(r, c);
        if (existingColorAtPoint && existingColorAtPoint !== currentColor) return;

        const newPath = [...currentPath, { r, c }];
        setPaths(prev => ({ ...prev, [currentColor]: newPath }));

        if (isEndpoint(r, c, currentColor)) {
            setIsDragging(false);
            setCurrentColor(null);
            checkLevelCompletion({ ...paths, [currentColor]: newPath });
        }
    };

    const handleUp = () => {
        setIsDragging(false);
        setCurrentColor(null);
    };

    const checkLevelCompletion = (currentPaths: Record<Color, Point[]>) => {
        const allConnected = currentPuzzle.pairs.every(pair => {
            const path = currentPaths[pair.color];
            if (!path || path.length < 2) return false;
            const start = path[0];
            const end = path[path.length - 1];

            const match1 = isSamePoint(start, pair.start) && isSamePoint(end, pair.end);
            const match2 = isSamePoint(start, pair.end) && isSamePoint(end, pair.start);
            return match1 || match2;
        });

        if (allConnected) {
            setLevelComplete(true);
            toast({
                title: t("games.dotsLink.goodJob"),
                description: t("games.dotsLink.levelCompleted"),
                className: "bg-green-600 text-white font-semibold border-none shadow-xl",
            });
        }
    };

    const nextLevel = () => {
        // Increment Puzzle
        if (currentPuzzleIndex < currentStage.puzzles.length - 1) {
            setCurrentPuzzleIndex(prev => prev + 1);
        } else {
            // Increment Stage
            if (currentStageIndex < STAGES.length - 1) {
                setCurrentStageIndex(prev => prev + 1);
                setCurrentPuzzleIndex(0);
                toast({
                    title: "Stage Completed!",
                    description: "Moving to next stage.",
                    className: "bg-blue-600 text-white font-semibold border-none shadow-xl",
                });
            } else {
                toast({
                    title: "Congratulations!",
                    description: "You finished all available levels.",
                    className: "bg-purple-600 text-white font-semibold border-none shadow-xl",
                });
                // Loop back
                setCurrentStageIndex(0);
                setCurrentPuzzleIndex(0);
            }
        }
    };

    const resetGame = () => {
        setPaths({});
        setIsDragging(false);
        setCurrentColor(null);
        setLevelComplete(false);
    };

    const selectLevel = (stageIdx: number) => {
        setCurrentStageIndex(stageIdx);
        setCurrentPuzzleIndex(0);
        setShowLevelSelect(false);
    };

    if (!user) {
        // navigate("/");
    }

    return (
        <Layout>
            <section className="py-8 font-sans" onMouseUp={handleUp} onMouseLeave={handleUp} onTouchEnd={handleUp}>
                <div className="container mx-auto px-4" dir={isArabic ? "rtl" : "ltr"}>
                    <div className="game-container3">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                            <div className="lg:col-span-2">
                                <div className="mb-6">
                                    <GamesMainHeadline title={t("common.games")} width={isArabic ? 120 : 144} />
                                    <div className={`flex items-center justify-between mb-4 px-2 ${isArabic ? "text-right" : "text-left"}`}>
                                        <div className="flex items-center gap-2">
                                            <img src={LinkGameImage} alt="TicTacToe Logo" className="w-20 h-20" />
                                            <h2 className="text-2xl md:text-3xl font-bold">Dots Link</h2>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <BackToHome text={t("common.backToHome")} />
                                        </div>
                                    </div>
                                </div>

                                <hr className="w-full border-0 border-t-2 border-dotted border-gray-300 opacity-80" />

                                <div className="bg-card border border-[#DEDEDE] rounded-[5px] shadow-lg overflow-hidden mt-8" translate="no">
                                    <div className="bg-[#F0F0F0] p-4 flex flex-wrap items-center justify-between gap-1 border-b border-[#DEDEDE] flex-row-reverse">
                                        <div className="flex gap-2">
                                            <BlueButton onClick={resetGame}>
                                                {t("common.reset")}
                                                <RotateCcw className="h-4 w-4" />
                                            </BlueButton>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <LightButton onClick={() => setShowLevelSelect(true)}>
                                                {t("common.level")} {currentStage.id}
                                                <Settings className="h-4 w-4" />
                                            </LightButton>
                                            <LightButton onClick={() => setShowInstructions(true)}>
                                                {t("common.help")}
                                                <HelpCircle className="h-4 w-4" />
                                            </LightButton>
                                        </div>
                                    </div>

                                    <div
                                        className="relative mx-auto touch-none select-none bg-gray-900 rounded-lg p-2 mt-4"
                                        style={{
                                            width: '100%',
                                            maxWidth: '500px',
                                            aspectRatio: `${currentPuzzle.cols}/${currentPuzzle.rows}`
                                        }}
                                        ref={gridRef}
                                    >
                                        <div
                                            className="grid w-full h-full"
                                            style={{
                                                gridTemplateColumns: `repeat(${currentPuzzle.cols}, 1fr)`,
                                                gridTemplateRows: `repeat(${currentPuzzle.rows}, 1fr)`
                                            }}
                                        >
                                            {Array.from({ length: currentPuzzle.rows * currentPuzzle.cols }).map((_, idx) => {
                                                const r = Math.floor(idx / currentPuzzle.cols);
                                                const c = idx % currentPuzzle.cols;
                                                const endpointPair = currentPuzzle.pairs.find(p => isSamePoint(p.start, { r, c }) || isSamePoint(p.end, { r, c }));
                                                const color = endpointPair?.color;
                                                const dotClass = color ? COLORS[color] : "";

                                                return (
                                                    <div
                                                        key={`${r}-${c}`}
                                                        className="w-full h-full border border-gray-800 flex items-center justify-center relative z-10"
                                                        onMouseDown={() => handleDown(r, c)}
                                                        onMouseEnter={() => handleEnter(r, c)}
                                                        onTouchStart={(e) => handleDown(r, c)}
                                                    >
                                                        {color && (
                                                            <div className={`w-3/5 h-3/5 rounded-full ${dotClass} shadow-md transition-transform duration-200 ${isDragging && currentColor === color ? 'scale-110' : ''}`} />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 p-2">
                                            <g>
                                                {Object.entries(paths).map(([color, path]) => {
                                                    if (path.length < 2) return null;
                                                    if (!cellSize) return null;

                                                    const pointsStr = path.map(p => {
                                                        const x = p.c * cellSize + cellSize / 2;
                                                        const y = p.r * cellSize + cellSize / 2;
                                                        return `${x},${y}`;
                                                    }).join(" ");

                                                    return (
                                                        <polyline
                                                            key={color}
                                                            points={pointsStr}
                                                            fill="none"
                                                            stroke={color}
                                                            strokeWidth={cellSize * 0.3}
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            className="opacity-80"
                                                        />
                                                    );
                                                })}
                                            </g>
                                        </svg>
                                    </div>

                                    {levelComplete && (
                                        <div className="mt-6 flex justify-center">
                                            <NextButtonTopRounded onClick={nextLevel}>
                                                {t("common.next")}
                                                <ArrowRight className="h-4 w-4" />
                                            </NextButtonTopRounded>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="lg:col-span-1">
                                <HowToPlayInstruction title={t("common.howToPlay")} text="">
                                    <ul className="list-disc pl-5 space-y-2 text-white/90">
                                        <li>Connect matching colors with a pipe.</li>
                                        <li>Pair all colors, and cover the entire board to solve each puzzle.</li>
                                        <li>But watch out, pipes will break if they cross or overlap!</li>
                                    </ul>
                                </HowToPlayInstruction>
                                <MostReadSidebar />
                            </div>
                        </div>
                    </div>
                </div>

                <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>How to Play</DialogTitle>
                            <DialogDescription>
                                Connect dots of the same color. Do not cross lines.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button onClick={() => setShowInstructions(false)}>Got it</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={showLevelSelect} onOpenChange={setShowLevelSelect}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Select Level</DialogTitle>
                            <DialogDescription>
                                Choose a stage to play.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-3 gap-4 py-4">
                            {STAGES.map((s) => (
                                <Button
                                    key={s.id}
                                    className={`h-20 text-xl font-bold ${currentStageIndex === s.id - 1 ? 'bg-blue-600' : 'bg-gray-500 hover:bg-gray-600'}`}
                                    onClick={() => selectLevel(s.id - 1)}
                                >
                                    {s.id}
                                </Button>
                            ))}
                        </div>
                        <DialogFooter>
                            <Button onClick={() => setShowLevelSelect(false)}>Close</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </section>
        </Layout>
    );
};

export default LinkGame;
