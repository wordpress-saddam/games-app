import React from 'react';

interface HumanIconProps {
  classes?: string;
}

const HumanIcon: React.FC<HumanIconProps> = ({classes }) => {
  return (
    <div className={`${classes}`}>👳🏻</div>
  );
};

export default HumanIcon;