import React from "react";

import { APP_NAME } from "@/utils/utils";

type LogoVariant = "light" | "dark";

interface LogoProps {
  variant: LogoVariant;

  className?: string;
}

const Logo = ({ variant, className }: LogoProps) => {
  const textColor = variant === "dark" ? "text-ink" : "text-ink-inverse";

  return (
    <p
      className={`inline-flex items-baseline gap-0.5 font-medium tracking-[-0.05em] text-[26px] ${textColor} ${className ?? ""}`}
      aria-label={`${APP_NAME} brand logo`}
    >
      <span>{APP_NAME}</span>
      <span aria-hidden="true" className="align-super text-[13px] leading-none">
        ®
      </span>
    </p>
  );
};

export default Logo;
