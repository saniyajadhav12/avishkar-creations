import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: true } };

export default function LoginPage() {
  return (
    <AuthCard>
      <Suspense fallback={<p className="text-fg-muted">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
