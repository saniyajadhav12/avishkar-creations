import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { cardClass } from "@/components/admin/form-styles";

// Login, forgot password, and reset password: a simple centered card, no admin navigation
export default function AdminAuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        <Link href="/" className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-line">
          <Image src="/brand/avishkar-logo.webp" alt="Avishkar Creations" width={600} height={201} priority className="h-12 w-auto rounded-sm" />
        </Link>
        <div className={`${cardClass} w-full`}>{children}</div>
      </div>
    </main>
  );
}
