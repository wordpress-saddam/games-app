import React from 'react';
import ComputerIconImage from "../../assets/vs-computer.png";
interface ComputerIconProps {
  classes?: string;
}

const ComputerIcon: React.FC<ComputerIconProps> = ({classes }) => {
  return (
    <div className={`${classes}`}>
      {/* <span>💻</span> */}
      <img src={ComputerIconImage} alt="Computer" className={`${classes}`} width={60} height={60} />
    </div>
  );
};

export default ComputerIcon;