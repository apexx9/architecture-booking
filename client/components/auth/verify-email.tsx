"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import VerifyImage from "@/public/assets/arch-2.jpg";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { AuthShell } from "@/components/auth/auth-shell";
import { classifyApiError, getApiErrorMessage, type ClassifiedApiError } from "@/lib/api/errors";
import { authService } from "@/services/auth.service";
import { sanitizeNextPath, buildAuthHref } from "@/lib/auth/redirect";
import { resendVerificationSchema } from "@/schema/auth.schema";
import { APP_NAME } from "@/utils/utils";

type Status = "idle" | "verifying" | "verified" | "failed";

type VerificationOutcome =
  | { status: "verified" }
  | { status: "failed"; failure: ClassifiedApiError };

const verificationRequests = new Map<string, Promise<VerificationOutcome>>();

/*
 * A verification token is single-use, so the request must be issued exactly
 * once per token per page session. React StrictMode mounts effects twice in
 * development, and a remount re-runs this effect, so an in-flight guard alone
 * is not enough: whichever effect is torn down would leave the page stuck on
 * "verifying". Sharing one promise per token lets every mount await the same
 * request and apply its single outcome. The entry is dropped once settled so
 * revisiting a link retries rather than replaying a stale verdict.
 */
function requestVerification(token: string): Promise<VerificationOutcome> {
  const inFlight = verificationRequests.get(token);

  if (inFlight) {
    return inFlight;
  }

  const request = authService
    .verifyEmail({ token })
    .then((): VerificationOutcome => ({ status: "verified" }))
    .catch((caught): VerificationOutcome => ({
      status: "failed",
      failure: classifyApiError(caught),
    }))
    .finally(() => {
      verificationRequests.delete(token);
    });

  verificationRequests.set(token, request);

  return request;
}

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token");
  const email = searchParams.get("email") ?? "";
  const nextPath = sanitizeNextPath(searchParams.get("next"));

  const [status, setStatus] = useState<Status>(token ? "verifying" : "idle");
  const [failure, setFailure] = useState<ClassifiedApiError | null>(null);

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

    void requestVerification(token).then((outcome) => {
      if (cancelled) {
        return;
      }

      if (outcome.status === "verified") {
        setStatus("verified");

        return;
      }

      setFailure(outcome.failure);
      setStatus("failed");
    });

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

  /*
   * The link is only "invalid or expired" when the server actually said so.
   * Reporting that verdict for a request that never reached the API sends
   * people to resend a perfectly good link, so transport failures get their
   * own copy and anything else non-401 stays deliberately non-committal.
   */
  const failureSubtitle = (() => {
    if (status !== "failed") {
      return null;
    }

    if (!failure || failure.kind === "unreachable") {
      return "We couldn't reach the server. Check your connection, then try again.";
    }

    if (failure.status === 401) {
      return "That link is invalid or has expired.";
    }

    return "We couldn't verify this link. Request a new one below.";
  })();

  const subtitle =
    status === "verifying"
      ? "Checking your verification link..."
      : status === "verified"
        ? "Your account is active. Taking you to sign in..."
        : (failureSubtitle ?? "We sent a verification link to your email address.");

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
            {subtitle}
          </p>
        </div>

        {failure?.serverMessage ? (
          <p role="alert" className="mt-2 text-[13px] text-danger">
            {failure.serverMessage}
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
