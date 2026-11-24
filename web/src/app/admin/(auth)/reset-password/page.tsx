import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function AdminResetPasswordPage() {
  return <ResetPasswordForm forgotHref="/admin/forgot-password" doneHref="/admin" doneLabel="Go to dashboard" />;
}
