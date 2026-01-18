import React, { useState, useEffect, useRef } from "react";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import GamesServices from "../../v2-services/games-service";
import { useTranslation } from "react-i18next";

interface ContinueGameData {
  id: string;
  title: string;
  description?: string;
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
  const { t } = useTranslation();
  const [continueGames, setContinueGames] = useState<ContinueGameData[]>([]);
  const [searchParams] = useSearchParams();
  const game_id = searchParams.get('id');
  const [showScrollArrows, setShowScrollArrows] = useState(false);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

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
    if (width >= 1280) return 5; // xl: basis-1/5
    if (width >= 1024) return 4; // lg: basis-1/4
    if (width >= 640) return 3;  // sm: basis-1/3
    return 2; // basis-1/2
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

  // Check scroll needed when games change or window resizes
  useEffect(() => {
    checkScrollNeeded();
    
    const handleResize = () => {
      checkScrollNeeded();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [continueGames]);

  useEffect(() => {
    if (!emblaApi) {
      return;
    }

    // Update scroll buttons on embla events
    updateScrollButtons();
    emblaApi.on('select', updateScrollButtons);
    emblaApi.on('reInit', updateScrollButtons);

    const canAutoplay = continueGames.length > 1;

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

  // Don't show continue section for anonymous users
  if (!user || user.isAnonymous || continueGames.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-6">
        <h3 className="text-xl font-semibold">{t('common.continuePlaying')}</h3>
      </div>

      <div className="relative">
        <Carousel
          opts={{
            align: "start",
            loop: continueGames.length > 1 && showScrollArrows,
            dragFree: true,
            containScroll: "trimSnaps",
            slidesToScroll: "auto",
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
            {continueGames.map((game) => (
              <CarouselItem
                key={`${game.id}-${game.lastPlayed}`}
                className="pl-2 md:pl-4 basis-1/2 sm:basis-1/3 lg:basis-1/4 xl:basis-1/5"
              >
                <div
                  className="relative h-48 rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 hover:scale-105 hover:shadow-2xl border-2 border-primary/20"
                  onClick={() => handleGameClick(game)}
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundImage: `url(${game.imageUrl})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
                  <div className="relative h-full flex flex-col justify-between p-4">
                    {game.progress && (
                      <div className="flex justify-end">
                        <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1">
                          {game.progress.score !== undefined && (
                            <div className="flex items-center gap-1 text-white text-xs">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span aria-label="Leaderboard">
                                    <Trophy size={12} />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>Leaderboard</TooltipContent>
                              </Tooltip>
                              {game.progress.score}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="flex flex-col justify-between gap-4 h-full">
                      <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white/20 bg-black/20 backdrop-blur-sm flex-shrink-0">
                        <div
                          className="w-full h-full bg-cover bg-center"
                          style={{ backgroundImage: `url(${game.imageUrl})` }}
                        />
                      </div>
                      <div>
                        <h3 className="text-white text-lg font-bold tracking-wide drop-shadow-lg">
                          {game.title}
                        </h3>
                        <div className="flex items-center gap-1 text-white/80 text-xs mt--1">
                          <Clock size={12} />
                          {formatLastPlayed(game.lastPlayed)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                        <div className="w-0 h-0 border-l-[6px] border-l-black border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent ml-1"></div>
                      </div>
                    </div>
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