"use client";

import React, { useId, useState, type FormEvent } from "react";
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
import { oauthStartUrl } from "@/lib/auth/oauth";
import { useAuth } from "@/hooks/use-auth";
import { useSavedLoginEmail } from "@/hooks/use-saved-login-email";
import { loginFormSchema } from "@/schema/auth.schema";
import { APP_NAME } from "@/utils/utils";

type FieldErrors = Partial<Record<"email" | "password", string>>;

const Login = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formErrorId = useId();

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

  // The OAuth callback bounces failures back here with `?error=`. Decode it so
  // the reason reads as a sentence rather than a URL-encoded string.
  const oauthError = (() => {
    const raw = searchParams.get("error");

    if (!raw) {
      return null;
    }

    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  })();

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
        className="mt-5 flex flex-col gap-4 sm:mt-6 sm:gap-5"
        aria-describedby={
          formError || oauthError ? formErrorId : undefined
        }
      >
        {/* Heading */}
        <div className="flex flex-col">
          <h1 className="text-[28px] leading-[1.1] font-medium tracking-tight text-ink sm:text-[32px] lg:text-[36px]">
            Log in
          </h1>
          <p className="mt-1 text-[13px] text-ink-muted sm:text-[14px] lg:text-[15px]">
            Welcome back to {APP_NAME}.
          </p>
        </div>

        {oauthError && (
          <p
            id={formErrorId}
            role="alert"
            className="rounded-sm border border-line bg-surface-subtle px-3 py-2 text-[12px] text-ink sm:text-[13px]"
          >
            {oauthError}
          </p>
        )}

        {/* Social row */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          <SocialButton href={oauthStartUrl("google")} label="Continue with Google">
            <GoogleIcon />
          </SocialButton>
          <SocialButton label="Continue with Apple" disabled>
            <AppleIcon />
          </SocialButton>
          <SocialButton
            href={oauthStartUrl("microsoft")}
            label="Continue with Microsoft"
          >
            <MicrosoftIcon />
          </SocialButton>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-line" />
          <span className="text-[9px] font-medium tracking-[0.14em] whitespace-nowrap text-ink-subtle uppercase sm:text-[10px]">
            or continue with email
          </span>
          <div className="h-px flex-1 bg-line" />
        </div>

        {/* Inputs */}
        <div className="flex flex-col gap-3 sm:gap-3.5">
          <Input
            id="email"
            name="email"
            type="email"
            label="Email"
            autoComplete="email"
            placeholder="you@studio.com"
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
            placeholder="Your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={fieldErrors.password}
            disabled={isSubmitting}
          />
        </div>

        {/* Form-level error */}
        {formError ? (
          <p
            id={formErrorId}
            role="alert"
            className="text-[13px] text-danger"
          >
            {formError}
          </p>
        ) : null}

        {/* Save ID + Forgot */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Checkbox
            id="save-id"
            name="saveEmail"
            checked={rememberEmail}
            onChange={(event) => setTypedRemember(event.target.checked)}
            label="Save ID"
          />
          <Link
            href="/forgot-password"
            className="text-[12px] text-ink-subtle underline underline-offset-2 transition-colors duration-150 hover:text-ink"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isSubmitting}
          className="mt-1 w-full"
        >
          {isSubmitting ? "Logging in…" : "Log in"}
        </Button>

        <p className="flex justify-center gap-1 text-[12px] text-ink-muted">
          No account yet?{" "}
          <Link
            href={
              nextPath === "/dashboard"
                ? "/sign-up"
                : `/sign-up?next=${encodeURIComponent(nextPath)}`
            }
            className="font-medium text-ink-muted underline underline-offset-2 transition-colors duration-150 hover:text-ink"
          >
            Sign up
          </Link>
        </p>
      </form>
    </AuthShell>
  );
};

export default Login;
