import React from 'react';
import { useNavigate } from 'react-router-dom';
import BackToHomeIconRed from '../../assets/back-to-home-icon-red.png';

const BackToHome: React.FC<{ text: string }> = ({ text }) => {

  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/")}
      className="flex items-center justify-center gap-2 md:gap-3 font-extrabold text-[12px] md:text-[16px] text-[#C62426] bg-white border border-black px-2 md:px-4 py-2 rounded-md w-full md:w-auto" dir="rtl"
      >
      <span>{text}</span>
      {/* Icon */}
      <img src={BackToHomeIconRed} alt="Home Icon" className="w-4 h-4 md:w-5 md:h-5" />
    </button>
  );
};

export default BackToHome;

