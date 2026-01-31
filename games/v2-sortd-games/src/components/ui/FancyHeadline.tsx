import React from 'react';
import { useTranslation } from "react-i18next";

interface FancyHeadlineProps {
  children?: React.ReactNode;
}

const FancyHeadline: React.FC<FancyHeadlineProps> = ({ children }) => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  return (
    <>
    {isArabic ? (
      <div className="mb-4 text-right relative">
        <h3 className="inline-block border-r-[4px] border-[#C62426] text-slate-800 dark:text-white pr-4"
          style={{
            fontWeight: 900,
            fontSize: "18px",
            lineHeight: "100%",
            letterSpacing: "0%",
          }}
        >
          {children}
        </h3>
      </div>
    ) : (
    <div className="mb-4 text-left relative">
      <h3
        className="inline-block border-l-[4px] border-[#C62426] text-slate-800 dark:text-white pl-4"
        style={{
          fontWeight: 900,
          fontSize: "18px",
          lineHeight: "100%",
          letterSpacing: "0%",
        }}
      >
        {children}
      </h3>
    </div>
    )}
    </>
  );
};

export default FancyHeadline;