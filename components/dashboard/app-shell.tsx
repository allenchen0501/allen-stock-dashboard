import type { ReactNode } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-ink">
      <Sidebar />
      <Header />
      <main className="lg:ml-[232px]">{children}</main>
    </div>
  );
}
