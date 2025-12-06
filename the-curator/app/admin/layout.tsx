import type { ReactNode } from "react";
import AdminNavigation from "@/components/admin/AdminNavigation";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-stone-900">
      <AdminNavigation />
      <main className="px-4 py-8 sm:px-6 lg:px-8 dark:text-stone-50">
        {children}
      </main>
    </div>
  );
}
