import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = { title: "Create an account", robots: { index: false, follow: true } };

export default function SignupPage() {
  return (
    <AuthCard>
      <Suspense fallback={<p className="text-fg-muted">Loading…</p>}>
        <SignupForm />
      </Suspense>
    </AuthCard>
  );
}
