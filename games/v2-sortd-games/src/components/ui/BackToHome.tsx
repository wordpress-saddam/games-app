import React from 'react';
import { useNavigate } from 'react-router-dom';
import BackToHomeIconRed from '../../assets/back-to-home-icon-red.png';

const BackToHome: React.FC<{ text: string }> = ({ text }) => {

  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/")}
      className="flex items-center gap-3 font-extrabold text-[16px] text-[#C62426] bg-white border border-black px-4 py-1.5 rounded-md" dir="rtl"
      >
      <span>{text}</span>
      {/* Icon */}
      <img src={BackToHomeIconRed} alt="Home Icon" className="w-5 h-5" />
    </button>
  );
};

export default BackToHome;

