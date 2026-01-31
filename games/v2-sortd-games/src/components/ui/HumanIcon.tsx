import React from 'react';
import HumanIconImage from "../../assets/vs-human.png";
interface HumanIconProps {
  classes?: string;
}

const HumanIcon: React.FC<HumanIconProps> = ({classes }) => {
  return (
    <div className={`${classes}`}>
      {/* <span>👳🏻</span> */}
      <img src={HumanIconImage} alt="Human" className={`${classes}`} width={60} height={60} />
    </div>
  );
};

export default HumanIcon;