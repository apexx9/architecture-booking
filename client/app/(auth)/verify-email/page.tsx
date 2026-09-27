import type { Metadata } from "next";

import VerifyEmail from "@/components/auth/verify-email";

export const metadata: Metadata = {
  title: "Verify email",
  robots: { index: false, follow: false },
};

const VerifyEmailPage = () => {
  return <VerifyEmail />;
};

export default VerifyEmailPage;
