"use client";

import { useAdminSession } from "@/components/admin/admin-session";
import { ChangeEmailForm } from "@/components/auth/change-email-form";
import { ChangePasswordForm } from "@/components/auth/change-password-form";

export default function AdminProfilePage() {
  const { user } = useAdminSession();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl">Profile</h1>
        <p className="text-sm text-fg-muted">Manage how you sign in to the dashboard.</p>
      </div>
      <ChangePasswordForm />
      <ChangeEmailForm currentEmail={user.email ?? ""} redirectPath="/admin/profile/" />
    </div>
  );
}
