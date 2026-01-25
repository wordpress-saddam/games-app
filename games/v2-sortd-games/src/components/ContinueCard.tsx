import React, { useState, useEffect, useRef, useMemo } from "react";
import { Play, Clock, Trophy } from "lucide-react";
import { useNavigate , useSearchParams } from "react-router-dom";
import type { UseEmblaCarouselType } from "embla-carousel-react";
import { useUser } from "../context/UserContext";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { sendCustomEvent } from "../analytics/ga";
import { addGameToContinue } from "./ContinueGamesUtils";
import GamesServices from "../../v2-services/games-service";
import { useTranslation } from "react-i18next";

interface ContinueGameData {
  id: string;
  title?: string; // Optional: fallback if titleKey is not available
  description?: string; // Optional: fallback if descriptionKey is not available
  titleKey?: string; // Translation key for title (e.g., "games.xox.name")
  descriptionKey?: string; // Translation key for description (e.g., "games.xox.description")
  imageUrl?: string;
  gameType: "dynamic" | "static";
  lastPlayed: string;
  progress?: {
    score?: number;
    level?: number;
    completed?: boolean;
  };
}

interface ContinueSectionProps {
  search?: string;
}

const ContinueSection: React.FC<ContinueSectionProps> = ({ search }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [continueGames, setContinueGames] = useState<ContinueGameData[]>([]);
  const [searchParams] = useSearchParams();
  const game_id = searchParams.get('id');
  const [showScrollArrows, setShowScrollArrows] = useState(false);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [slidesToScroll, setSlidesToScroll] = useState<1 | "auto">(1);

  const { user } = useUser();
  const navigate = useNavigate();
  const [emblaApi, setEmblaApi] = useState<UseEmblaCarouselType[1] | undefined>(); 
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const resumeAutoplayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const AUTOPLAY_DELAY = 1000; // 2 seconds
  const RESUME_AUTOPLAY_DELAY = 5000; // 5 seconds

  // Function to calculate how many items can fit in the viewport
  const getItemsPerView = () => {
    const width = window.innerWidth;
    if (width >= 1280) return 4; // xl: basis-1/5
    if (width >= 1024) return 4; // lg: basis-1/4
    if (width >= 640) return 3;  // sm: basis-1/3
    return 1; // mobile: basis-full (1 item)
  };

  // Check if scrolling is needed
  const checkScrollNeeded = () => {
    const itemsPerView = getItemsPerView();
    const needsScroll = continueGames.length > itemsPerView;
    setShowScrollArrows(needsScroll);
  };

  // Update scroll button states
  const updateScrollButtons = () => {
    if (!emblaApi) return;
    
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  };

  useEffect(() => {
    const update = () => {
      setSlidesToScroll(window.innerWidth < 640 ? 1 : "auto");
    };
  
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const loadContinueGames = async () => {
      if (!user || !user.user_id || !user.username) return;

      const storageKey = `continueGames_${user.username}`;
      const storedGames = localStorage.getItem(storageKey);
      
      if (storedGames) {
        try {
          const parsed = JSON.parse(storedGames);
          const sorted = parsed.sort(
            (a: ContinueGameData, b: ContinueGameData) =>
              new Date(b.lastPlayed).getTime() -
              new Date(a.lastPlayed).getTime()
          );
          setContinueGames(sorted);
        } catch (error) {
          console.error("Error parsing continue games:", error);
          // If parsing fails, try fetching from backend
          await fetchContinueGamesFromBackend();
        }
      } else {
        // If localStorage is empty, fetch from backend
        await fetchContinueGamesFromBackend();
      }
    };

    const fetchContinueGamesFromBackend = async () => {
      if (!user?.user_id || !user?.username || user?.isAnonymous) return;

      try {
        const continueGamesResponse = await GamesServices.getContinueGames(user.user_id);
        if (continueGamesResponse?.data?.status && continueGamesResponse?.data?.data) {
          const continueGames = continueGamesResponse.data.data.continuous_games || [];
          if (Array.isArray(continueGames) && continueGames.length > 0) {
            const sorted = continueGames.sort(
              (a: ContinueGameData, b: ContinueGameData) =>
                new Date(b.lastPlayed).getTime() -
                new Date(a.lastPlayed).getTime()
            );
            setContinueGames(sorted);
            // Store in localStorage for future use
            localStorage.setItem(`continueGames_${user.username}`, JSON.stringify(sorted));
          } else {
            setContinueGames([]);
          }
        } else {
          setContinueGames([]);
        }
      } catch (error) {
        console.error("Error fetching continue games from backend:", error);
        setContinueGames([]);
      }
    };

    loadContinueGames();
  }, [user]);

  // Helper function to get translated title
  const getTranslatedTitle = (game: ContinueGameData): string => {
    if (game.titleKey) {
      return t(game.titleKey);
    }
    return game.title || t('common.continuePlaying');
  };
  
  // Helper function to get translated description
  const getTranslatedDescription = (game: ContinueGameData): string => {
    if (game.descriptionKey) {
      return t(game.descriptionKey);
    }
    return game.description || '';
  };

  // Filter out games with missing required data
  const validGames = useMemo(() => {
    return continueGames.filter((game) => {
      return game && game.id && (game.title || game.titleKey) && game.lastPlayed;
    });
  }, [continueGames]);

  // Check scroll needed when games change or window resizes
  useEffect(() => {
    const itemsPerView = getItemsPerView();
    const needsScroll = validGames.length > itemsPerView;
    setShowScrollArrows(needsScroll);
    
    const handleResize = () => {
      const itemsPerView = getItemsPerView();
      const needsScroll = validGames.length > itemsPerView;
      setShowScrollArrows(needsScroll);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [validGames.length]);

  useEffect(() => {
    if (!emblaApi) {
      return;
    }

    // Update scroll buttons on embla events
    updateScrollButtons();
    emblaApi.on('select', updateScrollButtons);
    emblaApi.on('reInit', updateScrollButtons);

    // Use valid games count for autoplay
    const canAutoplay = validGames.length > 1;

    const playAutoplay = () => {
      if (canAutoplay && showScrollArrows) {
         autoplayTimerRef.current = setInterval(() => {
          emblaApi.scrollNext();
        }, AUTOPLAY_DELAY);
      }
    };

    const stopAutoplay = () => {
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current);
        autoplayTimerRef.current = null;
      }
    };

    const startOrResetResumeTimer = () => {
      clearTimeout(resumeAutoplayTimerRef.current!);
      resumeAutoplayTimerRef.current = setTimeout(() => {
        if (emblaApi.scrollSnapList().length > 0 && canAutoplay && showScrollArrows) {
          console.log("[ContinueCard] Resuming autoplay after 5s of inactivity.");
          playAutoplay(); 
        }
      }, RESUME_AUTOPLAY_DELAY);
    };

    const handleInteraction = () => {
      stopAutoplay(); 
      console.log("[ContinueCard] Interaction detected. Setting/Resetting resume timer.");
      startOrResetResumeTimer();
    };

    const handleMouseEnter = () => {
      stopAutoplay(); 
      clearTimeout(resumeAutoplayTimerRef.current!);
      console.log("[ContinueCard] Mouse entered. Autoplay stopped.");
    };

    const handleMouseLeave = () => {
      console.log("[ContinueCard] Mouse left. Starting resume timer.");
      startOrResetResumeTimer();
    };

    // Only start autoplay if scrolling is needed
    if (showScrollArrows) {
      playAutoplay();
    }

    const getSlidesToScroll = () => {
      const width = window.innerWidth;
      return width < 640 ? 1 : "auto";
    };
    
    emblaApi.on("pointerDown", handleInteraction);
    emblaApi.on("select", handleInteraction); 
    emblaApi.rootNode().addEventListener("mouseenter", handleMouseEnter);
    emblaApi.rootNode().addEventListener("mouseleave", handleMouseLeave);

    return () => {
      emblaApi.off("pointerDown", handleInteraction);
      emblaApi.off("select", handleInteraction);
      emblaApi.off('select', updateScrollButtons);
      emblaApi.off('reInit', updateScrollButtons);
      emblaApi.rootNode().removeEventListener("mouseenter", handleMouseEnter);
      emblaApi.rootNode().removeEventListener("mouseleave", handleMouseLeave);
      stopAutoplay();
      clearTimeout(resumeAutoplayTimerRef.current!);
    };
  }, [emblaApi, showScrollArrows]);

  const handleGameClick = (game: ContinueGameData) => {
    // addGameToContinue(user?.username, {
    //   id: game.id,
    //   title: game.title,
    //   description: game.description,
    //   imageUrl: game.imageUrl || '',
    //   gameType: game.gameType
    // });

    sendCustomEvent("game_card_click", {
      game_id: game.id,
      game_title: game.title,
      game_card_type: 'continue_card',
      user: user?.user_id || 'guest',
      domain: window.location.hostname,
    });

    const pathWithParams = (path: string) => `${path}${search ? `?${search}` : ""}`;
// console.log("Navigating to:", pathWithParams(`/games/${game.id}`));
    switch (game.id) {
      case "hangman":
        navigate(pathWithParams(`/games/hangman`));
        break;
      case "quiz":
        navigate(pathWithParams(`/games/quiz`));
        break;
      case "headline_scramble":
        navigate(pathWithParams(`/games/headline_scramble`));
        break;
      default:
        navigate(pathWithParams(`/games/${game.id}`));
    }
  };

  const getMinutesAgo = (lastPlayedISO: string): number => {
    const lastPlayed = new Date(lastPlayedISO);
    const now = new Date();
    return Math.floor((now.getTime() - lastPlayed.getTime()) / (1000 * 60));
  };

  const formatLastPlayed = (lastPlayedISO: string): string => {
    const minutesAgo = getMinutesAgo(lastPlayedISO);
    if (minutesAgo < 1) return t('common.justNow');
    if (minutesAgo === 1) return t('common.oneMinuteAgo');
    if (minutesAgo < 60) return t('common.minutesAgo', { count: minutesAgo });
    if (minutesAgo < 1440) {
      const hoursAgo = Math.floor(minutesAgo / 60);
      return hoursAgo === 1 ? t('common.oneHourAgo') : t('common.hoursAgo', { count: hoursAgo });
    }
    const daysAgo = Math.floor(minutesAgo / 1440);
    return daysAgo === 1 ? t('common.oneDayAgo') : t('common.daysAgo', { count: daysAgo });
  };

  // Don't show continue section for anonymous users or if no valid games
  if (!user || user.isAnonymous || validGames.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-6">
        <h3 className="text-xl font-semibold">{t('common.continuePlaying')}</h3>
      </div>

      <div className="relative">
        <Carousel
          opts={{
            align: "start",
            loop: validGames.length > 1 && showScrollArrows,
            dragFree: true,
            containScroll: "trimSnaps",
            slidesToScroll: slidesToScroll,
            duration: 25,
          }}
          setApi={setEmblaApi} 
          className="w-full"
        >
          {/* Conditionally render scroll arrows */}
          {showScrollArrows && (
            <>
              <CarouselPrevious 
                className={`absolute top-16 left-4 z-10 h-10 w-10 bg-white/50 backdrop-blur-sm border-black hover:bg-violet-100 translate-x-0 translate-y-0 text-black transition-opacity duration-200 ${
                  canScrollPrev ? 'opacity-100' : 'opacity-30 cursor-not-allowed'
                }`}
                disabled={!canScrollPrev}
              />
              <CarouselNext 
                className={`absolute top-16 right-4 z-10 h-10 w-10 bg-white/50 backdrop-blur-sm border-black hover:bg-violet-100 translate-x-0 translate-y-0 text-black transition-opacity duration-200 ${
                  canScrollNext ? 'opacity-100' : 'opacity-30 cursor-not-allowed'
                }`}
                disabled={!canScrollNext}
              />
            </>
          )}

          <CarouselContent className="-ml-2 md:-ml-4">
            {validGames.map((game) => (
              <CarouselItem
                key={`${game.id}-${game.lastPlayed}`}
                className="pl-2 md:pl-4 basis-full sm:basis-1/3 lg:basis-1/4 xl:basis-1/4"
              >
                <div
                  className="game-card bg-white dark:bg-gray-800 border border-[#E8E8E8] flex flex-col h-full cursor-pointer group transition-all duration-300 hover:shadow-md"
                  onClick={() => handleGameClick(game)}
                >
                  {/* Game Title and Image Row with Gray Background */}
                  <div className="bg-[#E5E5E5] dark:bg-[#000000] p-4 pb-0 flex items-center gap-4 min-h-[120px]">
                    {/* Game Image */}
                    <div className="w-24 h-24 flex-shrink-0 bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden p-[15px] rounded-t-[20px] rounded-b-none relative top-[15px]">
                      {game.imageUrl ? (
                        <img
                          src={game.imageUrl}
                          alt={game.title || 'Game'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            // Show placeholder if image fails
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = '<div class="w-full h-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-500 text-xs">No Image</div>';
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400 text-xs">
                          {game.title?.charAt(0).toUpperCase() || '?'}
                        </div>
                      )}
                    </div>
                    
                    {/* Game Title */}
                    <h2 className="text-[24px] font-black text-gray-900 dark:text-white flex-1 line-clamp-2">
                      {getTranslatedTitle(game)}
                    </h2>
                  </div>

                  {/* Game Description with Last Played */}
                  <div className="p-4 flex-1">
                    {/* <p className="text-[15px] leading-[25px] font-semibold text-gray-700 dark:text-gray-300 line-clamp-2 mb-2">
                      {game.description || t('common.continuePlaying')}
                    </p> */}
                    {/* Last Played Time */}
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 text-xs">
                      <Clock size={12} />
                      <span>{formatLastPlayed(game.lastPlayed)}</span>
                      {game.progress?.score !== undefined && (
                        <>
                          <span className="mx-1">•</span>
                          <div className="flex items-center gap-1">
                            <Trophy size={12} />
                            <span>{game.progress.score}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Play Now Button */}
                  <div className={`${isRTL ? 'pl-8' : 'pr-8'} pt-0 pb-0 flex justify-end`}>
                    <button
                      className="bg-black dark:bg-gray-900 text-white py-2.5 px-4 rounded-t-sm rounded-b-none text-sm font-medium flex items-center gap-2 hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGameClick(game);
                      }}
                    >
                      <span className="text-sm font-bold font-[700]">{t("common.playNow")}</span>
                      <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center font-bold font-[700]">
                        <svg
                          className={`w-3 h-3 text-white flex-shrink-0 ${isRTL ? '' : 'rotate-180'}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                      </div>
                    </button>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </div>
  );
};

export default ContinueSection;