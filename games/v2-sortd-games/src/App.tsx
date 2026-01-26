import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, useLocation } from "react-router-dom";

import HeightReporter from "./utils/HeightReporter";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginSuccess from "./pages/LoginSuccess";
import LoginError from "./pages/LoginError";
import { UserRegistrationProvider } from "./context/UserRegistrationContext"
import GlobalUserRegistrationDialog from "./pages/GlobalUserRegistrationDialog";
// Game pages
import TicTacToe from "./pages/games/TicTacToe";
import Ludo from "./pages/games/Ludo";
import Chess from "./pages/games/Chess";
import SnakeGame from "./pages/games/SnakeGame";
import MemoryGame from "./pages/games/MemoryGame";
import Game2048 from "./pages/games/Game2048";
import WordleGame from "./pages/games/WordleGame";
import FlappyBirdGame from "./pages/games/FlappyBirdGame";
import TetrisGame from "./pages/games/TetrisGame";
import SudokuGame from "./pages/games/SudokuGame";
import SudokuArabic from "./pages/games/SudokuArabic";
import MinesweeperGame from "./pages/games/MinesweeperGame";
import ScrambleGame from "./pages/games/ScrumbleGame";
import QuizGame from "./pages/games/QuizGame";
import HangmanGame from "./pages/games/HangmanGame";
import CustomQuizGame from "./pages/games/CustomQuizGame";
import { UserProvider } from "./context/UserContext";
import LeaderBoard from "./pages/games/LeaderBoard";
import { useUser } from "./context/UserContext"; // Import useUser
import { sendCustomEvent } from "./analytics/ga"; // Import sendCustomEvent
import ArticleLeaderboard from "./pages/games/ArticleLeaderboard";
import { configUrl, defaultConfig } from "./config/site";
import SnakeData from "./pages/games/SnakeData";
import CrosswordGame from "./pages/games/CrosswordGame";
import LinkGame from "./pages/games/DotsLink";


const queryClient = new QueryClient();

const HEIGHT_REPORTER_ROUTES = [
  "/games/quiz",
  "/games/custom_quiz",
  "/games/headline_scramble",
  "/games/headline_scramble_arabic",
  "/games/hangman",
  "/games/hangman-arabic",
  "/games/leaderboard",
  "/leaderboard",
  "/games/crossword",
];

const GAME_ROUTES = [
  { path: "/", element: <Index />, title: "Home" },
  { path: "/games/xox", element: <TicTacToe />, title: "XOX" },
  { path: "/games/ludo", element: <Ludo />, title: "Ludo" },
  { path: "/games/chess", element: <Chess />, title: "Chess" },
  { path: "/games/hungry-trail", element: <SnakeData />, title: "Hungry Trail" },
  { path: "/games/card-pair-challenge", element: <MemoryGame />, title: "Card Pair Challenge" },
  { path: "/games/tile-merge", element: <Game2048 />, title: "Tile Merge Puzzle" },
  { path: "/games/5-letter", element: <WordleGame />, title: "5-Letter Guess" },
  { path: "/games/sky-hopper", element: <FlappyBirdGame />, title: "Sky Hopper" },
  { path: "/games/block-drop", element: <TetrisGame />, title: "Block Drop Puzzle" },
  { path: "/games/sudoku", element: <SudokuGame />, title: "Sudoku" },
  { path: "/games/sudoku-arabic", element: <SudokuArabic />, title: "Sudoku Arabic" },
  { path: "/games/mine-hunt", element: <MinesweeperGame />, title: "Mine Hunt Logic" },
  { path: "/games/headline_scramble_arabic", element: <ScrambleGame />, title: "Headline Scramble Arabic" },
  { path: "/games/headline_scramble", element: <ScrambleGame />, title: "Headline Scramble" },
  { path: "/games/quiz", element: <QuizGame />, title: "Quiz" },
  { path: "/games/custom_quiz", element: <CustomQuizGame />, title: "Custom Quiz" },
  { path: "/games/hangman-arabic", element: <HangmanGame />, title: "Hangman Arabic" },
  { path: "/games/hangman", element: <HangmanGame />, title: "Hangman" },
  { path: "/games/leaderboard", element: <LeaderBoard />, title: "Game Leaderboard" },
  { path: "/leaderboard", element: <ArticleLeaderboard />, title: "Article Leaderboard" },
  { path: "/games/crossword", element: <CrosswordGame />, title: "Crossword" },
  { path: "/games/dots-link", element: <LinkGame />, title: "Dots Link" },
];

const App = () => {
  const { user } = useUser();
  const location = useLocation();

  // This effect hook handles dynamic page titles and analytics events on route change. 
  // It also conditionally sends the 'page_view' event.
  useEffect(() => {
    const currentRoute = GAME_ROUTES.find(route => route.path === location.pathname);
    const urlParams = new URLSearchParams(location.search);
    const isArticleView = urlParams.get('src') === 'article';

    // Determine the base title from the domain-specific configuration
    const currentDomain = typeof window !== "undefined" ? window.location.hostname : "";
    const siteConfig = configUrl[currentDomain] || defaultConfig;
    const baseTitle = siteConfig.title || "Asharq Games";

    // Construct the final page title and set it
    const pageTitle = currentRoute
      ? `${currentRoute.title} | ${baseTitle}`
      : baseTitle;
    document.title = pageTitle;

    // Only send 'page_view' if it's NOT an article view
    if (!isArticleView) {
      sendCustomEvent("page_view", {
        domain: window.location.hostname,
        user: user?.user_id || "guest",
        page_path: location.pathname,
        page_title: pageTitle,
      });
    }
  }, [user, location.pathname, location.search]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <UserRegistrationProvider>
          <Toaster />
          <Sonner />
          <GlobalUserRegistrationDialog />
          <Routes>
            {GAME_ROUTES.map(({ path, element }) => (
              <Route
                key={path}
                path={path}
                element={
                  HEIGHT_REPORTER_ROUTES.includes(path) ? (
                    <HeightReporter>{element}</HeightReporter>
                  ) : (
                    element
                  )
                }
              />
            ))}
            <Route path="/login/success" element={<LoginSuccess />} />
            <Route path="/login/error" element={<LoginError />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </UserRegistrationProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;