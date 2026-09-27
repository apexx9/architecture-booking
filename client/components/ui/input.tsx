// components/ui/input.tsx
import React, {
  forwardRef,
  InputHTMLAttributes,
  ReactNode,
  useState,
} from "react";
import { Eye, EyeOff } from "lucide-react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      fullWidth = true,
      className = "",
      id,
      type = "text",
      disabled,
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword && showPassword ? "text" : type;

    const inputId = id || props.name;

    return (
      <div className={`flex flex-col gap-1.5 ${fullWidth ? "w-full" : ""}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}

        <div
          className={`
            relative flex items-center gap-2 w-full
            bg-gray-50 border rounded-2xl px-3.5 py-2.5
            transition-all duration-200 ease-out
            ${
              error
                ? "border-red-400 focus-within:border-red-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-red-500/10"
                : "border-[#E8E8E8] hover:border-gray-300 focus-within:border-gray-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-gray-900/[0.04]"
            }
            ${disabled ? "opacity-60 cursor-not-allowed bg-gray-100" : ""}
          `}
        >
          {leftIcon && (
            <span className="text-gray-400 shrink-0 [&>svg]:w-4 [&>svg]:h-4">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            type={inputType}
            disabled={disabled}
            className={`
              flex-1 bg-transparent outline-none text-sm text-gray-900
              placeholder:text-gray-400
              disabled:cursor-not-allowed
              ${className}
            `}
            {...props}
          />

          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="
                shrink-0 text-gray-400 hover:text-gray-700
                transition-colors duration-200 cursor-pointer
                focus:outline-none focus-visible:text-gray-900
              "
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" strokeWidth={2} />
              ) : (
                <Eye className="w-4 h-4" strokeWidth={2} />
              )}
            </button>
          )}

          {rightIcon && !isPassword && (
            <span className="text-gray-400 shrink-0 [&>svg]:w-4 [&>svg]:h-4">
              {rightIcon}
            </span>
          )}
        </div>

        {error ? (
          <p className="text-xs text-red-500">{error}</p>
        ) : hint ? (
          <p className="text-xs text-gray-500">{hint}</p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
