import React from 'react';
import { useTranslation } from 'react-i18next';

const HowToPlayInstruction: React.FC<{ title: string, text: string, children: React.ReactNode }> = ({ title, text, children }) => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  return (
    <div
      className="
        bg-gradient-to-b from-[#3F1313] to-[#C62426]
        rounded-[5px]
        p-4
        text-white
      "
      dir={isArabic ? "rtl" : "ltr"}
    >
        {title && (
          <h2 className="text-[28px] font-bold mb-3">
            {title}
          </h2>
        )}

      {text && (
        <p className="text-[16px]">
          {text}
        </p>
      )}
      {children && (
        <div className={`color-white ${isArabic ? "pr-5" : "pl-5"}`}>
          {children}
        </div>
      )}
    </div>
  );
};

export default HowToPlayInstruction;