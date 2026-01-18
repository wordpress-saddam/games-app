import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import Quiz from "./Quiz";
import GamesServices from "../../../v2-services/games-service";
import { useSearchParams, useLocation } from "react-router-dom";

const CustomQuizGame = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const segments = location.pathname.split("/");
  const gameType = segments[2]; // expecting custom_quiz
  const gameId = searchParams.get("id");

  const [gameData, setGameData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGameData = async () => {
      if (!gameType) {
        setError("No game ID provided");
        return;
      }
      setLoading(true);
      try {
        const games = await GamesServices.getGame(gameType, gameId);
        if (games?.status && games.data) {
          setGameData(games.data);
        } else {
          setError("Failed to load quiz data");
        }
      } catch (error) {
        console.error("Failed to fetch quiz data:", error);
        setError("Failed to fetch quiz data");
      } finally {
        setLoading(false);
      }
    };
    fetchGameData();
  }, [gameType, gameId]);

  if (loading) {
    const quiz = (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-lg text-muted-foreground">Loading quiz...</p>
      </div>
    );
    return <Layout>{quiz}</Layout>;
  }

  if (error) {
    const quiz = (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold mb-4 text-red-600">Error</h1>
        <p className="text-lg text-muted-foreground mb-6">{error}</p>
      </div>
    );
    return <Layout>{quiz}</Layout>;
  }

  if (!gameData.length && !loading) {
    const quiz = (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold mb-4">No Quiz Available</h1>
        <p className="text-lg text-muted-foreground mb-6">No quiz questions found.</p>
      </div>
    );
    return <Layout>{quiz}</Layout>;
  }

  return (
    <Quiz
      gameData={gameData}
      article={false}
      hideArticleLink={true}
      nameOverride="Custom Quiz"
      gameTypeOverride="custom_quiz"
    />
  );
};

export default CustomQuizGame;


