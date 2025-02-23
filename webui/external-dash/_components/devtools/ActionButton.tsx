import React from "react";

interface Props {
  onClick: () => void;
  text: string;
  textColorClass: string;
  bgColorClass: string;
  disabled: boolean;
}
export default function ActionButton({
  onClick,
  text,
  textColorClass,
  bgColorClass,
  disabled,
}: Props) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`${
        disabled ? "opacity-60 cursor-not-allowed" : ""
      } m-1 p-1 ${textColorClass} text-xs font-medium py-1 px-2 flex items-center gap-2 rounded bg-[#f2f4f7] border border-[#d0d5dd] cursor-pointer`}
    >
      <span className={`${bgColorClass} rounded-full w-[6px] h-[6px]`}></span>
      {text}
    </button>
  );
}
