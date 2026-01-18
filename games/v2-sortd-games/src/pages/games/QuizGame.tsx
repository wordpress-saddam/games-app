import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import Quiz from "./Quiz";
import GamesServices from "../../../v2-services/games-service";
import LeaderboardView from "./LeaderBoardView";
import Layout from "../../components/Layout";
import HeightReporter from "../../utils/HeightReporter";
import { useTranslation } from "react-i18next";
import { useGameSchema } from "../../hooks/useGameSchema";

const QuizGame = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const isArticleView = searchParams.get("src") === "article";

  const navigate = useNavigate();
  const [gameData, setGameData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const location = useLocation();
  const segments = location.pathname.split("/");
  const gameType = segments[2];
  const gameId = searchParams.get("id");
  
  // Game schema for SEO
  const baseUrl = typeof window !== "undefined" 
    ? `${window.location.protocol}//${window.location.host}` 
    : "https://asharqgames-uat.sortd.pro";
  const gameUrl = `${baseUrl}${location.pathname}${location.search ? location.search : ""}`;
  
  useGameSchema({
    name: "Quiz",
    headline: "Quiz - Asharq Games",
    description: "Test your knowledge with our interactive quiz game. Answer questions and challenge yourself!",
    url: gameUrl,
    image: `${baseUrl}/assets/quiz.jpg`,
    isAccessibleForFree: true,
  }, !isArticleView && !loading && gameData.length > 0);

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
        <p className="text-lg text-muted-foreground">{t("quiz.loadingQuiz")}</p>
      </div>
    );

  return isArticleView ? quiz : <Layout>{quiz}</Layout>;

  }

  if (error) {
    const quiz = (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold mb-4 text-red-600">{t("quiz.error")}</h1>
        <p className="text-lg text-muted-foreground mb-6">{error}</p>
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          {t("quiz.backToHome")}
        </button>
      </div>
    );
    return isArticleView ? quiz : <Layout>{quiz}</Layout>;

  }

  if (!gameData.length && !loading) {
    const quiz = (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold mb-4">{t("quiz.noQuizAvailable")}</h1>
        <p className="text-lg text-muted-foreground mb-6">
          {t("quiz.noQuizQuestionsFound")}
        </p>
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          {t("quiz.backToHome")}
        </button>
      </div>
    );
   return isArticleView ? quiz : <Layout>{quiz}</Layout>;

  }

  return <Quiz gameData={gameData} />;
};

export default QuizGame;
