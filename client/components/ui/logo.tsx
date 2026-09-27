import React from "react";

import { APP_NAME } from "@/utils/utils";

type LogoVariant = "light" | "dark";

interface LogoProps {
  variant: LogoVariant;

  className?: string;
}

const Logo = ({ variant, className }: LogoProps) => {
  const textColor = variant === "dark" ? "text-black" : "text-white";

  return (
    <p className={`font-medium text-[26px] ${textColor} ${className ?? ""}`}>
      {APP_NAME.toLowerCase()}
      <span className="align-super text-[13px]">&reg;</span>
    </p>
  );
};

export default Logo;
