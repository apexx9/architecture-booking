import { z } from "zod";

const assignableRole = z.enum(["ADMIN", "MEMBER", "VIEWER"]);

export const createTenantSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Tenant name is required")
    .max(255, "Tenant name is too long"),
});

export const updateTenantSchema = createTenantSchema;

export const addMemberSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),

  role: assignableRole,
});

export const updateMemberRoleSchema = z.object({
  userId: z.string().min(1, "Member is required"),

  role: assignableRole,
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type AssignableRole = z.infer<typeof assignableRole>;