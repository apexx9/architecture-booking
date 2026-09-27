import { Suspense } from "react";

import Login from "@/components/auth/login";

const LoginPage = () => {
  return (
    <Suspense fallback={null}>
      <Login />
    </Suspense>
  );
};

export default LoginPage;
