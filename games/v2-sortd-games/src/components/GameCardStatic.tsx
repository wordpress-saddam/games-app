import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { addGameToContinue } from "./ContinueGamesUtils";
import { sendCustomEvent } from "../analytics/ga";
import { useTranslation } from "react-i18next";
// import { getItem } from "../utils/localstorage";
import UserRegistrationDialog from "./UserRegistrationDialog";

interface GameCardProps {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  thumbnailUrl?: string;
  search?: string; // Add this line
  translationKey?: string; // Translation key for i18n support
}

interface User {
  username: string;
  user_id?: string
}

const GameCardStatic: React.FC<GameCardProps> = ({
  id,
  title,
  description,
  imageUrl,
  thumbnailUrl,
  search,
  translationKey,
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  const { user } = useUser();
  const [showDialog, setShowDialog] = useState(false);

  const navigateToGame = (userToUse: User) => {
    const userId = userToUse?.user_id || "anonymous";
    
    // Store translation keys instead of translated text for language support
    const gameData: any = {
      id: id,
      imageUrl: imageUrl || '',
      gameType: 'static'
    };
    
    // If translationKey is available, store it; otherwise store the translated text as fallback
    if (translationKey) {
      gameData.titleKey = `games.${translationKey}.name`;
      gameData.descriptionKey = `games.${translationKey}.description`;
    } else {
      // Fallback: store the translated text if no translation key is available
      gameData.title = title;
      gameData.description = description;
    }
    
    addGameToContinue(userToUse?.username, gameData, userId);
    sendCustomEvent("game_card_click", {
      game_id: id,
      game_title: title,
      game_card_type: 'static',
      user: userId,
      domain: window.location.hostname,
    });

    navigate(`/games/${id}${search ? `?${search}` : ""}`);
  };

  const handlePlayClick = () => {
    if (user) {
      navigateToGame(user);
    } else {
      setShowDialog(true);
    }
  };

  const handleUserRegistrationSuccess = (newUser: { username: string }) => {
    navigateToGame(newUser);
  };

  return (
    <>
      <div
        className="game-card bg-white dark:bg-gray-800 border border-[#E8E8E8] flex flex-col h-full cursor-pointer group transition-all duration-300 hover:shadow-md"
        onClick={handlePlayClick}
      >
        {/* Game Title and Image Row with Gray Background */}
        <div className="bg-[#E5E5E5] dark:bg-[#000000] p-4 pb-0 flex items-center gap-4">
          {/* Game Image */}
          <div className="w-32 h-32 flex-shrink-0 bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden p-[15px] rounded-t-[20px] rounded-b-none
                relative top-[15px]">
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
          
          {/* Game Title */}
          <h2 className="text-[28px] font-black text-gray-900 dark:text-white flex-1">
            {title}
          </h2>
        </div>

        {/* Game Description */}
        <div className="p-4 flex-1">
          <p className="text-[15px] leading-[25px] font-semibold text-gray-700 dark:text-gray-300 line-clamp-3">
            {description}
          </p>
        </div>


        {/* Play Now Button - Smaller */}
        <div className={`${isRTL ? 'pl-8' : 'pr-8'} pt-0 pb-0 flex justify-end`}>
          <button
            className="bg-black dark:bg-gray-900 text-white py-2.5 px-4 rounded-t-sm rounded-b-none text-sm font-medium flex items-center gap-2 hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              handlePlayClick();
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

      <UserRegistrationDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        onSuccess={handleUserRegistrationSuccess}
      />
    </>
  );
};

export default GameCardStatic;
