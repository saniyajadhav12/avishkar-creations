import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = { title: "Forgot password", robots: { index: false, follow: true } };

export default function ForgotPasswordPage() {
  return (
    <AuthCard>
      <ForgotPasswordForm resetPath="/reset-password/" backHref="/login" />
    </AuthCard>
  );
}
