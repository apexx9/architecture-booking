"use client";

import React, { useState, type FormEvent } from "react";
import Link from "next/link";

import ForgotImage from "@/public/assets/forgot-image.jpg";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { AuthShell } from "@/components/auth/auth-shell";
import { useAuth } from "@/hooks/use-auth";
import { getApiErrorMessage } from "@/lib/api/errors";
import { forgotPasswordSchema } from "@/schema/auth.schema";
import { APP_NAME } from "@/utils/utils";

/**
 * Password reset request.
 *
 * The success state is deliberately identical whether or not the address exists
 * — the backend owns that decision, and telling a stranger which emails are
 * registered would leak account information.
 */
const ForgotPassword = () => {
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setFieldError(undefined);
    setFormError(null);

    const parsed = forgotPasswordSchema.safeParse({ email });

    if (!parsed.success) {
      setFieldError(parsed.error.flatten().fieldErrors.email?.[0]);

      return;
    }

    setIsSubmitting(true);

    try {
      await forgotPassword(parsed.data);

      setIsSent(true);
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSent) {
    return (
      <AuthShell
        heroImage={ForgotImage.src}
        heroTitle="Check your inbox"
        heroSubtitle={`If an account exists for ${email}, a reset link is on its way. The link expires shortly, so use it soon.`}
      >
        <div className="mt-5 flex flex-col sm:mt-6">
          <h1 className="text-[28px] leading-[1.1] font-medium tracking-tight text-ink sm:text-[32px] lg:text-[36px]">
            Reset link sent
          </h1>

          <p role="status" className="mt-2 text-[13px] leading-relaxed text-ink-muted sm:text-[14px]">
            We sent reset instructions to{" "}
            <span className="font-medium text-ink">{email}</span>. Nothing
            arrived? Check your spam folder, then try again.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={() => setIsSent(false)}
          >
            Send to a different address
          </Button>

          <p className="flex justify-center gap-1 text-[12px] text-ink-muted">
            Remembered it?{" "}
            <Link
              href="/login"
              className="font-medium text-ink-muted underline underline-offset-2 transition-colors duration-150 hover:text-ink"
            >
              Back to login
            </Link>
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      heroImage={ForgotImage.src}
      heroTitle="Forgot your password?"
      heroSubtitle={`No worries — we'll send you a secure link to reset it and get you back to ${APP_NAME}.`}
    >
      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-5 flex flex-1 flex-col sm:mt-6"
      >
        <div className="flex flex-col">
          <h1 className="text-[28px] leading-[1.1] font-medium tracking-tight text-ink sm:text-[32px] lg:text-[36px]">
            Forgot password?
          </h1>
          <p className="mt-1 text-[13px] text-ink-muted sm:text-[14px] lg:text-[15px]">
            Enter your email address and we&apos;ll send you a reset link.
          </p>
        </div>

        <div className="flex flex-1 flex-col justify-center gap-5 py-6">
          <Input
            id="email"
            name="email"
            type="email"
            label="Email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={fieldError}
            disabled={isSubmitting}
          />

          {formError ? (
            <p role="alert" className="text-[13px] text-danger">
              {formError}
            </p>
          ) : null}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Sending..." : "Send reset link"}
          </Button>
        </div>

        <p className="flex justify-center gap-1 text-[12px] text-ink-muted">
          Remembered it?{" "}
          <Link
            href="/login"
            className="font-medium text-ink-muted underline underline-offset-2 transition-colors duration-150 hover:text-ink"
          >
            Back to login
          </Link>
        </p>
      </form>
    </AuthShell>
  );
};

export default ForgotPassword;
