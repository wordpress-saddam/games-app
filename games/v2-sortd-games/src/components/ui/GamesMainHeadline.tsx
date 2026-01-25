import React from 'react';

const GamesMainHeadline: React.FC<{ title: string, width?: number }> = ({ title, width = 120 }) => {

  return (
    <div className="flex games-main-headline-wrapper w-full">
      <div className="w-full mb-6">
        <h1 className="text-[40px] font-black text-black dark:text-white mb-2">
          {title}
        </h1>
        <div className="flex items-center w-full">
          {/* Divider aligned exactly with h1 start */}
            <div className="h-2 flex gap-1" style={{ width: `${width}px` }}>
            <div className="w-5 red-divider"></div>
            <div className="flex-1 bg-black"></div>
          </div>
          {/* Horizontal line */}
          <hr className="flex-1 border-b border-[#E8E8E8]" />
        </div>
      </div>
    </div>
  );
};

export default GamesMainHeadline;

