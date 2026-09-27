"use client";

import React from "react";
import Link from "next/link";
import ForgotImage from "@/public/assets/forgot-image.jpg";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { AuthShell } from "@/components/auth/auth-shell";
import { APP_NAME } from "@/utils/utils";

const ForgotPassword = () => {
  return (
    <AuthShell
      heroImage={ForgotImage.src}
      heroTitle="Forgot your password?"
      heroSubtitle={`No worries — we'll send you a secure link to reset it and get you back to ${APP_NAME}.`}
    >
      {/* Heading — pinned at top */}
      <div className="flex flex-col mt-5 sm:mt-6">
        <h1 className="font-medium text-[28px] sm:text-[32px] lg:text-[36px] text-black leading-[1.1] tracking-tight">
          Reset password
        </h1>
        <p className="text-[13px] sm:text-[14px] lg:text-[15px] text-black/60 mt-1">
          Enter the email linked to your account.
        </p>
      </div>

      {/* Middle block — centered in remaining space */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3 sm:gap-3.5">
            <Input label="Email" placeholder="Enter your Email..." />
          </div>

          <div className="w-full mt-1 transition-transform duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0">
            <Button
              variant="default-small"
              className="w-full shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              Send reset link
            </Button>
          </div>

          <p className="flex justify-center gap-1 text-[12px] text-gray-600">
            Remembered it?{" "}
            <Link
              href="/login"
              className="text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors duration-200 font-medium"
            >
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </AuthShell>
  );
};

export default ForgotPassword;
