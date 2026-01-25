import React from 'react';
import { Button } from './button';

interface LightButtonProps {
  onClick?: () => void;
  children?: React.ReactNode;
}

const LightButton: React.FC<LightButtonProps> = ({ onClick, children }) => {

  return (
    <Button
        variant="outline"
        size="sm"
        className="bg-white text-black font-[700] text-[16px] text-right rounded-[100px] flex items-center gap-2 border border-transparent hover:bg-white hover:text-black"
        onClick={onClick}
    >
      {children}
    </Button>
  );
};

export default LightButton;