import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Trophy,
  Medal,
  Award,
  Crown,
  Star,
  Target,
  Zap,
  Users,
  Play,
} from "lucide-react";
import Layout from "../../components/Layout";
import { useToast } from "@/hooks/use-toast";
import GamesServices from "../../../v2-services/games-service";
import { useUser } from "../../context/UserContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslation } from "react-i18next";
import { formatTimeWithHours, formatNumberForDisplay, formatNumber } from "../../utils/numberFormatter";

interface LeaderboardEntry {
  user_id: string;
  user_name: string;
  score: number;
  rank: number;
}

interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
  user_info?: LeaderboardEntry;
}

const LeaderBoard = () => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { user } = useUser();
  const [searchParams] = useSearchParams();
  const isArticleView = searchParams.get("src") === "article";
console.log(user)
  const [leaderboardData, setLeaderboardData] =
    useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const Game = searchParams.get("name");

  const fetchLeaderboard = async () => {
    console.log(user)
    setLoading(true);
    try {
      const response = await GamesServices.getLeadershipBoard({
        duration: searchParams.get("duration") || "month",
        game_type: searchParams.get("game_type"),
        top_k: parseInt(searchParams.get("top_k")),
        sort_order: searchParams.get("sort_order") || "desc",
        score_type: searchParams.get("score_type") || "avg",
        user_id: user?.user_id || "",
      });

      if (response?.data && response.data?.status) {
        const data = response?.data?.data;
        setLeaderboardData(data);
      }
    } catch (error) {

      console.error("Failed to fetch leaderboard:", error);
      // toast({
      //   title: "Error",
      //    className: "bg-red-500 text-white font-semibold border-none shadow-xl",
      //   description: "Failed to fetch leaderboard data",
      //   variant: "destructive",
      // });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Redirect anonymous users away from leaderboard
    if (user?.isAnonymous) {
      navigate('/');
      return;
    }
    fetchLeaderboard();
  }, [user]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="text-yellow-400" size={24} />;
      case 2:
        return <Medal className="text-silver-600" size={24} />;
      case 3:
        return <Award className="text-amber-600" size={24} />;
      default:
        return <Star className="text-purple-400" size={20} />;
    }
  };

  const getRankBadge = (rank: number) => {
    const badges = {
      1: "bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-500 text-white shadow-lg",
      2: "bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500 text-white shadow-lg",
      3: "bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 text-white shadow-lg",
    };
    return (
      badges[rank] ||
      "bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg"
    );
  };

 // Use the utility function for time formatting
 const convertSecondsToTime = (totalSeconds: number) => {
   return formatTimeWithHours(totalSeconds);
 };

console.log(Game);
  if (!user) {
    navigate("/");
  }
  const renderPodium = () => {
    if (!leaderboardData || leaderboardData.leaderboard.length === 0)
      return null;

    const topThree = leaderboardData.leaderboard.slice(0, 3);
    const podiumOrder = [topThree[1], topThree[0], topThree[2]].filter(Boolean);
    const heights = ["h-40", "h-64", "h-24"];

    return (
      <div className="flex items-end justify-center gap-4">
        {" "}
        {podiumOrder.map((player, index) => {
          if (!player) return null;

          const actualRank = player.rank;
          const heightIndex = actualRank === 1 ? 1 : actualRank === 2 ? 0 : 2;

          const rankColors = {
            1: "from-yellow-400 via-amber-500 to-yellow-600", // Gold
            2: "from-slate-200 via-gray-300 to-slate-400", // Silver
            3: "from-amber-500 via-amber-600 to-amber-700", // Bronze
          };

          const emoji = {
            1: "👑",
            2: "🥈",
            3: "🥉",
          };

          // Glow styles for emoji badges
          let emojiBadgeGlowClass = "shadow-md"; // Default shadow
          if (actualRank === 1) {
            // Gold glow for rank 1
            emojiBadgeGlowClass = "shadow-[0_0_12px_2px_rgba(255,215,0,0.7)]";
          } else if (actualRank === 2) {
            // Silver glow for rank 2
            emojiBadgeGlowClass = "shadow-[0_0_12px_2px_rgba(192,192,192,0.7)]";
          } else if (actualRank === 3) {
            // Bronze glow for rank 3
            emojiBadgeGlowClass = "shadow-[0_0_12px_2px_rgba(205,127,50,0.7)]";
          }

          return (
            <div
              key={player.user_id}
              className="flex flex-col items-center space-y-1"
            >
              <div className="flex flex-col items-center text-center mb-2">
                {" "}
                <div
                  className={`w-8 h-8 rounded-full bg-amber-100 text-white flex items-center justify-center text-xs font-bold ${emojiBadgeGlowClass} mb-1`}
                >
                  {emoji[actualRank] || actualRank}
                </div>
                <h3 className="font-bold text-xs text-slate-800 dark:text-white truncate max-w-[120px]">
                  {" "}
                  {player.user_name}
                </h3>
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {Game === "Card Pair Challenge" || Game == "Mine Hunt Logic" 
                    ? convertSecondsToTime(player.score)
                    : formatNumber(player.score, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })}
                  {Game == "Card Pair Challenge" || Game == "Mine Hunt Logic"  ? "" : t("leaderboard.pts")}
                </div>
              </div>

              {/* Podium Bar */}
              <div
                className={`transition-all duration-300 ease-out ${
                  heights[heightIndex]
                } w-12 bg-gradient-to-t ${
                  rankColors[actualRank] ||
                  "from-purple-900 via-purple-700 to-purple-500"
                } rounded-t-lg shadow-xl flex items-end justify-center`}
              >
                <div className="text-white font-bold text-sm pb-1">
                  {" "}
                  {actualRank}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderEmptyState = () => (
    <div className="text-center ">
      <div className="relative mb-4">
        {" "}
        <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900 to-indigo-900 rounded-full flex items-center justify-center animate-pulse mx-auto">
          {" "}
          <Trophy className="text-purple-500 animate-bounce" size={32} />{" "}
        </div>
      </div>

      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
        {" "}
        {t("leaderboard.readyToCompete")}
      </h3>
      <p className="text-slate-600 dark:text-slate-400 mb-4 max-w-xs mx-auto">
        {" "}
        {t("leaderboard.startPlayingGamesAndClimbYourWayToTheTopOfTheLeaderboard")}
      </p>

      <div className="grid grid-cols-1 gap-2 max-w-xs mx-auto">
        {" "}
        <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/50 dark:to-indigo-950/50 rounded-lg border border-purple-200 dark:border-purple-800">
          {" "}
          <Target className="text-purple-500" size={16} />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            {" "}
            {t("leaderboard.playGames")}
          </span>
        </div>
        <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 rounded-lg border border-green-200 dark:border-green-800">
          <Zap className="text-green-500" size={16} />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            {t("leaderboard.earnPoints")}
          </span>
        </div>
        <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/50 dark:to-amber-950/50 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <Users className="text-yellow-600" size={16} />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            {t("leaderboard.competeAndClimb")}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="game-area">
        <div className="game-container">
          <div className="text-center mb-5">
            <div className="text-center mb-2">
              <div className="inline-flex items-center gap-2">
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-r from-yellow-400 to-orange-500  shadow-lg">
                  <Trophy className="text-white" size={24} />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold  whitespace-nowrap">
                  {Game} {isMobile ? "" : t("leaderboard.leaderboard")}
                </h1>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              {Game == "Card Pair Challenge" || Game == "Mine Hunt Logic" 
                ? t("leaderboard.theLessTheTimeTheHigherTheScore")
                : t("leaderboard.competeWithTheFinestMindsAndClimbToTheTop")}
            </p>
          </div>

          <div className="text-center mt-2 mb-5">
            <button
              onClick={() => navigate(-1)}
              // onClick={onStartQuiz}
              className="inline-flex items-center gap-3 px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Play size={12} />
              {t("leaderboard.backTo")} {Game}
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-lg text-muted-foreground">
                {t("leaderboard.loadingLeaderboard")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-8 mb-5">
              {/* Left Panel - Podium */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg border">
                {" "}
                <div className="text-center mb-4">
                  {" "}
                  <h3 className="text-md font-semibold text-slate-800 dark:text-white ">
                    {" "}
                    {t("leaderboard.hallOfChampions")}
                  </h3>
                  <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-indigo-500 mx-auto rounded-full"></div>
                </div>
                {leaderboardData && leaderboardData.leaderboard.length > 0 ? (
                  renderPodium()
                ) : (
                  <div className="flex flex-col items-center justify-center text-center h-40">
                    {" "}
                    <Trophy className="text-slate-400 mb-2" size={40} />{" "}
                    <p className="text-slate-600 dark:text-slate-400">
                      {t("leaderboard.noChampionsYet")}
                    </p>
                  </div>
                )}
              </div>

              {/* Right Panel - Rankings */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-lg border">
                {" "}
                <div className="text-center mb-4">
                  {" "}
                  <h3 className="text-md font-semibold text-slate-800 dark:text-white ">
                    {" "}
                    {t("leaderboard.allPlayers")}
                  </h3>
                  <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-indigo-500 mx-auto rounded-full"></div>
                </div>
                {leaderboardData && leaderboardData.leaderboard.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {" "}
                    {leaderboardData.user_info &&
                      Object.keys(leaderboardData.user_info).length > 0 && (
                        <div className="p-3 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/50 dark:to-indigo-900/50 rounded-lg border-2 border-purple-300 dark:border-purple-600 mb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {getRankIcon(leaderboardData.user_info.rank)}
                              <span className="font-semibold text-purple-600 dark:text-purple-400">
                                #{leaderboardData.user_info.rank}
                              </span>
                              <span className="font-bold text-purple-800 dark:text-purple-200">
                                {leaderboardData.user_info.user_name} {t("leaderboard.you")}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-purple-800 dark:text-purple-200">
                                {Game === "Card Pair Challenge" || Game == "Mine Hunt Logic" 
                                  ? convertSecondsToTime(
                                      leaderboardData.user_info.score
                                    )
                                  : formatNumber(Number(leaderboardData.user_info.score), {
                                      minimumFractionDigits: 0,
                                      maximumFractionDigits: 2,
                                    }).replace(/\.00$/, "")}
                              </span>
                              <span className="text-xs text-purple-600 dark:text-purple-400 ml-1">
                                {Game == "Card Pair Challenge" || Game == "Mine Hunt Logic"  ? "" : t("leaderboard.pts")}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    {/* All Players List */}
                    {leaderboardData.leaderboard.map((entry) => (
                      <div
                        key={entry.user_id}
                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {getRankIcon(entry.rank)}
                          <span className="font-semibold text-slate-600 dark:text-slate-400">
                            #{entry.rank}
                          </span>
                          <span className="font-medium text-slate-800 dark:text-white">
                            {entry.user_name}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-800 dark:text-white">
                            {Game === "Card Pair Challenge" || Game == "Mine Hunt Logic" 
                              ? convertSecondsToTime(entry.score)
                              : formatNumber(entry.score, {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 2,
                                })}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
                            {Game == "Card Pair Challenge" || Game == "Mine Hunt Logic"   ? "" : t("leaderboard.pts")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  renderEmptyState()
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default LeaderBoard;
