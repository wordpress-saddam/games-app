import React from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { useUserRegistration } from "../context/UserRegistrationContext";
import GamesServices from "../../v2-services/games-service";
import { addGameToContinue } from "./ContinueGamesUtils";
import { sendCustomEvent } from "../analytics/ga";
import { Clock, Trophy, Play } from "lucide-react";
import Quiz from "../assets/quiz.jpg";
import Hangman from "../assets/hangman.jpg";
import Scrumble from "../assets/scrumble.jpg";
import { useSiteConfig } from "../context/SiteConfigContext";
import { useTheme } from "../hooks/useTheme";

type GameCardVariant = "dynamic" | "static" | "continue";

interface GameCardProps {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  variant: GameCardVariant;
  section?: "featured" | "trending" | "continue";
  progress?: {
    score?: number;
    level?: number;
    completed?: boolean;
  };
  lastPlayed?: string;
}

const fallbackDynamicImages: Array<{ game_type: string; imageUrl: string }> = [
  { game_type: "headline_scramble", imageUrl: Scrumble },
  { game_type: "quiz", imageUrl: Quiz },
  { game_type: "hangman", imageUrl: Hangman },
];

function resolveRoute(id: string, variant: GameCardVariant): string {
  switch (id) {
    case "hangman":
    case "quiz":
    case "headline_scramble":
    case "custom_quiz":
      return `/games/${id}`;
    default:
      return variant === "dynamic" ? `/${id}` : `/games/${id}`;
  }
}

function formatLastPlayed(lastPlayedISO?: string): string | undefined {
  if (!lastPlayedISO) return undefined;
  const lastPlayed = new Date(lastPlayedISO);
  const now = new Date();
  const minutesAgo = Math.floor((now.getTime() - lastPlayed.getTime()) / (1000 * 60));
  if (minutesAgo < 1) return "Just now";
  if (minutesAgo === 1) return "1 minute ago";
  if (minutesAgo < 60) return `${minutesAgo} minutes ago`;
  if (minutesAgo < 1440) {
    const hoursAgo = Math.floor(minutesAgo / 60);
    return hoursAgo === 1 ? "1 hour ago" : `${hoursAgo} hours ago`;
  }
  const daysAgo = Math.floor(minutesAgo / 1440);
  return daysAgo === 1 ? "1 day ago" : `${daysAgo} days ago`;
}

const GameCard: React.FC<GameCardProps> = ({
  id,
  title,
  description,
  imageUrl,
  thumbnailUrl,
  variant,
  progress,
  lastPlayed,
  section,
}) => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { openRegistrationDialog } = useUserRegistration();
  const { config: uiConfig } = useSiteConfig();

  const cardStyle = uiConfig?.homepageLayout?.cardStyle as
    | undefined
    | {
        size?: string;
        corners?: string;
        showOverlay?: boolean;
        backgroundColor?: string;
        titleColor?: string;
        descriptionColor?: string;
        progressBarColor?: string;
        customImageUrl?: string;
        defaultLayout?: {
          thumbnailPosition?: "Left" | "Right" | "Top" | "Bottom";
          textPosition?: "Above" | "Below";
          textSize?: "Small" | "Medium" | "Large";
          headingColor?: string;
          descriptionColor?: string;
          textColor?: string;
          // new theme-aware overrides
          headingColorLight?: string;
          headingColorDark?: string;
          descriptionColorLight?: string;
          descriptionColorDark?: string;
          textColorLight?: string;
          textColorDark?: string;
        };
        imageTopLayout?: {
          panelBackgroundColor?: string;
          panelTextColor?: string;
          showDescription?: boolean;
          playButtonStyle?: "IconOnly" | "TextButton" | "Hidden";
        };
        spotlightLayout?: {
          showScore?: boolean;
          showLastPlayed?: boolean;
          titleColor?: string; // legacy
          // theme-aware properties
          titleColorLight?: string;
          titleColorDark?: string;
          lastPlayedColorLight?: string;
          lastPlayedColorDark?: string;
          overlayGradient?: string;
        };
      };

  const heightClassFromHuman = (() => {
    const value = cardStyle?.size;
    if (!value) return undefined;
    const map: Record<string, string> = {
      Small: "h-40",
      Medium: "h-48",
      Large: "h-56",
    };
    return map[value] || undefined;
  })();

  const radiusClassFromHuman = (() => {
    const value = cardStyle?.corners;
    if (!value) return undefined;
    const map: Record<string, string> = {
      "Slightly Rounded": "rounded-xl",
      "Rounded": "rounded-2xl",
      "Very Rounded": "rounded-3xl",
    };
    return map[value] || undefined;
  })();

  const finalHeightClass = heightClassFromHuman || "h-48";
  const finalRadiusClass = radiusClassFromHuman || "rounded-2xl";
  const overlayEnabled = cardStyle?.showOverlay !== false;
  const sectionLayout = (() => {
    if (section === "continue") return (uiConfig?.homepageLayout as any)?.continue?.cardLayout as string | undefined;
    if (section === "featured") return (uiConfig?.homepageLayout as any)?.featured?.cardLayout as string | undefined;
    if (section === "trending") return (uiConfig?.homepageLayout as any)?.trending?.cardLayout as string | undefined;

    // if (variant === "continue") return (uiConfig?.homepageLayout as any)?.continue?.cardLayout as string | undefined;
    // if (variant === "dynamic") return (uiConfig?.homepageLayout as any)?.featured?.cardLayout as string | undefined;
    // return (uiConfig?.homepageLayout as any)?.trending?.cardLayout as string | undefined;
  })();
  const layoutStyle = (sectionLayout as "OverlayLayout" | "ImageTopLayout" | "SpotlightLayout" | undefined) || "OverlayLayout";
  const defaultLayoutCfg = cardStyle?.defaultLayout || {};
  const imageTopCfg = cardStyle?.imageTopLayout || {};
  const spotlightCfg = cardStyle?.spotlightLayout || {};

  const resolvedImage = (() => {
    if (imageUrl) return imageUrl;
    if (variant === "dynamic") {
      const found = fallbackDynamicImages.find((g) => g.game_type === id)?.imageUrl;
      return found || "";
    }
    return "";
  })();

  const doNavigate = async (userName: string, userId?: string) => {
    // Add to continue list for all variants
    addGameToContinue(userName, {
      id,
      title,
      description,
      imageUrl: resolvedImage || imageUrl || "",
      gameType: variant,
    } as any, userId);

    // Analytics
    const typeForAnalytics = variant === "continue" ? "continue_card" : variant;
    sendCustomEvent("game_card_click", {
      game_id: id,
      game_title: title,
      game_card_type: typeForAnalytics,
      user: userId || "anonymous",
      domain: window.location.hostname,
    });

    // Prefetch for dynamic
    if (variant === "dynamic") {
      try {
        await GamesServices.getGame(id);
      } catch (e) {
        // fail-soft: still navigate
      }
    }

    const path = resolveRoute(id, variant);
    navigate(path);
  };

  const handleClick = () => {
    if (user) {
      doNavigate(user.username, user.user_id);
    } else {
      openRegistrationDialog((newUser: { username: string }) => {
        doNavigate(newUser.username);
      });
    }
  };

  

  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  if (layoutStyle === "ImageTopLayout") {
    const panelBg = imageTopCfg.panelBackgroundColor || "#ffffff"; // light background
    const panelText = imageTopCfg.panelTextColor || (isDarkMode ? "#FFFFFF" : "#000000"); // theme-aware
    const showDesc = imageTopCfg.showDescription !== false;
    const playStyle = imageTopCfg.playButtonStyle || "IconOnly";
    return (
      <div
        className={`game-card relative ${finalHeightClass} ${finalRadiusClass} overflow-hidden cursor-pointer group transition-all duration-300 hover:scale-105 hover:shadow-2xl`}
        onClick={handleClick}
      >
        <div className="relative h-full flex flex-col">
          <div className="relative flex-[7] basis-0">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
              style={{ backgroundImage: `url(${resolvedImage || imageUrl})` }}
            />
            {overlayEnabled && (
              <div
                className="absolute inset-0"
                style={{
                  background:
                    (uiConfig?.brand?.colors?.cardOverlay as string) ||
                    "linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0.2), transparent)",
                }}
              />
            )}
          </div>
          <div
            className="flex-[3] basis-0 p-4 flex items-center justify-between gap-3"
            style={{ backgroundColor: panelBg, color: panelText }}
          >
            <div className="min-w-0">
              <h3 className="font-bold truncate" style={{ color: panelText }}>{title}</h3>
              {showDesc && description && (
                <p className="text-sm line-clamp-2" style={{ color: panelText }}>{description}</p>
              )}
            </div>
            {playStyle !== "Hidden" && (
              playStyle === "TextButton" ? (
                <div className="shrink-0 bg-primary text-white text-sm px-3 py-1.5 rounded-full">Play</div>
              ) : (
                <div className="shrink-0 bg-white/20 backdrop-blur-sm rounded-full p-2">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <Play size={14} className="text-black" />
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    );
  }

  if (layoutStyle === "SpotlightLayout") {
    const titleClr = (isDarkMode ? (spotlightCfg as any).titleColorDark : (spotlightCfg as any).titleColorLight) || spotlightCfg.titleColor || "#FFFFFF";
    const overlayCss = spotlightCfg.overlayGradient || (uiConfig?.brand?.colors?.cardOverlay as string) ||
      "linear-gradient(to right, rgba(0,0,0,0.8), rgba(0,0,0,0.5), transparent)";
    const showScore = spotlightCfg.showScore !== false && variant === "continue" && progress && typeof progress.score !== "undefined";
    const showLast = spotlightCfg.showLastPlayed !== false && variant === "continue" && !!lastPlayed;
    const lastPlayedText = showLast ? formatLastPlayed(lastPlayed) : undefined;
    const lastPlayedClr = (isDarkMode ? (spotlightCfg as any).lastPlayedColorDark : (spotlightCfg as any).lastPlayedColorLight) || "#CCCCCC";
    return (
      <div
        className={`relative ${finalHeightClass} ${finalRadiusClass} overflow-hidden cursor-pointer group transition-all duration-300 hover:scale-105 hover:shadow-2xl`}
        onClick={handleClick}
      >
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
          style={{ backgroundImage: `url(${resolvedImage || imageUrl})` }}
        />
        <div className="absolute inset-0" style={{ background: overlayCss }} />
        {showScore && (
          <div className="absolute top-3 left-3 bg-white/20 backdrop-blur-sm rounded-lg px-2 py-1 z-10">
            <div className="flex items-center gap-1 text-white text-xs">
              <Trophy size={12} />
              {progress!.score}
            </div>
          </div>
        )}
        <div className="relative h-full flex flex-col justify-between p-4">
          <div className="flex justify-end">
            {/* reserved */}
          </div>
          <div className="flex flex-col justify-between gap-4 h-full">
            <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white/20 bg-black/20 backdrop-blur-sm flex-shrink-0">
              <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${thumbnailUrl || resolvedImage || imageUrl})` }} />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-wide drop-shadow-lg" style={{ color: titleClr }}>{title}</h3>
              {lastPlayedText && (
                <div className="flex items-center gap-1 text-xs mt--1" style={{ color: lastPlayedClr }}>
                  <Clock size={12} />
                  {lastPlayedText}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <div className="w-0 h-0 border-l-[6px] border-l-black border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent ml-1" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Overlay layout (default)
  const thumbPos = (defaultLayoutCfg.thumbnailPosition as any) || "Left";
  const textPos = (defaultLayoutCfg.textPosition as any) || "Below";
  const textSize = (defaultLayoutCfg.textSize as any) || "Medium";
  const headingColor = (isDarkMode ? (defaultLayoutCfg as any).headingColorDark : (defaultLayoutCfg as any).headingColorLight) || defaultLayoutCfg.headingColor || "#000000";
  const descriptionColor = (isDarkMode ? (defaultLayoutCfg as any).descriptionColorDark : (defaultLayoutCfg as any).descriptionColorLight) || defaultLayoutCfg.descriptionColor || "#000000";
  const textColor = (isDarkMode ? (defaultLayoutCfg as any).textColorDark : (defaultLayoutCfg as any).textColorLight) || defaultLayoutCfg.textColor || "#000000";
  const titleSizeClass = (() => {
    switch (textSize) {
      case "Small":
        return "text-base";
      case "Large":
        return "text-2xl";
      default:
        return "text-xl";
    }
  })();
  const wrapperAlignClass = (thumbPos === "Left" || thumbPos === "Right")
    ? (textPos === "Above" ? "items-start" : "items-end")
    : "items-end";
  const isRow = thumbPos === "Left" || thumbPos === "Right";

  return (
    <div
      className={`game-card relative ${finalHeightClass} ${finalRadiusClass} overflow-hidden cursor-pointer group transition-all duration-300 hover:scale-105 hover:shadow-2xl`}
      onClick={handleClick}
    >
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
        style={{ backgroundImage: `url(${resolvedImage || imageUrl})` }}
      />

      {overlayEnabled && (
        <div
          className="absolute inset-0"
          style={{
            background:
              (uiConfig?.brand?.colors?.cardOverlay as string) ||
              "linear-gradient(to right, rgba(0,0,0,0.8), rgba(0,0,0,0.5), transparent)",
          }}
        />
      )}

      <div className={`relative h-full flex ${wrapperAlignClass} p-6`} style={{ color: textColor }}>
        <div className={`${isRow ? "flex flex-row" : "flex flex-col"} items-center gap-4 w-full`}>
          {/* Order according to thumbnailPosition */}
          {(thumbPos === "Left" || thumbPos === "Top") ? (
            <>
              <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white/20 bg-black/20 backdrop-blur-sm flex-shrink-0">
                <div
                  className="w-full h-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${thumbnailUrl || resolvedImage || imageUrl})` }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className={`text-white ${titleSizeClass} font-bold tracking-wide drop-shadow-lg`} style={{ color: headingColor }}>
                  {title}
                </h2>
                {/* Optional description for default layout if provided */}
                {description && (
                  <p className="text-sm line-clamp-2" style={{ color: descriptionColor }}>{description}</p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex-1 min-w-0">
                <h2 className={`text-white ${titleSizeClass} font-bold tracking-wide drop-shadow-lg`} style={{ color: headingColor }}>
                  {title}
                </h2>
                {description && (
                  <p className="text-sm line-clamp-2" style={{ color: descriptionColor }}>{description}</p>
                )}
              </div>
              <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white/20 bg-black/20 backdrop-blur-sm flex-shrink-0">
                <div
                  className="w-full h-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${thumbnailUrl || resolvedImage || imageUrl})` }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
            <div className="w-0 h-0 border-l-[6px] border-l-black border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent ml-1" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameCard;


