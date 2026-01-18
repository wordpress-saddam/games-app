
import React from 'react';

type AdSize = 'banner' | 'square' | 'sidebar';
type AdPosition = 'top' | 'middle' | 'bottom' | 'side';

interface AdComponentProps {
  size?: AdSize;
  position?: AdPosition;
  id?: string;
  className?: string;
}

const AdComponent: React.FC<AdComponentProps> = ({
  size = 'banner',
  position = 'top',
  id = 'ad-space',
  className = ''
}) => {
  // Size mapping (height could be adjusted)
  const sizeMap = {
    banner: 'h-24 md:h-32 w-full',
    square: 'h-64 w-64',
    sidebar: 'h-96 w-full md:w-64'
  };

  const getAdIcon = () => {
    // Rotate between different ad-related icons
    const icons = [
      <svg key="ad" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-ad"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M13 15a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M15 9h.01"/><path d="M9 15h.01"/></svg>,
      <svg key="megaphone" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-megaphone"><path d="m3 11 18-5v12L3 13"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>,
      <svg key="dollar" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-badge-dollar-sign"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>
    ];
    
    // Use position to determine which icon to show
    const iconIndex = position === 'top' ? 0 : position === 'middle' ? 1 : 2;
    return icons[iconIndex % icons.length];
  };

  const getAdLabel = () => {
    const labels = {
      top: 'Advertisement',
      middle: 'Sponsored Content',
      bottom: 'Ad Space',
      side: 'Featured Ad'
    };
    return labels[position] || 'Advertisement';
  };

  return (
    <div className={`w-full bg-muted/30 rounded-lg p-4 ${className}`}>
      <div className="text-center">
        <span className="text-xs text-muted-foreground">Advertisement</span>
        <div 
          id={id} 
          className={`bg-card border border-border ${sizeMap[size]} rounded flex items-center justify-center`}
        >
          <div className="flex items-center space-x-2 text-muted-foreground">
            {getAdIcon()}
            <span>{getAdLabel()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdComponent;
