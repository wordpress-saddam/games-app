import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { addGameToContinue } from "./ContinueGamesUtils";
import { sendCustomEvent } from "../analytics/ga";
// import { getItem } from "../utils/localstorage";
import UserRegistrationDialog from "./UserRegistrationDialog";

interface GameCardProps {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  thumbnailUrl?: string;
  search?: string; // Add this line

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
}) => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [showDialog, setShowDialog] = useState(false);

  const navigateToGame = (userToUse: User) => {
    const userId = userToUse?.user_id || "anonymous";
    addGameToContinue(userToUse?.username, {
      id: id,
      title,
      description,
      imageUrl: imageUrl || '',
      gameType: 'static'
  }, userId);
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
        className="game-card relative h-48 rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 hover:scale-105 hover:shadow-2xl"
        onClick={handlePlayClick}
      >
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
          style={{ backgroundImage: `url(${imageUrl})` }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />

        <div className="relative h-full flex items-end p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white/20 bg-black/20 backdrop-blur-sm flex-shrink-0">
              <div
                className="w-full h-full bg-cover bg-center"
                style={{ backgroundImage: `url(${thumbnailUrl || imageUrl})` }}
              />
            </div>
            <div className="flex-1">
              <h2 className="text-white text-xl font-bold tracking-wide drop-shadow-lg">
                {title}
              </h2>
              {/* <p className="text-white font-semibold text-sm mt-1 line-clamp-2">
                {description}
              </p> */}
            </div>
          </div>
        </div>

        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
              <div className="w-0 h-0 border-l-[6px] border-l-black border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent ml-1"></div>
            </div>
          </div>
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
