import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function AdminForgotPasswordPage() {
  return <ForgotPasswordForm resetPath="/admin/reset-password/" backHref="/admin/login" />;
}
