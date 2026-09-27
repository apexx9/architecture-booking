import { Suspense } from "react";

import SignUp from "@/components/auth/sign-up";

const SignUpPage = () => {
  return (
    <Suspense fallback={null}>
      <SignUp />
    </Suspense>
  );
};

export default SignUpPage;
