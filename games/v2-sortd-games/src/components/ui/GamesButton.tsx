import React from "react";
import { Button } from "./button";
import { RefreshCw, ArrowRight, Undo2 } from "lucide-react";
import CheckedWhiteIcon from "../../assets/checked-white.png";
import ArrowTransparent from "../../assets/arrow-transparent.png";
/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

// export const BaseButtonProps = {
//   onClick: () => {},
//   children: React.ReactNode,
//   disabled: false,
// }

/* -------------------------------------------------------------------------- */
/*                                LIGHT BUTTON                                */
/* -------------------------------------------------------------------------- */

export const LightButton = (props) => {
  const { onClick, children, disabled } = props;
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="
        bg-white
        text-black
        font-[700]
        text-[12px] md:text-[16px]
        text-right
        rounded-[100px]
        flex items-center gap-2
        border border-transparent
        hover:bg-white hover:text-black
        disabled:opacity-50 disabled:cursor-not-allowed
      "
    >
      {children}
    </Button>
  );
};


/* -------------------------------------------------------------------------- */
/*                                BLUE BUTTON                                */
/* -------------------------------------------------------------------------- */

export const BlueButton = (props) => {
  const { onClick, children, disabled } = props;
  return (
    <Button
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="
        flex items-center justify-center gap-2
        px-5 py-2
        bg-[#6AAFE6] 
        text-white 
        font-[700]
        text-[12px] md:text-[16px]
        leading-[100%]
        rounded-[100px]
        hover:bg-[#6AAFE6]
        shadow-lg hover:shadow-xl
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
      "
    >
      {children}
    </Button>
  );
};

/* -------------------------------------------------------------------------- */
/*                                RESET BUTTON                                */
/* -------------------------------------------------------------------------- */

export const ResetButton = (props) => {
  const { onClick, children, disabled } = props;
  return (
    <Button
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="
        flex items-center 
        justify-center 
        gap-2
        px-5 py-2
        bg-[#9B9B9B]
        text-white
        font-[700]
        text-[12px] md:text-[18px]
        rounded-[5px]
        leading-[100%]
        hover:bg-[#9B9B9B]
        shadow-lg hover:shadow-xl
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
      "
    >
      {children}
      <RefreshCw className="h-4 w-4" />
    </Button>
  );
};

/* -------------------------------------------------------------------------- */
/*                                 NEXT BUTTON                                */
/* -------------------------------------------------------------------------- */

export const NextButton = (props) => {
  const { onClick, children, disabled } = props;
  return (
    <Button
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="
        flex items-center justify-center gap-4
        px-5 py-4
        bg-[#6AAFE6]
        text-white
        font-[700]
        text-[12px] md:text-[18px]
        leading-[100%]
        rounded-[5px]
        hover:bg-[#6AAFE6]
        shadow-lg hover:shadow-xl
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
      "
    >
      {children}
      <ArrowRight className="h-4 w-4" />
    </Button>
  );
};

/* -------------------------------------------------------------------------- */
/*                              PLAY AGAIN BUTTON                             */
/* -------------------------------------------------------------------------- */

export const PlayAgainButton = (props) => {
  const { onClick, children, disabled } = props;
  return (
    <Button
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="
        flex items-center justify-center gap-2
        px-8 py-3
        bg-[#6AAFE6]
        text-white
        font-extrabold
        text-[12px] md:text-[16px]
        leading-none
        rounded-[8px]
        hover:bg-[#5A9FD8]
        transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
      "
    >
      {children}
      <RefreshCw className="h-4 w-4" />
    </Button>
  );
};

/* -------------------------------------------------------------------------- */
/*                              RESET BUTTON TOP ROUNDED                       */
/* -------------------------------------------------------------------------- */

export const ResetButtonTopRounded = (props) => {
  const { onClick, children, disabled } = props;
  return (
    <Button
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="
        gap-4 px-4 md:px-10 py-2 md:py-6
        bg-[#63AAE4] 
        text-white 
        rounded-tl-[8px] 
        rounded-tr-[8px] 
        rounded-br-none 
        rounded-bl-none 
        font-[700] 
        text-[12px] md:text-[18px] 
        leading-[100%] 
        text-center 
        align-middle 
        hover:bg-[#63AAE4] 
        disabled:opacity-80 
        disabled:cursor-not-allowed 
        transition-all 
        duration-200 
        shadow-lg 
        hover:shadow-xl 
        transform 
        hover:scale-105"
    >
      {children}
    </Button>
  );
};

/* -------------------------------------------------------------------------- */
/*                              PLAY AGAIN BUTTON TOP ROUNDED                   */
/* -------------------------------------------------------------------------- */

export const PlayAgainButtonTopRounded = (props) => {
  const { onClick, children, disabled } = props;
  return (
    <Button
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="
        gap-4 px-10 py-6 
        bg-[#55B45C] 
        text-white 
        rounded-tl-[8px] 
        rounded-tr-[8px] 
        rounded-br-none 
        rounded-bl-none 
        font-[700] 
        text-[12px] md:text-[18px] 
        leading-[100%] 
        text-center 
        align-middle 
        hover:bg-[#55B45C] 
        disabled:opacity-80 
        disabled:cursor-not-allowed 
        transition-all 
        duration-200 
        shadow-lg 
        hover:shadow-xl 
        transform 
        hover:scale-105"
    >
      {children}
    </Button>
  );
};

/* -------------------------------------------------------------------------- */
/*                              UNDO BUTTON TOP ROUNDED                       */
/* -------------------------------------------------------------------------- */

export const UndoButtonTopRounded = (props) => {
  const { onClick, children, disabled } = props;
  return (
    <button
      className="
      gap-4 px-16 py-3
      rounded-tl-[8px] 
      rounded-tr-[8px] 
      rounded-br-none 
      rounded-bl-none 
      font-[700] 
      text-[12px] md:text-[18px] 
      leading-[100%] 
      text-center 
      align-middle 
      text-white 
      bg-[#FE9802] 
      hover:bg-[#FE9802] 
      transition-all 
      duration-200 
      disabled:opacity-80 
      disabled:cursor-not-allowed"
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      {children}
    </button>
  );
};

/* -------------------------------------------------------------------------- */
/*                              GRADIENT BUTTON                              */
/* -------------------------------------------------------------------------- */

export const GradientButton = (props) => {
  const { onClick, children, disabled } = props;
  return (
    <Button 
      variant="outline"
      size="sm"
      className="
      font-[700]
      text-[12px] md:text-[18px]  
      text-right 
      rounded-[100px] 
      flex items-center 
      gap-2 
      bg-gradient-to-r 
      from-[#C62426] to-[#3F1313] 
      text-white 
      hover:from-[#C62426] hover:to-[#3F1313] hover:text-white
      "
      onClick={onClick}
      disabled={disabled}>
      {children}
    </Button>
  );
};

/* -------------------------------------------------------------------------- */
/*                              CHECK ANSWER BUTTON TOP ROUNDED                 */
/* -------------------------------------------------------------------------- */

export const CheckAnswerButtonTopRounded = (props) => {
  const { onClick, children, disabled } = props;
  return (
    <Button 
      size="sm"
      className="
      flex 
      items-center 
      gap-4 px-4 md:px-10 py-2 md:py-6 
      bg-[#55B45C] 
      text-white 
      rounded-tl-[8px] 
      rounded-tr-[8px] 
      rounded-br-none 
      rounded-bl-none 
      font-[700]
      text-[12px] md:text-[18px]
      leading-[100%] 
      text-center 
      align-middle 
      hover:bg-[#55B45C] 
      disabled:opacity-80 
      disabled:cursor-not-allowed
      transition-all 
      duration-200 
      shadow-lg 
      hover:shadow-xl 
      transform 
      hover:scale-105"
      onClick={onClick}
      disabled={disabled}>
      {children}
      <img src={CheckedWhiteIcon} alt="Checked White Icon" className="w-6 h-6 mr-1" />
    </Button>
  );
};

/* -------------------------------------------------------------------------- */
/*                              NEXT BUTTON TOP ROUNDED                        */
/* -------------------------------------------------------------------------- */

export const NextButtonTopRounded = (props) => {
  const { onClick, children, disabled } = props;
  return (
    <Button
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="
        flex 
        items-center 
        gap-4 px-4 md:px-10 py-2 md:py-6
        bg-[#6AAFE6] 
        text-white 
        rounded-tl-[8px] 
        rounded-tr-[8px] 
        rounded-br-none 
        rounded-bl-none 
        font-[700]
        text-[12px] md:text-[18px] 
        md:text-[16px] 
        leading-[100%] 
        text-center 
        align-middle 
        hover:bg-[#6AAFE6] 
        disabled:opacity-80 
        disabled:cursor-not-allowed 
        transition-all 
        duration-200 
        shadow-lg 
        hover:shadow-xl 
        transform hover:scale-105
      "
    >
      {children}
      <img src={ArrowTransparent} alt="Arrow Transparent" className="w-5 h-5 ml-2" />
    </Button>
  );
};