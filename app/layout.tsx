import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/dashboard/app-shell";

export const metadata: Metadata = {
  title: "Allen Stock Dashboard",
  description: "專業台股交易儀表板 — 市場燈號、持股戰情、風報比與主升段候選池",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body><AppShell>{children}</AppShell></body>
    </html>
  );
}
