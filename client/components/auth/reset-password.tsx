"use client";

import React from "react";
import Link from "next/link";
import ResetImage from "@/public/assets/reset-image.jpg";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { AuthShell } from "@/components/auth/auth-shell";

const ResetPassword = () => {
  return (
    <AuthShell
      heroImage={ResetImage.src}
      heroTitle="Set a new password"
      heroSubtitle="Choose a strong password you haven't used before to keep your account safe."
    >
      {/* Heading — pinned at top */}
      <div className="flex flex-col mt-5 sm:mt-6">
        <h1 className="font-medium text-[28px] sm:text-[32px] lg:text-[36px] text-black leading-[1.1] tracking-tight">
          New password
        </h1>
        <p className="text-[13px] sm:text-[14px] lg:text-[15px] text-black/60 mt-1">
          Your new password must be at least 8 characters.
        </p>
      </div>

      {/* Middle block — centered in remaining space */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3 sm:gap-3.5">
            <Input
              label="New password"
              type="password"
              placeholder="Enter new password..."
            />
            <Input
              label="Confirm password"
              type="password"
              placeholder="Re-enter new password..."
            />
          </div>

          <div className="w-full mt-1 transition-transform duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0">
            <Button
              variant="default-small"
              className="w-full shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              Reset password
            </Button>
          </div>

          <p className="flex justify-center gap-1 text-[12px] text-gray-600">
            Changed your mind?{" "}
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

export default ResetPassword;
