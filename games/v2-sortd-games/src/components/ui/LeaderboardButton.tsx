import React from 'react';
import LeaderboardIcon from '../../assets/leaderboard-icon.png';

const LeaderboardButton: React.FC<{ text: string, leaderboardUrl: string }> = ({ text, leaderboardUrl }) => {

  return (
    <button
      onClick={() => window.location.href = leaderboardUrl}
      className="
        inline-flex items-center gap-3
        px-4 py-2
        rounded-[8px]
        bg-gradient-to-r from-[#C62426] to-[#3F1313]
        text-white
        font-extrabold
        text-[16px]
        leading-none
        text-right
        shadow-md
      "
      dir="rtl"
    >
      <span className="whitespace-nowrap">
        {text}
      </span>
    
      <img
        src={LeaderboardIcon}
        alt="Trophy Icon"
        className="w-5 h-5"
      />
    </button> 
  );
};

export default LeaderboardButton;

