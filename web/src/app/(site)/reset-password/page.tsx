import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Set a new password", robots: { index: false, follow: false } };

export default function ResetPasswordPage() {
  return (
    <AuthCard>
      <ResetPasswordForm forgotHref="/forgot-password" doneHref="/account" doneLabel="Go to your account" />
    </AuthCard>
  );
}
