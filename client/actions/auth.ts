import { api } from "@/lib/api/client";

import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResendVerificationInput,
  ResetPasswordInput,
  VerifyEmailInput,
} from "@/schema/auth.schema";

export type UserStatus = "PENDING" | "ACTIVE" | "SUSPENDED";

export type AuthUser = {
  id: string;
  email: string;
  fullName: string | null;
  status: UserStatus;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AuthSession = {
  id: string;
  expiresAt: string;
};

export type TenantRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

export type TenantSummary = {
  id: string;
  name: string;
  role: TenantRole;
  isDefault: boolean;
};

export type LoginResponse = {
  user: AuthUser;
  session: AuthSession;
  tenants: TenantSummary[];
};

export type RegisterResponse = {
  id: string;
  email: string;
  fullName: string | null;
  status: UserStatus;
  createdAt: string;
};

export const authApi = {
  async register(input: RegisterInput) {
    const response = await api.post<RegisterResponse>("/auth/register", {
      email: input.email,
      fullName: input.fullName,
      password: input.password,
    });

    return response.data;
  },

  async login(input: LoginInput) {
    const response = await api.post<LoginResponse>("/auth/login", input);

    return response.data;
  },

  async me() {
    const response = await api.get<AuthUser>("/auth/me");

    return response.data;
  },

  async refresh() {
    const response = await api.post<{ session: AuthSession }>("/auth/refresh");

    return response.data;
  },

  async logout() {
    const response = await api.post<{ message: string }>("/auth/logout");

    return response.data;
  },

  async logoutAll() {
    const response = await api.post<{ message: string }>("/auth/logout-all");

    return response.data;
  },

  async verifyEmail(input: VerifyEmailInput) {
    const response = await api.post<{ message: string }>("/auth/verify-email", {
      token: input.token,
    });

    return response.data;
  },

  async resendVerification(input: ResendVerificationInput) {
    const response = await api.post<{ message: string }>(
      "/auth/resend-verification",
      { email: input.email },
    );

    return response.data;
  },

  async forgotPassword(input: ForgotPasswordInput) {
    const response = await api.post<{ message: string }>(
      "/auth/forgot-password",
      { email: input.email },
    );

    return response.data;
  },

  async resetPassword(input: ResetPasswordInput) {
    const response = await api.post<{ message: string }>(
      "/auth/reset-password",
      { token: input.token, password: input.password },
    );

    return response.data;
  },
};
