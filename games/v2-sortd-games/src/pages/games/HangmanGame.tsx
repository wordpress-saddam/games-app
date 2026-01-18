import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";

import Hangman from "./Hagman";
import ArabicHangman from "./ArabicHangman";
import Layout from "../../components/Layout";
import GamesServices from "../../../v2-services/games-service";
import { useGameSchema } from "../../hooks/useGameSchema";

const HangmanGame = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [gameData, setGameData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const gameId = searchParams.get("id");
  const isArticleView = searchParams.get("src") === "article";
  const location = useLocation();
  const segments = location.pathname.split("/");
  const gameTypeFromUrl = segments[2];
  const isArabic = gameTypeFromUrl === "hangman-arabic";
  const gameType = isArabic ? "hangman" : gameTypeFromUrl;

  // Game schema for SEO
  const baseUrl = typeof window !== "undefined" 
    ? `${window.location.protocol}//${window.location.host}` 
    : "https://asharqgames-uat.sortd.pro";
  const gameUrl = `${baseUrl}${location.pathname}${location.search ? location.search : ""}`;
  const gameName = "Hangman";
  const firstGame = gameData[0];
  
  useGameSchema(
    {
      name: gameName,
      headline: `${gameName} - Asharq Games`,
      description: isArabic
        ? "Guess the Arabic word letter by letter. Test your vocabulary and spelling skills!"
        : "Guess the word letter by letter. Test your vocabulary and spelling skills!",
      url: gameUrl,
      image: firstGame?.article_detail?.image_url || `${baseUrl}/assets/hangman.jpg`,
      isAccessibleForFree: true,
    },
    !isArticleView && !loading && gameData.length > 0
  );

  useEffect(() => {
    const fetchGameData = async () => {
      if (!gameType) {
        setError("No game ID provided");
        setLoading(false);
        return;
      }

      try {
        const games = await GamesServices.getGame(gameType, gameId);

        if (games?.status && games.data) {
          setGameData(games.data);
        } else {
          setError("Failed to load game data");
        }
      } catch (error) {
        console.error("Failed to fetch game data:", error);
        setError("Failed to fetch game data");
      } finally {
        setLoading(false);
      }
    };

    fetchGameData();
  }, [gameType]);

  if (loading) {
    const component = (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-lg text-muted-foreground">Loading game...</p>
      </div>
    );
    return isArticleView ? component : <Layout>{component}</Layout>;
  }

  if (error) {
    const component = (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold mb-4 text-red-600">Error</h1>
        <p className="text-lg text-muted-foreground mb-6">{error}</p>
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Back to Home
        </button>
      </div>
    );
    return isArticleView ? component : <Layout>{component}</Layout>;
  }

  if (!gameData.length) {
    const component = (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold mb-4">No Games Available</h1>
        <p className="text-lg text-muted-foreground mb-6">
          No hangman games found.
        </p>
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Back to Home
        </button>
      </div>
    );
    return isArticleView ? component : <Layout>{component}</Layout>;
  }

  if (isArabic) {
    return <ArabicHangman gameData={gameData} />;
  }

  return <Hangman gameData={gameData} />
};

export default HangmanGame;
