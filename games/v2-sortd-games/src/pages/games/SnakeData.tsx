import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import Scramble from "./Scrumbe";
import Layout from "../../components/Layout";
import GamesServices from "../../../v2-services/games-service";
import SnakeGame from "./SnakeGame";
import { useUser } from "../../context/UserContext";
import { useGameSchema } from "../../hooks/useGameSchema";

const SnakeData = () => {

  const {user} = useUser();
  const [searchParams] = useSearchParams();

  const isArticleView = searchParams.get("src") === "article";
  const navigate = useNavigate();
  const [gameData, setGameData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const location = useLocation();
  const segments = location.pathname.split("/");
  const gameType = "headline_scramble";
  const gameId = searchParams.get("id");

  // Game schema for SEO
  const baseUrl = typeof window !== "undefined" 
    ? `${window.location.protocol}//${window.location.host}` 
    : "https://asharqgames-uat.sortd.pro";
  const gameUrl = `${baseUrl}${location.pathname}${location.search ? location.search : ""}`;
  const firstGame = gameData[0];
  
  useGameSchema(
    {
      name: "Hungry Trail",
      headline: "Hungry Trail - Asharq Games",
      description: "Navigate through words to form sentences. Collect words in the correct order to complete headlines!",
      url: gameUrl,
      image: firstGame?.article_detail?.image_url || `${baseUrl}/assets/hungry-trail.jpg`,
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


  if (!user) {
    navigate("/");
    return null;
  }
  
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
          No scramble games found.
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

  return <SnakeGame gameData={gameData} />;
};

export default SnakeData;
