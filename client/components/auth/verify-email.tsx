"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import VerifyImage from "@/public/assets/arch-2.jpg";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { AuthShell } from "@/components/auth/auth-shell";
import { getApiErrorMessage } from "@/lib/api/errors";
import { authService } from "@/services/auth.service";
import { sanitizeNextPath, buildAuthHref } from "@/lib/auth/redirect";
import { resendVerificationSchema } from "@/schema/auth.schema";
import { APP_NAME } from "@/utils/utils";

type Status = "idle" | "verifying" | "verified" | "failed";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token");
  const email = searchParams.get("email") ?? "";
  const nextPath = sanitizeNextPath(searchParams.get("next"));

  const [status, setStatus] = useState<Status>(token ? "verifying" : "idle");
  const [error, setError] = useState<string | null>(null);

  const [resendEmail, setResendEmail] = useState(email);
  const [resendState, setResendState] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const [resendError, setResendError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;

    async function verify() {
      try {
        await authService.verifyEmail({ token: token as string });

        if (!cancelled) {
          setStatus("verified");
        }
      } catch (caught) {
        if (!cancelled) {
          setError(getApiErrorMessage(caught));
          setStatus("failed");
        }
      }
    }

    void verify();

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleResend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setResendError(null);

    const parsed = resendVerificationSchema.safeParse({ email: resendEmail });

    if (!parsed.success) {
      setResendError(parsed.error.flatten().fieldErrors.email?.[0] ?? "Enter a valid email address");
      setResendState("error");

      return;
    }

    setResendState("sending");

    try {
      await authService.resendVerification(parsed.data);

      setResendState("sent");
    } catch (caught) {
      setResendError(getApiErrorMessage(caught));
      setResendState("error");
    }
  }

  return (
    <AuthShell
      heroImage={VerifyImage.src}
      heroTitle="One step from your workspace"
      heroSubtitle={`Confirm your email to activate your ${APP_NAME} account, then sign in to continue.`}
    >
{/*
        Same three-part rhythm as ForgotPassword: heading pinned to the top,
        the primary control centred in the leftover space via `flex-1`, the
        secondary link pinned to the bottom. Without `flex-1` here the whole
        block hugs the top and the card looks top-heavy next to
        ForgotPassword, which is the screen it mirrors.
      */}
      <div className="mt-5 flex flex-1 flex-col sm:mt-6">
        <div className="flex flex-col">
          <h1 className="text-[28px] leading-[1.1] font-medium tracking-tight text-ink sm:text-[32px] lg:text-[36px]">
            {status === "verified" ? "Email verified" : "Verify your email"}
          </h1>

          <p className="mt-1 text-[13px] text-ink-muted sm:text-[14px] lg:text-[15px]">
            {status === "verifying"
              ? "Checking your verification link..."
              : status === "verified"
                ? "Your account is active. Taking you to sign in..."
                : status === "failed"
                  ? "That link is invalid or has expired."
                  : "We sent a verification link to your email address."}
          </p>
        </div>

        {error ? (
          <p role="alert" className="mt-2 text-[13px] text-danger">
            {error}
          </p>
        ) : null}

        <div className="flex flex-1 flex-col justify-center py-6">
          {status === "idle" || status === "failed" ? (
            <form
              onSubmit={handleResend}
              noValidate
              className="flex flex-col gap-3"
            >
              <Input
                id="resendEmail"
                name="email"
                type="email"
                label="Resend to"
                autoComplete="email"
                placeholder="you@studio.com"
                value={resendEmail}
                onChange={(event) => setResendEmail(event.target.value)}
                error={resendState === "error" ? (resendError ?? undefined) : undefined}
                disabled={resendState === "sending"}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={resendState === "sending"}
                className="w-full shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                {resendState === "sending" ? "Sending..." : "Resend link"}
              </Button>

              {resendState === "sent" ? (
                <p role="status" className="text-[13px] text-ink-muted">
                  If that address exists, a new link is on its way.
                </p>
              ) : null}
            </form>
          ) : status === "verified" ? (
            // The centred slot carries the only remaining action, so the
            // screen is not left with a small text link as its primary control.
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => router.replace(buildAuthHref("/login", nextPath))}
            >
              Continue to log in
            </Button>
          ) : null}
        </div>

        {status !== "verified" ? (
          <p className="flex justify-center gap-1 text-[12px] text-ink-muted">
            Already verified?{" "}
            <Link
              href={buildAuthHref("/login", nextPath)}
              className="font-medium text-ink-muted underline underline-offset-2 transition-colors duration-150 hover:text-ink"
            >
              Log in here
            </Link>
          </p>
        ) : null}
      </div>
    </AuthShell>
  );
};

const VerifyEmail = () => {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
};

export default VerifyEmail;
