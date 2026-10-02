"use client";

import React, { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import ResetImage from "@/public/assets/reset-image.jpg";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { AuthShell } from "@/components/auth/auth-shell";
import AuthPending from "@/components/auth/auth-pending";
import { useAuth } from "@/hooks/use-auth";
import { getApiErrorMessage } from "@/lib/api/errors";
import { buildAuthHref } from "@/lib/auth/redirect";
import { resetPasswordSchema } from "@/schema/auth.schema";

type FieldErrors = Partial<Record<"password" | "confirmPassword", string>>;

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resetPassword } = useAuth();

  const token = searchParams.get("token");
  const nextPath = searchParams.get("next");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasToken = token !== null && token !== "";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setFieldErrors({});
    setFormError(null);

    if (!hasToken) {
      setFormError("This reset link is incomplete. Request a new one.");

      return;
    }

    const parsed = resetPasswordSchema.safeParse({
      token,
      password,
      confirmPassword,
    });

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;

      setFieldErrors({
        password: errors.password?.[0],
        confirmPassword: errors.confirmPassword?.[0],
      });

      return;
    }

    setIsSubmitting(true);

    try {
      await resetPassword(parsed.data);

      // The password is changed but the session is not; send them to log in
      // again so they are not left with a stale authenticated shell.
      router.replace(buildAuthHref("/login", nextPath));
    } catch (error) {
      setFormError(getApiErrorMessage(error));
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      heroImage={ResetImage.src}
      heroTitle="Set a new password"
      heroSubtitle="Choose a strong password you haven't used before to keep your account safe."
    >
      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-5 flex flex-1 flex-col sm:mt-6"
      >
        <div className="flex flex-col">
          <h1 className="text-[28px] leading-[1.1] font-medium tracking-tight text-ink sm:text-[32px] lg:text-[36px]">
            New password
          </h1>
          <p className="mt-1 text-[13px] text-ink-muted sm:text-[14px] lg:text-[15px]">
            At least 8 characters, including a letter and a number.
          </p>
        </div>

        <div className="flex flex-1 flex-col justify-center gap-5 py-6">
          {formError ? (
            <p role="alert" className="text-[13px] text-danger">
              {formError}
            </p>
          ) : null}

          <Input
            id="password"
            name="password"
            type="password"
            label="New password"
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

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Updating…" : "Reset password"}
          </Button>
        </div>

        <p className="flex justify-center gap-1 text-[12px] text-ink-muted">
          Changed your mind?{" "}
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
}

/*
 * Reading the token suspends. The fallback keeps the form's geometry so the
 * layout does not jump once the token resolves — `null` left a blank panel.
 */
const ResetPassword = () => (
  <Suspense fallback={<AuthPending />}>
    <ResetPasswordContent />
  </Suspense>
);

export default ResetPassword;
