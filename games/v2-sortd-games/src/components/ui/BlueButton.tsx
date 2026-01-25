import React from 'react';
import { Button } from './button';

interface BlueButtonProps {
  onClick?: () => void;
  children?: React.ReactNode;
}

const BlueButton: React.FC<BlueButtonProps> = ({ onClick, children }) => {

  return (
    <Button
        variant="outline"
        size="sm"
        className="bg-[#63AAE4] text-white font-[700] text-[16px] rounded-[100px] border-none hover:bg-[#63AAE4] hover:text-white"
        onClick={onClick}
    >
      {children}
    </Button>
  );
};

export default BlueButton;