import { authApi, type AuthUser, type LoginResponse } from "@/actions/auth";

import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResendVerificationInput,
  ResetPasswordInput,
  VerifyEmailInput,
} from "@/schema/auth.schema";

import useAuthStore from "@/store/use-auth-store";

export const authService = {
  async login(input: LoginInput): Promise<LoginResponse> {
    const response = await authApi.login(input);

    useAuthStore.getState().setAuthenticated(response.user);

    return response;
  },

  async register(input: RegisterInput) {
    return authApi.register(input);
  },

  async getCurrentUser(): Promise<AuthUser> {
    const user = await authApi.me();

    useAuthStore.getState().setAuthenticated(user);

    return user;
  },

  async verifyEmail(input: VerifyEmailInput) {
    return authApi.verifyEmail(input);
  },

  async resendVerification(input: ResendVerificationInput) {
    return authApi.resendVerification(input);
  },

  async forgotPassword(input: ForgotPasswordInput) {
    return authApi.forgotPassword(input);
  },

  async resetPassword(input: ResetPasswordInput) {
    return authApi.resetPassword(input);
  },

  async logout() {
    try {
      await authApi.logout();
    } finally {
      useAuthStore.getState().clearAuth();
    }
  },

  async logoutAll() {
    try {
      await authApi.logoutAll();
    } finally {
      useAuthStore.getState().clearAuth();
    }
  },
};
