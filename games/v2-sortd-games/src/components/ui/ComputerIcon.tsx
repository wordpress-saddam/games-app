import React from 'react';

interface ComputerIconProps {
  classes?: string;
}

const ComputerIcon: React.FC<ComputerIconProps> = ({classes }) => {
  return (
    <div className={`${classes}`}>💻</div>
  );
};

export default ComputerIcon;