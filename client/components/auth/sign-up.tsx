"use client";

import React, { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import SignupImage from "@/public/assets/signup-image.jpg";
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
import { registerSchema } from "@/schema/auth.schema";
import { APP_NAME } from "@/utils/utils";

type FieldErrors = Partial<
  Record<"fullName" | "email" | "password" | "confirmPassword" | "terms", string>
>;

const SignUp = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { register } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nextPath = sanitizeNextPath(searchParams.get("next"));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setFieldErrors({});
    setFormError(null);

    const parsed = registerSchema.safeParse({
      fullName,
      email,
      password,
      confirmPassword,
    });

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;

      setFieldErrors({
        fullName: errors.fullName?.[0],
        email: errors.email?.[0],
        password: errors.password?.[0],
        confirmPassword: errors.confirmPassword?.[0],
      });

      return;
    }

    if (!acceptedTerms) {
      setFieldErrors({ terms: "You must accept the terms to continue" });

      return;
    }

    setIsSubmitting(true);

    try {
      await register(parsed.data);

      // Accounts start as PENDING — login is refused until the email is verified.
      const verifyUrl = new URL("/verify-email", window.location.origin);
      verifyUrl.searchParams.set("email", parsed.data.email);
      verifyUrl.searchParams.set("next", nextPath);

      router.replace(`${verifyUrl.pathname}${verifyUrl.search}`);
    } catch (error) {
      setFormError(getApiErrorMessage(error));
      setIsSubmitting(false);
    }
  }

  const signUpHref =
    nextPath === "/dashboard"
      ? "/login"
      : `/login?next=${encodeURIComponent(nextPath)}`;

  return (
    <AuthShell
      heroImage={SignupImage.src}
      // promoImage intentionally omitted — no promo card on sign up
      heroTitle="Start your next landmark with us"
      heroSubtitle={`Create a ${APP_NAME} account and get instant access to partners, projects, and growth opportunities.`}
    >
      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col gap-4 mt-5 sm:mt-6"
      >
        {/* Heading */}
        <div className="flex flex-col">
          <h1 className="text-[28px] leading-[1.1] font-medium tracking-tight text-ink sm:text-[32px] lg:text-[36px]">
            Create account
          </h1>
          <p className="mt-1 text-[13px] text-ink-muted sm:text-[14px] lg:text-[15px]">
            Join {APP_NAME} in a few seconds.
          </p>
        </div>

        {/* Social row */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          <SocialButton href={oauthStartUrl("google")} label="Sign up with Google">
            <GoogleIcon />
          </SocialButton>
          <SocialButton label="Sign up with Apple" disabled>
            <AppleIcon />
          </SocialButton>
          <SocialButton
            href={oauthStartUrl("microsoft")}
            label="Sign up with Microsoft"
          >
            <MicrosoftIcon />
          </SocialButton>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-line" />
          <span className="text-[9px] font-medium tracking-[0.14em] whitespace-nowrap text-ink-subtle uppercase sm:text-[10px]">
            or sign up with email
          </span>
          <div className="h-px flex-1 bg-line" />
        </div>

        {/* Inputs */}
        <div className="flex flex-col gap-3">
          <Input
            id="fullName"
            name="fullName"
            label="Full name"
            autoComplete="name"
            placeholder="Ama Mensah"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            error={fieldErrors.fullName}
            disabled={isSubmitting}
          />
          <Input
            id="email"
            name="email"
            type="email"
            label="Email"
            autoComplete="email"
            placeholder="you@studio.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={fieldErrors.email}
            disabled={isSubmitting}
          />
          <Input
            id="password"
            name="password"
            type="password"
            label="Password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={fieldErrors.password}
            disabled={isSubmitting}
          />
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            label="Confirm password"
            autoComplete="new-password"
            placeholder="Repeat your password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            error={fieldErrors.confirmPassword}
            disabled={isSubmitting}
          />
        </div>

        {/* Terms */}
        <div className="flex flex-col gap-1">
          <Checkbox
            id="terms"
            name="terms"
            checked={acceptedTerms}
            onChange={(event) => setAcceptedTerms(event.target.checked)}
            disabled={isSubmitting}
            label={
              <span>
                I agree to the{" "}
                <Link
                  href="/legal/terms"
                  className="text-ink underline underline-offset-2 transition-colors duration-150 hover:text-ink-muted"
                >
                  Terms
                </Link>{" "}
                and{" "}
                <Link
                  href="/legal/privacy"
                  className="text-ink underline underline-offset-2 transition-colors duration-150 hover:text-ink-muted"
                >
                  Privacy Policy
                </Link>
              </span>
            }
          />

          {fieldErrors.terms ? (
            <p role="alert" className="text-xs text-danger">
              {fieldErrors.terms}
            </p>
          ) : null}
        </div>

        {/* Form-level error */}
        {formError ? (
          <p role="alert" className="text-[13px] text-danger">
            {formError}
          </p>
        ) : null}

        {/* Submit */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isSubmitting}
          className="mt-1 w-full"
        >
          {isSubmitting ? "Creating account…" : "Create account"}
        </Button>

        <p className="flex justify-center gap-1 text-[12px] text-ink-muted">
          Already a member?{" "}
          <Link
            href={signUpHref}
            className="font-medium text-ink-muted underline underline-offset-2 transition-colors duration-150 hover:text-ink"
          >
            Log in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
};

export default SignUp;
