import React, { useEffect, useState, useMemo, useRef } from "react";
import Layout from "../components/Layout";
import GameCardStatic from "../components/GameCardStatic";
import GamesServices from "../../v2-services/games-service";
import { useIsMobile } from "../hooks/use-mobile";
import { sendPageView } from "../analytics/ga";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import ContinueSection from "../components/ContinueCard";
import { useUser } from "../context/UserContext";
import type { UseEmblaCarouselType } from "embla-carousel-react"; // Changed to UseEmblaCarouselType
import { useIsFetching } from "@tanstack/react-query";
import MostReadSidebar from "../components/MostReadSidebar";
import Flappy from "../assets/Flappy.jpg";
import Sudoku from "../assets/tile-merge.png";
import Tetris from "../assets/tetris.jpg";
import Letter5 from "../assets/letter5.jpg"
import Memory from "../assets/card-pair.png"
import Snake from "../assets/hungry-trail.png"
import Xox from "../assets/xox.png"
import Game2048 from "../assets/tile-merge.png";
import ScrambleArabic from "../assets/headline-scramble.png";
import Mines from "../assets/mine-hunt.png"
import Crossword_arabic from "../assets/crossword.png";
import HangmanNew from "../assets/hangman.png";
import quiz_arabic from "../assets/quiz.png";
import GamesMainHeadline from "../components/ui/GamesMainHeadline";
import DotsLink from "../assets/dots-link.png";
import Ludo from "../assets/ludo.png";
import Chess from "../assets/chess.png";

const arabicDomains = [
  "asharqgames-uat.sortd.pro",
  "localhost",
  "gameshub.asharq.site",
  "d1zlbrrs4aqnhr.cloudfront.net",
];

// Base games data structure (without translations)
const gamesDataBase = [
  {
    game_id: "7b8d3e24-1d8f-4f5f-b27c-09f3c9ef1234",
    game_type: "xox",
    translationKey: "xox",
    imageUrl: Xox
  },
  {
    game_id: "c12d8bc0-2e0b-4b3f-8c10-9ff2e2a9a456",
    game_type: "hungry-trail",
    translationKey: "hungryTrail",
    imageUrl: Snake
  },
  {
    game_id: "0f4ecb22-914b-4c4b-993d-f65a6e6ecbd0",
    game_type: "card-pair-challenge",
    translationKey: "cardPairChallenge",
    imageUrl: Memory
  },
  {
    game_id: "5c693dd4-0af5-4b9b-8bb1-1d1017257fd1",
    game_type: "sudoku",
    translationKey: "sudoku",
    imageUrl: Sudoku
  },
  {
    game_id: "ae8f3c9b-e22e-45a9-94cb-826f3497f993",
    game_type: "tile-merge",
    translationKey: "tileMerge",
    imageUrl: Game2048
  },
  // {
  //   game_id: "26e13b67-725d-4c41-b82e-c02be550f67a",
  //   game_type: "5-letter",
  //   translationKey: "fiveLetter",
  //   imageUrl: Letter5
  // },
  {
    game_id: "8343eabd-0072-4bd0-8fd4-e219d3f5a1f3",
    game_type: "sky-hopper",
    translationKey: "skyHopper",
    imageUrl: Flappy
  },
  {
    game_id: "2e938a61-bf9e-4af6-a0b6-96184c799ad2",
    game_type: "block-drop",
    translationKey: "blockDrop",
    imageUrl: Tetris
  },
  {
    game_id: "d52f0dc7-1966-4a4e-bc89-f4e671c8a7cb",
    game_type: "mine-hunt",
    translationKey: "mineHunt",
    imageUrl: Mines
  },
  {
    game_id: "d52f0dc7-1966-4a4e-bc89-f4e671c8a7cb",
    game_type: "dots-link",
    translationKey: "dotsLink",
    imageUrl: DotsLink
  },
  {
    game_id: "d52f0dc7-1966-4a4e-bc89-f4e671c8a7cb",
    game_type: "ludo",
    translationKey: "ludo",
    imageUrl: Ludo
  },
  {
    game_id: "d52f0dc7-1966-4a4e-bc89-f4e671c8a7cb",
    game_type: "chess",
    translationKey: "chess",
    imageUrl: Chess
  },
];

const currentHost = window.location.hostname;


const arabicGamesDataBase = [
  {
    game_id: "hangman-arabic-id",
    game_type: "hangman-arabic",
    translationKey: "hangman",
    imageUrl: HangmanNew,
  },
  {
    game_id: "crossword-arabic-id",
    game_type: "crossword",
    translationKey: "crossword",
    imageUrl: Crossword_arabic,
  },
  {
    game_id: "headline-scramble-arabic-id",
    game_type: "headline_scramble_arabic",
    translationKey: "headlineScramble",
    imageUrl: ScrambleArabic,
  },
  {
    game_id: "quiz_arabic",
    game_type: "quiz",
    translationKey: "quiz",
    imageUrl: quiz_arabic,
  },
]

// Cache object to store fetched games data
const gamesCache = {
  data: null,
  timestamp: null,
  isLoading: false,
};

// Cache expiry time (optional - set to 5 minutes)
const CACHE_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds

const Index = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { user } = useUser();
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAllTrending, setShowAllTrending] = useState(true);
  // States and refs for Featured Games carousel autoplay
  const isArabicDomain = useMemo(() => {
    return arabicDomains.includes(currentHost);
  }, []);

  // Create translated games data
  const gamesData = useMemo(() => {
    return gamesDataBase.map(game => ({
      ...game,
      display_name: t(`games.${game.translationKey}.name`),
      desc: t(`games.${game.translationKey}.description`),
    }));
  }, [t]);

  // Create translated Arabic games data
  const arabicGamesData = useMemo(() => {
    return arabicGamesDataBase.map(arabicGame => ({
      ...arabicGame,
      display_name: t(`games.${arabicGame.translationKey}.name`),
      desc: t(`games.${arabicGame.translationKey}.description`),
    }));
  }, [t]);

  const filteredGamesData = useMemo(() => {
    if (isArabicDomain) {
      const arabicGameTypes = arabicGamesData.map(game => game.game_type);
      return gamesData.filter(game => !arabicGameTypes.includes(game.game_type));
    }
    return gamesData;
  }, [isArabicDomain, gamesData]);
  const [featuredGamesApi, setFeaturedGamesApi] = useState<UseEmblaCarouselType[1] | undefined>(); // Changed type and to get API instance
  const featuredAutoplayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const featuredResumeAutoplayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const AUTOPLAY_DELAY = 1000; // 2 seconds
  const RESUME_AUTOPLAY_DELAY = 5000; // 5 seconds
  const scrollPositionRef = useRef(0);
  // Save scroll position before component unmounts
  useEffect(() => {
    sendPageView("/");
  }, []);

  // Memoized function to check cache validity
  const isCacheValid = useMemo(() => {
    if (!gamesCache.data || !gamesCache.timestamp) return false;

    // Optional: Check if cache has expired
    const now = Date.now();
    return now - gamesCache.timestamp < CACHE_EXPIRY_TIME;
  }, []);

  // Fetch games with caching logic
  useEffect(() => {
    const fetchGames = async () => {
      // If we have valid cached data, use it
      if (isCacheValid && gamesCache.data) {
        setGames(gamesCache.data);
        return;
      }

      // If already loading (another instance), wait for it
      if (gamesCache.isLoading) {
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        gamesCache.isLoading = true;

        const gamesResponse = await GamesServices.getGameConfig();
        console.log("gamesResponse for getGameConfig", gamesResponse);
        if (gamesResponse && gamesResponse.status) {
          const fetchedGames = gamesResponse.data || [];

          // Update cache
          gamesCache.data = fetchedGames;
          gamesCache.timestamp = Date.now();

          // Update state
          setGames(fetchedGames);
        } else {
          throw new Error(t("common.invalidResponseFormat"));
        }
      } catch (error) {
        console.error("Error fetching games:", error);
        setError(error.message || t("common.failedToFetchGames"));

        // If cache exists but expired, use it as fallback
        if (gamesCache.data) {
          setGames(gamesCache.data);
        }
      } finally {
        setIsLoading(false);
        gamesCache.isLoading = false;
      }
    };

    fetchGames();
  }, [isCacheValid]);
  console.log("games : ", games);
  const gamesSections = useMemo(() => {
    // const firstStaticGames = filteredGamesData.slice(0, 1);
    // const last = filteredGamesData.slice(1);
    const last = filteredGamesData;
    return {
      dynamicGames: games,
      // dynamicGames: [],
      // firstStaticGames,
      last,
    };
  }, [games, filteredGamesData]);

  // Autoplay logic for Featured Games Carousel
  useEffect(() => {
    if (!featuredGamesApi) {
      return;
    }

    // const canAutoplay = gamesSections.dynamicGames.length + gamesSections.firstStaticGames.length + gamesSections.last.length > 1;
    const canAutoplay = gamesSections.dynamicGames.length + gamesSections.last.length > 1;

    const playAutoplay = () => {
      if (canAutoplay) {
        stopAutoplay(); // Clear existing before starting new
        featuredAutoplayTimerRef.current = setInterval(() => {
          featuredGamesApi.scrollNext();
        }, AUTOPLAY_DELAY);
      }
    };

    const stopAutoplay = () => {
      if (featuredAutoplayTimerRef.current) {
        clearInterval(featuredAutoplayTimerRef.current);
        featuredAutoplayTimerRef.current = null;
      }
    };

    const startOrResetResumeTimer = () => {
      if (featuredResumeAutoplayTimerRef.current) {
        clearTimeout(featuredResumeAutoplayTimerRef.current);
      }
      featuredResumeAutoplayTimerRef.current = setTimeout(() => {
        if (featuredGamesApi.scrollSnapList().length > 0 && canAutoplay) {
          //console.log("[IndexPage - Featured] Resuming autoplay after 5s of inactivity.");
          playAutoplay();
        }
      }, RESUME_AUTOPLAY_DELAY);
    };

    const handleInteraction = () => {
      stopAutoplay();
      //console.log("[IndexPage - Featured] Interaction detected. Setting/Resetting resume timer.");
      startOrResetResumeTimer();
    };

    const handleMouseEnter = () => {
      stopAutoplay();
      if (featuredResumeAutoplayTimerRef.current) clearTimeout(featuredResumeAutoplayTimerRef.current);
      //console.log("[IndexPage - Featured] Mouse entered. Autoplay stopped.");
    };

    const handleMouseLeave = () => {
      //console.log("[IndexPage - Featured] Mouse left. Starting resume timer.");
      startOrResetResumeTimer();
    };

    playAutoplay();

    featuredGamesApi.on("pointerDown", handleInteraction);
    featuredGamesApi.on("select", handleInteraction);
    featuredGamesApi.rootNode().addEventListener("mouseenter", handleMouseEnter);
    featuredGamesApi.rootNode().addEventListener("mouseleave", handleMouseLeave);

    return () => {
      featuredGamesApi.off("pointerDown", handleInteraction);
      featuredGamesApi.off("select", handleInteraction);
      featuredGamesApi.rootNode().removeEventListener("mouseenter", handleMouseEnter);
      featuredGamesApi.rootNode().removeEventListener("mouseleave", handleMouseLeave);
      stopAutoplay();
      if (featuredResumeAutoplayTimerRef.current) clearTimeout(featuredResumeAutoplayTimerRef.current);
    };
  }, [featuredGamesApi, gamesSections.dynamicGames, gamesSections.last]); // Re-run if API or game counts change


  function getGreeting() {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      return t("greetings.goodMorning");
    } else if (hour >= 12 && hour < 17) {
      return t("greetings.goodAfternoon");
    } else if (hour >= 17 && hour < 21) {
      return t("greetings.goodEvening");
    } else {
      return t("greetings.goodNight");
    }
  }


  const greet = getGreeting();
  return (
    <Layout>
      <section className="py-8">
        <div className="container mx-auto px-4">
          {/* Page Title */}
          {/* <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t("common.h1tagline")}
            </h1>
            <div className="w-24 h-1 bg-red-600 mx-auto"></div>
          </div> */}

          {/* Greeting */}
          {user?.username && (
            <div className="mb-8">
              <h2 className="text-xl lg:text-2xl leading-snug font-serif italic text-gray-600 dark:text-gray-400">
                {greet}{" "}
                <span className="text-xl lg:text-2xl font-semibold dark:text-white">
                  {user?.username}
                </span>
              </h2>
            </div>
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div className="text-center mb-6">
              <p className="text-lg">{t("common.loadingGames")}</p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="text-center mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              <p>{t("common.error")}: {error}</p>
            </div>
          )}

          {/* Continue Playing Section */}
          <ContinueSection search={searchParams.toString()} />

          {/* Main Content: Games Grid + Most Read Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            {/* Games Grid - Takes 2 columns on large screens */}
            <div className="lg:col-span-2">
              {/* Featured Games Section */}
              {isArabicDomain && (
                <div className="mb-8">
                  <GamesMainHeadline title={t("common.games")} width={isRTL ? 120 : 144} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {arabicGamesData.map((game) => (
                      <GameCardStatic
                        key={game.game_type}
                        id={game.game_type}
                        title={game.display_name}
                        description={game?.desc}
                        imageUrl={game.imageUrl}
                        search={searchParams.toString()}
                        translationKey={game.translationKey}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Trending Games Section */}
              <div className="mb-8">
                {/* <div className="mb-6">
                  <h3 className="text-2xl font-black text-black dark:text-white mb-2">
                    {t("common.trendingGames")}
                  </h3>
                  <div className={`h-1 flex ${isRTL ? 'flex-row' : 'flex-row-reverse'}`}>
                    <div className="flex-1 bg-black"></div>
                    <div className="w-16 bg-red-600"></div>
                  </div>
                </div> */}

                {showAllTrending ? (
                  // Grid view - 2 columns
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {gamesSections.last.map((game) => (
                      <GameCardStatic
                        key={game.game_type}
                        id={game.game_type}
                        title={game.display_name}
                        description={game?.desc}
                        imageUrl={game.imageUrl}
                        search={searchParams.toString()}
                        translationKey={game.translationKey}
                      />
                    ))}
                  </div>
                ) : (
                  // Carousel view
                  <Carousel
                    opts={{
                      align: "start",
                      loop: true,
                    }}
                    className="w-full"
                  >
                    <CarouselContent className="-ml-2 md:-ml-4">
                      {gamesSections.last.map((game) => (
                        <CarouselItem
                          key={game.game_type}
                          className="pl-2 md:pl-4 basis-full sm:basis-1/2"
                        >
                          <GameCardStatic
                            id={game.game_type}
                            title={game.display_name}
                            description={game?.desc}
                            imageUrl={game.imageUrl}
                            search={searchParams.toString()}
                            translationKey={game.translationKey}
                          />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="hidden md:flex" />
                    <CarouselNext className="hidden md:flex" />
                  </Carousel>
                )}
              </div>
            </div>

            {/* Most Read Sidebar - Takes 1 column on large screens */}
            <div className="lg:col-span-1">
              <MostReadSidebar />
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
