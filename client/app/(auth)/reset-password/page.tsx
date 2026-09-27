import { Suspense } from "react";

import ResetPassword from "@/components/auth/reset-password";

const ResetPasswordPage = () => {
  return (
    <Suspense fallback={null}>
      <ResetPassword />
    </Suspense>
  );
};

export default ResetPasswordPage;
