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
      <div className="flex flex-col gap-5 mt-5 sm:mt-6">
        <div className="flex flex-col">
          <h1 className="font-medium text-[28px] sm:text-[32px] lg:text-[36px] text-black leading-[1.1] tracking-tight">
            {status === "verified" ? "Email verified" : "Verify your email"}
          </h1>

          <p className="text-[13px] sm:text-[14px] lg:text-[15px] text-black/60 mt-1">
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
          <p role="alert" className="text-[13px] text-red-500">
            {error}
          </p>
        ) : null}

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
              placeholder="Enter your Email..."
              value={resendEmail}
              onChange={(event) => setResendEmail(event.target.value)}
              error={resendState === "error" ? (resendError ?? undefined) : undefined}
              disabled={resendState === "sending"}
            />

            <Button
              type="submit"
              variant="default-small"
              disabled={resendState === "sending"}
              className="w-full shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              {resendState === "sending" ? "Sending..." : "Resend link"}
            </Button>

            {resendState === "sent" ? (
              <p role="status" className="text-[13px] text-gray-500">
                If that address exists, a new link is on its way.
              </p>
            ) : null}
          </form>
        ) : null}

        <p className="flex justify-center gap-1 text-[12px] text-gray-600">
          {status === "verified" ? (
            <button
              type="button"
              onClick={() => router.replace(buildAuthHref("/login", nextPath))}
              className="text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors duration-200 font-medium"
            >
              Continue to log in
            </button>
          ) : (
            <>
              Already verified?{" "}
              <Link
                href={buildAuthHref("/login", nextPath)}
                className="text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors duration-200 font-medium"
              >
                Log in here
              </Link>
            </>
          )}
        </p>
      </div>
    </AuthShell>
  );
}

const VerifyEmail = () => {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
};

export default VerifyEmail;
