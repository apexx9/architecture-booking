import React from "react";

type ButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> & {
  variant: string;
  children: React.ReactNode;
};

const Button = ({ variant, className, children, type = "button", ...props }: ButtonProps) => {
  let variantStyles = "";

  switch (variant) {
    case "default-large":
      variantStyles =
        "font-medium text-[16px] text-white uppercase px-7.5 py-5 bg-[#191919] hover:bg-[#191919]/90 transition-all duration-250 rounded-[100px]";
      break;
    case "default-small":
      variantStyles =
        "font-medium text-[14px] text-white uppercase px-5 py-4 bg-[#191919] hover:bg-[#191919]/90 transition-all duration-250 rounded-[100px]";
      break;
    default:
      variantStyles = "";
  }

  const isDisabled = props.disabled ?? false;

  return (
    <button
      type={type}
      className={`${variantStyles} ${className ?? ""} ${
        isDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      }`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
