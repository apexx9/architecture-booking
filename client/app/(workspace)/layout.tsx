import { ProtectedRoute } from "@/components/auth/protected-route";
import AppShell from "@/components/layout/app-shell";

export default function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  console.log("[WorkspaceLayout] RENDER");

  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}
