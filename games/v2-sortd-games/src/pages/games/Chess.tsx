import React, { useState, useEffect } from 'react';
import Layout from "../../components/Layout";
import { useTranslation } from "react-i18next";
import { useUser } from "../../context/UserContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../hooks/use-toast";
import BackToHome from "../../components/ui/BackToHome";
import GamesMainHeadline from "../../components/ui/GamesMainHeadline";
import HowToPlayInstruction from "../../components/ui/HowToPlayInstruction";
import { ResetButton, ResetButtonTopRounded } from "../../components/ui/GamesButton";
import HumanIcon from "../../components/ui/HumanIcon";
import ComputerIcon from "../../components/ui/ComputerIcon";
import { Button } from "@/components/ui/button";
import ChessImage from "../../assets/chess.png";

// --- Chess Types & Engine ---

type PieceColor = 'w' | 'b';
type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

interface Piece {
    type: PieceType;
    color: PieceColor;
    hasMoved?: boolean;
}

interface Square {
    r: number;
    c: number;
}

interface Move {
    from: Square;
    to: Square;
    piece: Piece;
    captured?: Piece;
    captureSquare?: Square; // For En Passant (the captured piece is not at 'to')
    promotion?: PieceType;
    isCastle?: 'k' | 'q';
    isEnPassant?: boolean;
}

type BoardState = (Piece | null)[][];

const INITIAL_BOARD: BoardState = [
    [{ type: 'r', color: 'b' }, { type: 'n', color: 'b' }, { type: 'b', color: 'b' }, { type: 'q', color: 'b' }, { type: 'k', color: 'b' }, { type: 'b', color: 'b' }, { type: 'n', color: 'b' }, { type: 'r', color: 'b' }],
    [{ type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }],
    Array(8).fill(null),
    Array(8).fill(null),
    Array(8).fill(null),
    Array(8).fill(null),
    [{ type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }],
    [{ type: 'r', color: 'w' }, { type: 'n', color: 'w' }, { type: 'b', color: 'w' }, { type: 'q', color: 'w' }, { type: 'k', color: 'w' }, { type: 'b', color: 'w' }, { type: 'n', color: 'w' }, { type: 'r', color: 'w' }],
];

const PIECE_SYMBOLS: Record<string, string> = {
    'w-k': '♔', 'w-q': '♕', 'w-r': '♖', 'w-b': '♗', 'w-n': '♘', 'w-p': '♙',
    'b-k': '♚', 'b-q': '♛', 'b-r': '♜', 'b-b': '♝', 'b-n': '♞', 'b-p': '♟',
};

// Utils
const isOpponent = (p1: Piece | null, color: PieceColor) => p1 !== null && p1.color !== color;
const isOnBoard = (r: number, c: number) => r >= 0 && r < 8 && c >= 0 && c < 8;
const cloneBoard = (board: BoardState): BoardState => board.map(row => row.map(p => p ? { ...p } : null));

// --- State Interfaces ---
interface GameState {
    board: BoardState;
    turn: PieceColor;
    lastMove: Move | null; // Necessary for En Passant
    capturedWhite: PieceType[]; // Pieces captured BY White (Black pieces)
    capturedBlack: PieceType[]; // Pieces captured BY Black (White pieces)
}

// --- Logic ---

const isSquareAttacked = (board: BoardState, square: Square, attackerColor: PieceColor): boolean => {
    // Check Pawn attacks
    const pDir = attackerColor === 'w' ? -1 : 1;
    // Attackers come from (r - pDir, c +/- 1)
    if (isOnBoard(square.r - pDir, square.c - 1)) {
        const p = board[square.r - pDir][square.c - 1];
        if (p && p.color === attackerColor && p.type === 'p') return true;
    }
    if (isOnBoard(square.r - pDir, square.c + 1)) {
        const p = board[square.r - pDir][square.c + 1];
        if (p && p.color === attackerColor && p.type === 'p') return true;
    }

    // Knight attacks
    const nDirs = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
    for (const [dr, dc] of nDirs) {
        const tr = square.r + dr, tc = square.c + dc;
        if (isOnBoard(tr, tc)) {
            const p = board[tr][tc];
            if (p && p.color === attackerColor && p.type === 'n') return true;
        }
    }

    // Sliding attacks (Queen, Rook, Bishop)
    const dirs = [
        { dr: -1, dc: 0, types: ['r', 'q'] }, { dr: 1, dc: 0, types: ['r', 'q'] },
        { dr: 0, dc: -1, types: ['r', 'q'] }, { dr: 0, dc: 1, types: ['r', 'q'] },
        { dr: -1, dc: -1, types: ['b', 'q'] }, { dr: -1, dc: 1, types: ['b', 'q'] },
        { dr: 1, dc: -1, types: ['b', 'q'] }, { dr: 1, dc: 1, types: ['b', 'q'] }
    ];
    for (const d of dirs) {
        let tr = square.r + d.dr;
        let tc = square.c + d.dc;
        while (isOnBoard(tr, tc)) {
            const p = board[tr][tc];
            if (p) {
                if (p.color === attackerColor && d.types.includes(p.type)) return true;
                break;
            }
            tr += d.dr;
            tc += d.dc;
        }
    }

    // King attacks
    const kDirs = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
    for (const [dr, dc] of kDirs) {
        const tr = square.r + dr, tc = square.c + dc;
        if (isOnBoard(tr, tc)) {
            const p = board[tr][tc];
            if (p && p.color === attackerColor && p.type === 'k') return true;
        }
    }

    return false;
};

const getPieceMoves = (
    board: BoardState,
    r: number,
    c: number,
    lastMove: Move | null,
    includeCastling: boolean = true
): Move[] => {
    const piece = board[r][c];
    if (!piece) return [];

    const moves: Move[] = [];
    const directions = {
        'n': [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]],
        'b': [[-1, -1], [-1, 1], [1, -1], [1, 1]],
        'r': [[-1, 0], [1, 0], [0, -1], [0, 1]],
        'q': [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]],
        'k': [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]]
    };

    const addMove = (tr: number, tc: number, special?: Partial<Move>) => {
        const target = board[tr][tc];
        if (target && target.color === piece.color) return;

        const move: Move = {
            from: { r, c },
            to: { r: tr, c: tc },
            piece,
            captured: target || undefined,
            captureSquare: { r: tr, c: tc }, // Default capture square is destination
            ...special
        };
        moves.push(move);
    };

    // Pawn
    if (piece.type === 'p') {
        const dir = piece.color === 'w' ? -1 : 1;
        const startRow = piece.color === 'w' ? 6 : 1;

        // Forward 1
        if (isOnBoard(r + dir, c) && !board[r + dir][c]) {
            if (r + dir === 0 || r + dir === 7) {
                ['q', 'r', 'b', 'n'].forEach(pt => {
                    moves.push({ from: { r, c }, to: { r: r + dir, c }, piece, promotion: pt as PieceType });
                });
            } else {
                addMove(r + dir, c);
            }

            // Forward 2
            if (r === startRow && isOnBoard(r + dir * 2, c) && !board[r + dir * 2][c]) {
                addMove(r + dir * 2, c);
            }
        }

        // Capture
        [[dir, -1], [dir, 1]].forEach(([dr, dc]) => {
            if (isOnBoard(r + dr, c + dc)) {
                // Normal Capture
                if (isOpponent(board[r + dr][c + dc], piece.color)) {
                    if (r + dr === 0 || r + dr === 7) {
                        ['q', 'r', 'b', 'n'].forEach(pt => {
                            moves.push({ from: { r, c }, to: { r: r + dr, c: c + dc }, piece, captured: board[r + dr][c + dc]!, promotion: pt as PieceType });
                        });
                    } else {
                        addMove(r + dr, c + dc);
                    }
                }
                // En Passant
                else if (lastMove && lastMove.piece.type === 'p' && lastMove.piece.color !== piece.color) {
                    // Check if last move was a double step ending adjacent to this pawn
                    const isDoubleStep = Math.abs(lastMove.from.r - lastMove.to.r) === 2;
                    if (isDoubleStep && lastMove.to.r === r && lastMove.to.c === c + dc) {
                        // Valid En Passant
                        moves.push({
                            from: { r, c },
                            to: { r: r + dr, c: c + dc },
                            piece,
                            captured: lastMove.piece,
                            captureSquare: lastMove.to, // Capture the piece where it is (behind destination)
                            isEnPassant: true
                        });
                    }
                }
            }
        });
    }
    // Sliding
    else if (['b', 'r', 'q'].includes(piece.type)) {
        // @ts-ignore
        const dirs = directions[piece.type];
        for (const [dr, dc] of dirs) {
            let tr = r + dr;
            let tc = c + dc;
            while (isOnBoard(tr, tc)) {
                const target = board[tr][tc];
                if (target) {
                    if (target.color !== piece.color) addMove(tr, tc);
                    break;
                }
                addMove(tr, tc);
                tr += dr;
                tc += dc;
            }
        }
    }
    // Step (Knight, King)
    else if (['n', 'k'].includes(piece.type)) {
        // @ts-ignore
        const dirs = directions[piece.type];
        for (const [dr, dc] of dirs) {
            const tr = r + dr;
            const tc = c + dc;
            if (isOnBoard(tr, tc)) {
                addMove(tr, tc);
            }
        }
    }

    // Castling
    if (piece.type === 'k' && !piece.hasMoved && includeCastling) {
        const row = piece.color === 'w' ? 7 : 0;
        const opponent = piece.color === 'w' ? 'b' : 'w';

        // Kingside (White: h1, Black: h8) rook
        const kRook = board[row][7];
        if (kRook && kRook.type === 'r' && !kRook.hasMoved) {
            // Check empty squares (5, 6)
            if (!board[row][5] && !board[row][6]) {
                // Check if King, path, or destination is attacked
                if (!isSquareAttacked(board, { r: row, c: 4 }, opponent) &&
                    !isSquareAttacked(board, { r: row, c: 5 }, opponent) &&
                    !isSquareAttacked(board, { r: row, c: 6 }, opponent)) {

                    moves.push({
                        from: { r, c },
                        to: { r: row, c: 6 },
                        piece,
                        isCastle: 'k'
                    });
                }
            }
        }

        // Queenside
        const qRook = board[row][0];
        if (qRook && qRook.type === 'r' && !qRook.hasMoved) {
            if (!board[row][1] && !board[row][2] && !board[row][3]) {
                if (!isSquareAttacked(board, { r: row, c: 4 }, opponent) &&
                    !isSquareAttacked(board, { r: row, c: 3 }, opponent) &&
                    !isSquareAttacked(board, { r: row, c: 2 }, opponent)) {

                    moves.push({
                        from: { r, c },
                        to: { r: row, c: 2 },
                        piece,
                        isCastle: 'q'
                    });
                }
            }
        }
    }

    return moves;
};

const Chess = () => {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === 'ar';
    const { user } = useUser();
    const navigate = useNavigate();
    const { toast } = useToast();

    // State
    const [board, setBoard] = useState<BoardState>(INITIAL_BOARD);
    const [turn, setTurn] = useState<PieceColor>('w');
    const [lastMove, setLastMove] = useState<Move | null>(null);
    const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
    const [possibleMoves, setPossibleMoves] = useState<Move[]>([]); // Store full Move objects
    const [gameMode, setGameMode] = useState<'human-vs-computer' | 'human-vs-human'>('human-vs-computer');
    const [winner, setWinner] = useState<PieceColor | 'draw' | null>(null);

    const [capturedWhite, setCapturedWhite] = useState<PieceType[]>([]); // Taken by white (so black pieces)
    const [capturedBlack, setCapturedBlack] = useState<PieceType[]>([]); // Taken by black (so white pieces)

    // Helpers
    const isCheckState = (b: BoardState, color: PieceColor) => {
        let kPos: Square | null = null;
        for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++)
            if (b[r][c]?.type === 'k' && b[r][c]?.color === color) kPos = { r, c };

        if (!kPos) return true; // King missing??
        return isSquareAttacked(b, kPos, color === 'w' ? 'b' : 'w');
    };

    const filterMoves = (moves: Move[], boardState: BoardState, color: PieceColor) => {
        return moves.filter(m => {
            const temp = cloneBoard(boardState);
            // Apply move
            temp[m.to.r][m.to.c] = { ...m.piece, type: m.promotion || m.piece.type };
            temp[m.from.r][m.from.c] = null;

            // Handle En Passant capture removal
            if (m.isEnPassant && m.captureSquare) {
                temp[m.captureSquare.r][m.captureSquare.c] = null;
            }

            // Handle Castling Rook move locally just to be safe for check logic?
            // (King already moved). 
            // Technically check logic doesn't care about Rook position unless King is in checkmate.
            // But accurate representation matters.
            if (m.isCastle === 'k') {
                const row = m.to.r;
                temp[row][5] = temp[row][7]; // Move rook to f
                temp[row][7] = null;
            } else if (m.isCastle === 'q') {
                const row = m.to.r;
                temp[row][3] = temp[row][0]; // Move rook to d
                temp[row][0] = null;
            }

            return !isCheckState(temp, color);
        });
    };

    // Interaction
    const handleSquareClick = (r: number, c: number) => {
        if (winner) return;
        if (gameMode === 'human-vs-computer' && turn === 'b') return;

        const clickedPiece = board[r][c];
        const isSelfPiece = clickedPiece && clickedPiece.color === turn;

        if (isSelfPiece) {
            setSelectedSquare({ r, c });
            const moves = getPieceMoves(board, r, c, lastMove);
            const valid = filterMoves(moves, board, turn);
            setPossibleMoves(valid);
            return;
        }

        if (selectedSquare) {
            const move = possibleMoves.find(m => m.to.r === r && m.to.c === c);
            if (move) {
                executeMove(move);
            } else {
                setSelectedSquare(null);
                setPossibleMoves([]);
            }
        }
    };

    const executeMove = (move: Move) => {
        const newBoard = cloneBoard(board);

        // Move Piece
        newBoard[move.to.r][move.to.c] = { ...move.piece, type: move.promotion || move.piece.type, hasMoved: true };
        newBoard[move.from.r][move.from.c] = null;

        // Handle Capture (UI Update)
        if (move.captured) {
            if (turn === 'w') setCapturedWhite(prev => [...prev, move.captured!.type]);
            else setCapturedBlack(prev => [...prev, move.captured!.type]);
        }

        // Handle En Passant Capture Removal
        if (move.isEnPassant && move.captureSquare) {
            newBoard[move.captureSquare.r][move.captureSquare.c] = null;
        }

        // Handle Castling Rook Move
        if (move.isCastle) {
            const row = move.to.r;
            if (move.isCastle === 'k') {
                const rook = newBoard[row][7];
                if (rook) {
                    newBoard[row][5] = { ...rook, hasMoved: true };
                    newBoard[row][7] = null;
                }
            } else {
                const rook = newBoard[row][0];
                if (rook) {
                    newBoard[row][3] = { ...rook, hasMoved: true };
                    newBoard[row][0] = null;
                }
            }
        }

        setBoard(newBoard);
        setLastMove(move);
        setSelectedSquare(null);
        setPossibleMoves([]);

        // Next Turn Logic
        const nextTurn = turn === 'w' ? 'b' : 'w';

        // Check Status
        // Is Opponent in Check?
        if (isCheckState(newBoard, nextTurn)) {
            // Checkmate?
            // Generate all legal moves for opponent
            let canMove = false;
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    if (newBoard[r][c]?.color === nextTurn) {
                        const moves = getPieceMoves(newBoard, r, c, move); // pass 'move' as lastMove
                        const valid = filterMoves(moves, newBoard, nextTurn);
                        if (valid.length > 0) {
                            canMove = true;
                            break;
                        }
                    }
                }
                if (canMove) break;
            }

            if (!canMove) {
                setWinner(turn);
                setTurn(nextTurn); // Update turn to show latest board but game is over
                toast({ title: t('games.chess.checkmate', { winner: t(`games.chess.${turn === 'w' ? 'white' : 'black'}`) }), variant: 'destructive' });
                return;
            } else {
                toast({ title: t('games.chess.check'), className: "bg-red-500 text-white" });
            }
        } else {
            // Stalemate check
            let canMove = false;
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    if (newBoard[r][c]?.color === nextTurn) {
                        const moves = getPieceMoves(newBoard, r, c, move);
                        const valid = filterMoves(moves, newBoard, nextTurn);
                        if (valid.length > 0) {
                            canMove = true;
                            break;
                        }
                    }
                }
                if (canMove) break;
            }
            if (!canMove) {
                setWinner('draw');
                toast({ title: t('games.chess.draw') });
                return;
            }
        }

        setTurn(nextTurn);
    };

    // AI
    useEffect(() => {
        if (gameMode === 'human-vs-computer' && turn === 'b' && !winner) {
            setTimeout(() => {
                // Collect moves
                let allMoves: Move[] = [];
                for (let r = 0; r < 8; r++) {
                    for (let c = 0; c < 8; c++) {
                        if (board[r][c]?.color === 'b') {
                            const ms = getPieceMoves(board, r, c, lastMove);
                            const valid = filterMoves(ms, board, 'b');
                            allMoves.push(...valid);
                        }
                    }
                }

                if (allMoves.length === 0) return; // Should be handled by game end logic already

                // Evaluate
                allMoves.sort((a, b) => {
                    const scoreA = (a.captured ? 10 : 0) + (a.promotion ? 8 : 0) + (a.isCastle ? 3 : 0);
                    const scoreB = (b.captured ? 10 : 0) + (b.promotion ? 8 : 0) + (b.isCastle ? 3 : 0);
                    return scoreB - scoreA;
                });

                // Better AI? Simple capture preference + random
                // Taking top 3 moves and randomizing adds variety
                const topMoves = allMoves.slice(0, Math.min(3, allMoves.length));
                const pick = topMoves[Math.floor(Math.random() * topMoves.length)];
                executeMove(pick);
            }, 500);
        }
    }, [turn, gameMode, winner, board]); // eslint-disable-line

    if (!user) {
        navigate("/");
        return null;
    }

    const resetGame = () => {
        setBoard(INITIAL_BOARD);
        setTurn('w');
        setWinner(null);
        setLastMove(null);
        setCapturedWhite([]);
        setCapturedBlack([]);
    };

    return (
        <Layout>
            <section className="py-8">
                <div className="container mx-auto px-4" dir={isArabic ? "rtl" : "ltr"}>
                    <div className="game-container3">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                            {/* Main Content: Games Grid - Takes 2 columns on large screens */}
                            <div className="lg:col-span-2">
                                {/* Header */}
                                <div className="mb-6">
                                    <GamesMainHeadline title={t("common.games")} width={isArabic ? 120 : 144} />
                                    <div className={`flex items-center justify-between mb-4 px-2 ${isArabic ? "text-right" : "text-left"}`}>
                                        <div className="flex items-center gap-2">
                                            <img src={ChessImage} alt="Chess" className="w-20 h-20" />
                                            <h2 className="text-2xl font-bold">{t("games.chess.name")}</h2>
                                        </div>
                                        <div className="flex items-center gap-4">
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
                                            <ResetButton onClick={resetGame} className='w-full justify-center'>
                                                {t("common.newGame")}
                                            </ResetButton>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant={gameMode === 'human-vs-computer' ? 'default' : 'outline'} className="w-full justify-start gap-2"
                                            onClick={() => { setGameMode('human-vs-computer'); resetGame(); }}>
                                                <ComputerIcon /> {t('games.chess.vsComputer')}
                                            </Button>
                                            <Button variant={gameMode === 'human-vs-human' ? 'default' : 'outline'} className="w-full justify-start gap-2"
                                                onClick={() => { setGameMode('human-vs-human'); resetGame(); }}>
                                                <HumanIcon /> {t('games.chess.vsHuman')}
                                            </Button>
                                        </div>
                                    </div>
                                    {/* Board Wrapper */}
                                    <div className="flex flex-col gap-4">
                                        {/* Captured by Black (White pieces) */}
                                        <div className="h-8 flex gap-1 justify-center lg:justify-start bg-gray-100 p-1 rounded">
                                            {capturedBlack.map((p, i) => <span key={i} className="text-black text-xl">{PIECE_SYMBOLS[`w-${p}`]}</span>)}
                                        </div>

                                        <div className="bg-card border border-[#DEDEDE] rounded-[5px] shadow-lg p-2 md:p-4 select-none">
                                            <div className="mb-4 flex justify-between items-center bg-gray-100 p-2 rounded">
                                                <h3 className="font-bold flex items-center gap-2">
                                                    {winner ? (winner === 'draw' ? t('games.chess.draw') : t('games.chess.checkmate', { winner: winner === 'w' ? t('games.chess.white') : t('games.chess.black') }))
                                                        : (turn === 'w' ? t('games.chess.whiteTurn') : t('games.chess.blackTurn'))}
                                                    <div className={`w-3 h-3 rounded-full ${turn === 'w' ? 'bg-white border border-gray-400' : 'bg-black'}`}></div>
                                                </h3>
                                                <div className='flex gap-2 text-sm'>
                                                    {gameMode === 'human-vs-computer' && <ComputerIcon classes="w-4 h-4" />}
                                                    {gameMode === 'human-vs-human' && <HumanIcon classes="w-4 h-4" />}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-8 border-2 border-gray-800 mx-auto shadow-xl"
                                                style={{ width: 'min(85vw, 480px)', height: 'min(85vw, 480px)' }}>
                                                {Array.from({ length: 64 }).map((_, i) => {
                                                    const r = Math.floor(i / 8);
                                                    const c = i % 8;
                                                    const isBlack = (r + c) % 2 === 1;
                                                    const piece = board[r][c];
                                                    const isSelected = selectedSquare?.r === r && selectedSquare?.c === c;
                                                    const move = possibleMoves.find(m => m.to.r === r && m.to.c === c);
                                                    const isCheckSquare = piece?.type === 'k' && piece.color === turn && isCheckState(board, turn);
                                                    const lastFrom = lastMove?.from.r === r && lastMove?.from.c === c;
                                                    const lastTo = lastMove?.to.r === r && lastMove.to.c === c;

                                                    // Colors
                                                    const cellColor = isBlack ? 'bg-[#769656]' : 'bg-[#EEEED2]';
                                                    const highlightColor = isSelected ? '!bg-[#BACA2B]' : (lastFrom || lastTo ? '!bg-[#BACA2B]/60' : '');
                                                    const checkColor = isCheckSquare ? '!bg-red-500 radial-gradient' : '';

                                                    return (
                                                        <div
                                                            key={i}
                                                            onClick={() => handleSquareClick(r, c)}
                                                            className={`
                                                                flex items-center justify-center text-3xl md:text-5xl cursor-pointer relative
                                                                ${cellColor} ${highlightColor} ${checkColor}
                                                            `}
                                                        >
                                                            {/* Move Indicator */}
                                                            {move && (
                                                                <div className={`absolute z-10 
                                                                    ${piece ? 'rounded-full border-[4px] border-black/20 w-[80%] h-[80%]' : 'w-4 h-4 bg-black/20 rounded-full'}
                                                                `}></div>
                                                            )}

                                                            {/* Piece */}
                                                            {piece && (
                                                                <span className={`
                                                                    z-20 drop-shadow-sm transition-transform duration-200 
                                                                    ${piece.color === 'w' ? 'text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]' : 'text-black'}
                                                                    ${isSelected ? 'scale-110' : ''}
                                                                `}>
                                                                    {PIECE_SYMBOLS[`${piece.color}-${piece.type}`]}
                                                                </span>
                                                            )}

                                                            {/* Labels */}
                                                            {c === 0 && <span className={`absolute top-0.5 left-0.5 text-[8px] md:text-[10px] font-bold ${isBlack ? 'text-[#EEEED2]' : 'text-[#769656]'}`}>{8 - r}</span>}
                                                            {r === 7 && <span className={`absolute bottom-0 right-1 text-[8px] md:text-[10px] font-bold ${isBlack ? 'text-[#EEEED2]' : 'text-[#769656]'}`}>{String.fromCharCode(97 + c)}</span>}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Captured by White (Black pieces) */}
                                        <div className="h-8 flex gap-1 justify-center lg:justify-start bg-gray-100 p-1 rounded">
                                            {capturedWhite.map((p, i) => <span key={i} className="text-black text-xl">{PIECE_SYMBOLS[`b-${p}`]}</span>)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="lg:col-span-1">
                                {/* Controls */}
                                <div className="w-full lg:w-72 space-y-4">
                                    <HowToPlayInstruction title={t("common.howToPlay")} text="">
                                        <ul className="list-disc pl-5 text-sm space-y-2 text-white">
                                            <li>{t('games.chess.description')}</li>
                                        </ul>
                                    </HowToPlayInstruction>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </Layout>
    );
};

export default Chess;
