"use client";

import React, { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import LoginImage from "@/public/assets/login-image.jpg";
import PromoImage from "@/public/assets/arch-1.jpg";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import {
  AuthShell,
  SocialButton,
  GoogleIcon,
  AppleIcon,
  MicrosoftIcon,
  Checkbox,
} from "@/components/auth/auth-shell";
import { getApiErrorMessage } from "@/lib/api/errors";
import { sanitizeNextPath } from "@/lib/auth/redirect";
import { useAuth } from "@/hooks/use-auth";
import { useSavedLoginEmail } from "@/hooks/use-saved-login-email";
import { loginFormSchema } from "@/schema/auth.schema";
import { APP_NAME } from "@/utils/utils";

type FieldErrors = Partial<Record<"email" | "password", string>>;

const Login = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { login } = useAuth();
  const { savedEmail, save, clear } = useSavedLoginEmail();

  // `null` means "untouched", so the field still follows the stored address
  // until the visitor actually types. Same trick for the checkbox.
  const [typedEmail, setTypedEmail] = useState<string | null>(null);
  const [typedRemember, setTypedRemember] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const email = typedEmail ?? savedEmail;
  const rememberEmail = typedRemember ?? savedEmail !== "";

  const nextPath = sanitizeNextPath(searchParams.get("next"));

  function persistEmail() {
    if (rememberEmail) {
      save(email);
    } else {
      clear();
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setFieldErrors({});
    setFormError(null);

    const parsed = loginFormSchema.safeParse({ email, password });

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;

      setFieldErrors({
        email: errors.email?.[0],
        password: errors.password?.[0],
      });

      return;
    }

    setIsSubmitting(true);

    try {
      await login(parsed.data);

      persistEmail();

      router.replace(nextPath);
    } catch (error) {
      setFormError(getApiErrorMessage(error));
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      heroImage={LoginImage.src}
      promoImage={PromoImage.src}
      heroTitle="Run the practice, not the paperwork"
      heroSubtitle={`Log in to ${APP_NAME} to pick up your projects, proposals and invoices exactly where you left them.`}
    >
      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col gap-4 sm:gap-5 mt-5 sm:mt-6"
      >
        {/* Heading */}
        <div className="flex flex-col">
          <h1 className="font-medium text-[28px] sm:text-[32px] lg:text-[36px] text-black leading-[1.1] tracking-tight">
            Log in
          </h1>
          <p className="text-[13px] sm:text-[14px] lg:text-[15px] text-black/60 mt-1">
            Welcome back to {APP_NAME}.
          </p>
        </div>

        {/* Social row */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          <SocialButton label="Continue with Google" disabled>
            <GoogleIcon />
          </SocialButton>
          <SocialButton label="Continue with Apple" disabled>
            <AppleIcon />
          </SocialButton>
          <SocialButton label="Continue with Microsoft" disabled>
            <MicrosoftIcon />
          </SocialButton>
        </div>

        <p className="-mt-2 text-center text-[11px] text-gray-400">
          Social sign-in is coming soon.
        </p>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.14em] text-gray-400 font-medium whitespace-nowrap">
            or continue with email
          </span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Inputs */}
        <div className="flex flex-col gap-3 sm:gap-3.5">
          <Input
            id="email"
            name="email"
            type="email"
            label="Email"
            autoComplete="email"
            placeholder="Enter your Email..."
            value={email}
            onChange={(event) => setTypedEmail(event.target.value)}
            error={fieldErrors.email}
            disabled={isSubmitting}
          />
          <Input
            id="password"
            name="password"
            type="password"
            label="Password"
            autoComplete="current-password"
            placeholder="Enter your Password..."
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={fieldErrors.password}
            disabled={isSubmitting}
          />
        </div>

        {/* Form-level error */}
        {formError ? (
          <p role="alert" className="text-[13px] text-red-500">
            {formError}
          </p>
        ) : null}

        {/* Save ID + Forgot */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Checkbox
            id="save-id"
            name="saveEmail"
            checked={rememberEmail}
            onChange={(event) => setTypedRemember(event.target.checked)}
            label="Save ID"
          />
          <Link
            href="/forgot-password"
            className="text-[12px] text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors duration-200"
          >
            Forgot Password?
          </Link>
        </div>

        {/* Submit */}
        <div className="w-full mt-1 transition-transform duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0">
          <Button
            type="submit"
            variant="default-small"
            disabled={isSubmitting}
            className="w-full shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            {isSubmitting ? "Logging in..." : "Log in"}
          </Button>
        </div>

        <p className="flex justify-center gap-1 text-[12px] text-gray-600">
          No account yet?{" "}
          <Link
            href={
              nextPath === "/dashboard"
                ? "/sign-up"
                : `/sign-up?next=${encodeURIComponent(nextPath)}`
            }
            className="text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors duration-200 font-medium"
          >
            Sign up here
          </Link>
        </p>
      </form>
    </AuthShell>
  );
};

export default Login;
