import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import Layout from "../../components/Layout";
import GamesServices from "../../../v2-services/games-service";
import Crossword from "./Crossword";
import { addUtmParams } from "@/lib/utils";
import { useGameSchema } from "../../hooks/useGameSchema";

type Clue = {
  word: string;
  clue: string;
};

type CrosswordArticle = {
  title: string;
  clues: Clue[];
  project_id: string;
  game_type: string;
  category_id: string;
  link: string;
  image_url: string;
};

const CrosswordGame = () => {
  const [searchParams] = useSearchParams();
  const isArticleView = searchParams.get("src") === "article";

  const navigate = useNavigate();
  const location = useLocation();
  const segments = location.pathname.split("/");
  const gameType = segments[2] || "crossword";
  const gameId = searchParams.get("id");

  const [gameData, setGameData] = useState<CrosswordArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Game schema for SEO
  const baseUrl = typeof window !== "undefined" 
    ? `${window.location.protocol}//${window.location.host}` 
    : "https://asharqgames-uat.sortd.pro";
  const gameUrl = `${baseUrl}${location.pathname}${location.search ? location.search : ""}`;
  const firstGame = gameData[0];
  
  useGameSchema(
    {
      name: "Crossword",
      headline: firstGame?.title ? `${firstGame.title} - Asharq Games` : "Crossword - Asharq Games",
      description: "Play Arabic crossword puzzles and test your knowledge. Solve clues and complete the grid!",
      url: gameUrl,
      image: firstGame?.image_url || `${baseUrl}/assets/crossword.jpg`,
      isAccessibleForFree: true,
    },
    !isArticleView && !loading && gameData.length > 0
  );

  useEffect(() => {
    const fetchGameData = async () => {
      if (!gameType) {
        setError("لم يتم تحديد نوع اللعبة");
        return;
      }
      setLoading(true);
      try {
        const res = await GamesServices.getGame(gameType, gameId);
        if (res?.status && res.data) {
          const transformedData = res.data.map((item: any) => {
            // Extract clues from the data structure
            const clues = item.data?.clues || [];
            
            return {
              title: item.article_detail?.title || "الكلمات المتقاطعة",
              clues: clues.map((clueItem: any) => ({
                word: clueItem.word || "",
                clue: clueItem.clue || ""
              })),
              project_id: item.project_id,
              game_type: item.game_type,
              category_id: item.category_id || "",
              link: addUtmParams(item.article_detail?.link || ""),
              image_url: item.article_detail?.image_url || "",
            };
          });
          setGameData(transformedData);
        } else {
          setError("فشل تحميل بيانات الكلمات المتقاطعة");
        }
      } catch (e) {
        console.error("Failed to fetch crossword data:", e);
        setError("فشل جلب بيانات الكلمات المتقاطعة");
      } finally {
        setLoading(false);
      }
    };
    fetchGameData();
  }, [gameType, gameId]);

  if (loading) {
    const view = (
      <div className="text-center py-12" dir="rtl">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-lg text-muted-foreground">جاري تحميل الكلمات المتقاطعة...</p>
      </div>
    );
    return isArticleView ? view : <Layout>{view}</Layout>;
  }

  if (error) {
    const view = (
      <div className="text-center py-12" dir="rtl">
        <h1 className="text-3xl font-bold mb-4 text-red-600">خطأ</h1>
        <p className="text-lg text-muted-foreground mb-6">{error}</p>
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          العودة إلى الصفحة الرئيسية
        </button>
      </div>
    );
    return isArticleView ? view : <Layout>{view}</Layout>;
  }

  if (!gameData.length && !loading) {
    const view = (
      <div className="text-center py-12" dir="rtl">
        <h1 className="text-3xl font-bold mb-4">لا توجد كلمات متقاطعة متاحة</h1>
        <p className="text-lg text-muted-foreground mb-6">لم يتم العثور على بيانات الكلمات المتقاطعة.</p>
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          العودة إلى الصفحة الرئيسية
        </button>
      </div>
    );
    return isArticleView ? view : <Layout>{view}</Layout>;
  }

  const view = <Crossword games={gameData} gameId={gameId || undefined} />;
  return isArticleView ? view : <Layout>{view}</Layout>;
};

export default CrosswordGame;