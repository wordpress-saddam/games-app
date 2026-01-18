import React, { useState, useEffect, useRef } from "react";
import { useNavigate ,useSearchParams } from "react-router-dom";
import {
  X,
  Trophy,
  Medal,
  Award,
  Calendar,
  Filter,
  Crown,
  Star,
  ChevronDown,
  Target,
  Zap,
  Users,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import GamesServices from "../../../v2-services/games-service";
import { useUser } from "../../context/UserContext";

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

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  game_id: string;
  game_type : string
  score_type : string
  sort_order : "desc" | "asc"
}

interface LeaderboardFilter {
  duration?: "day" | "week" | "month";
  start_date?: string;
  end_date?: string;
  game_type: string;
  game_id: string;
  top_k?: number;
  sort_order?: "desc" | "asc";
  score_type?: "sum" | "avg" | "max" | "min";
  user_id?: string;
}

const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  game_id,
  game_type,
  score_type,
  sort_order = "desc",
}) => {
  const navigate = useNavigate();
   const { user } = useUser();
    const [searchParams] = useSearchParams();
 const isArticleView = searchParams.get("src") === "article";

  const [leaderboardData, setLeaderboardData] =useState<LeaderboardData | null>(null);

  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState<"day" | "week" | "month">("day");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [scoreType, setScoreType] = useState<"sum" | "avg" | "max" | "min">(
    "sum"
  );
  const [topK, setTopK] = useState<number>(10);
  const { toast } = useToast();
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen, onClose]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await GamesServices.getLeadershipBoard({
        duration: duration,
        game_type: game_type,
        top_k: 10,
        sort_order: sort_order,
        score_type: score_type,
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
    if (isOpen) {
      fetchLeaderboard();
    }
  }, [isOpen, game_id, duration, sortOrder, scoreType, topK]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="text-yellow-400" size={24} />;
      case 2:
        return <Medal className="text-slate-400" size={24} />;
      case 3:
        return <Award className="text-amber-500" size={24} />;
      default:
        return <Star className="text-purple-400" size={20} />;
    }
  };

  if (!isOpen) return null;
  if(!user || user.isAnonymous) {
    navigate('/')
    return null;
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
            2: "from-slate-200 via-gray-300 to-slate-400",   // Silver
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
                <h3 className="font-bold text-xs text-slate-800 dark:text-white truncate max-w-[70px]">
                  {" "}
                  {player.user_name}
                </h3>
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {player.score.toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                          })} pts
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
        Ready to Compete?
      </h3>
      <p className="text-slate-600 dark:text-slate-400 mb-4 max-w-xs mx-auto">
        {" "}
        Start playing games and climb your way to the top of the leaderboard!
      </p>

      <div className="grid grid-cols-1 gap-2 max-w-xs mx-auto">
        {" "}
        <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/50 dark:to-indigo-950/50 rounded-lg border border-purple-200 dark:border-purple-800">
          {" "}
          <Target className="text-purple-500" size={16} />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            {" "}
            Play Games
          </span>
        </div>
        <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 rounded-lg border border-green-200 dark:border-green-800">
          <Zap className="text-green-500" size={16} />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Earn Points
          </span>
        </div>
        <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/50 dark:to-amber-950/50 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <Users className="text-yellow-600" size={16} />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Compete & Climb
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        ref={modalRef}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden relative"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-full flex items-center justify-center transition-colors"
        >
          <X size={18} className="text-slate-600 dark:text-slate-300" />
        </button>

        {/* Header */}
        <div className="text-center py-6 px-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full shadow-lg">
              <Trophy className="text-white" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
              Leaderboard
            </h2>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            See how you rank against other players
          </p>
        </div>

        {/* Duration Tabs */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex justify-center space-x-2 sm:space-x-4">
            {(["day", "week", "month"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900
                  ${
                    duration === d
                      ? "bg-purple-600 text-white shadow-md hover:bg-purple-700"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                  }
                `}
              >
                {d === "day"
                  ? "Today"
                  : d === "week"
                  ? "Last 7 Days"
                  : "Last 30 Days"}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                Loading leaderboard...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Panel - Podium */}
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                    Hall of Champions
                  </h3>
                  <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-indigo-500 mx-auto rounded-full"></div>
                </div>
                {leaderboardData && leaderboardData.leaderboard.length > 0 ? (
                  renderPodium()
                ) : (
                  <div className="flex flex-col items-center justify-center text-center h-48">
                    <Trophy className="text-slate-400 mb-2" size={40} />
                    <p className="text-slate-600 dark:text-slate-400">
                      No champions yet
                    </p>
                  </div>
                )}
              </div>

              {/* Right Panel - Rankings */}
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                    All Players
                  </h3>
                  <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-indigo-500 mx-auto rounded-full"></div>
                </div>
                {leaderboardData && leaderboardData.leaderboard.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {/* Current User Rank at Top */}
                    {leaderboardData.user_info &&
                      Object.keys(leaderboardData.user_info).length > 0 && (
                        <div className="p-4 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/50 dark:to-indigo-900/50 rounded-lg border-2 border-purple-300 dark:border-purple-600 mb-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {getRankIcon(leaderboardData.user_info.rank)}
                              <span className="font-semibold text-purple-600 dark:text-purple-400">
                                #{leaderboardData.user_info.rank}
                              </span>
                              <span className="font-bold text-purple-800 dark:text-purple-200">
                                {leaderboardData.user_info.user_name} (You)
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-purple-800 dark:text-purple-200">
                                {Number(leaderboardData.user_info.score)
                                  .toFixed(2)
                                  .replace(/\.00$/, "")}
                              </span>
                              <span className="text-xs text-purple-600 dark:text-purple-400 ml-1">
                                pts
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                    {/* All Players List */}
                    {leaderboardData.leaderboard.map((entry) => (
                      <div
                        key={entry.user_id}
                        className="flex items-center justify-between p-4 bg-white dark:bg-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors border border-slate-200 dark:border-slate-600"
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
                            {entry.score.toLocaleString(undefined, {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
                            pts
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
    </div>
  );
};

export default LeaderboardModal;
