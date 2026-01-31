import React from 'react';
import LeaderboardIcon from '../../assets/leaderboard-icon.png';

const LeaderboardButton: React.FC<{ text: string, leaderboardUrl: string }> = ({ text, leaderboardUrl }) => {

  return (
    <button
      onClick={() => window.location.href = leaderboardUrl}
      className="
        inline-flex 
        items-center 
        justify-center 
        gap-2 md:gap-3 
        px-2 md:px-4 py-2 
        rounded-[8px] 
        bg-gradient-to-r from-[#C62426] to-[#3F1313] 
        text-white 
        font-extrabold 
        text-[12px] md:text-[16px] 
        leading-none 
        shadow-md 
        w-full 
        md:w-auto
      "
      dir="rtl"
    >
      <span className="whitespace-nowrap">
        {text}
      </span>
    
      <img
        src={LeaderboardIcon}
        alt="Trophy Icon"
        className="w-4 h-4 md:w-5 md:h-5"
      />
    </button> 
  );
};

export default LeaderboardButton;

