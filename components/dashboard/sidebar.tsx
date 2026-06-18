"use client";

import {
  BadgeDollarSign,
  Ban,
  BarChart3,
  ChevronLeft,
  Gauge,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/holdings", label: "持股戰情中心", icon: WalletCards },
  { href: "/risk-reward", label: "風報比中心", icon: BadgeDollarSign },
  { href: "/breakout", label: "主升段池", icon: TrendingUp },
  { href: "/avoid", label: "今日禁碰股", icon: Ban },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[232px] flex-col border-r border-line bg-[#070a0f] lg:flex">
      <div className="flex h-[76px] items-center gap-3 border-b border-line px-5">
        <div className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-lg bg-positive text-ink shadow-[0_0_24px_rgba(24,211,158,0.2)]">
          <BarChart3 size={20} strokeWidth={2.5} />
          <span className="absolute bottom-0 h-[2px] w-full bg-white/50" />
        </div>
        <div>
          <p className="text-[14px] font-black tracking-[0.12em] text-white">ALLEN</p>
          <p className="text-[9px] font-semibold uppercase tracking-[0.23em] text-positive">Stock Dashboard</p>
        </div>
      </div>

      <div className="flex-1 px-3 py-6">
        <p className="mb-3 px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600">Trading desk</p>
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex h-11 items-center gap-3 rounded-lg px-3 text-[13px] font-medium transition-all ${
                  active
                    ? "bg-positive/10 text-positive ring-1 ring-inset ring-positive/15"
                    : "text-slate-500 hover:bg-white/[0.035] hover:text-slate-200"
                }`}
              >
                <item.icon size={17} strokeWidth={active ? 2.3 : 1.8} />
                <span>{item.label}</span>
                {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-positive shadow-[0_0_8px_#18d39e]" />}
              </Link>
            );
          })}
        </nav>

        <div className="my-6 h-px bg-line" />
        <p className="mb-3 px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600">System</p>
        <nav className="space-y-1">
          {[{ label: "策略設定", icon: Settings }, { label: "風控規則", icon: ShieldCheck }, { label: "使用說明", icon: HelpCircle }].map((item) => (
            <button key={item.label} className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-[12px] text-slate-600 transition-colors hover:bg-white/[0.03] hover:text-slate-300">
              <item.icon size={16} strokeWidth={1.8} />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="border-t border-line p-3">
        <div className="flex items-center gap-3 rounded-xl bg-white/[0.025] p-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-[11px] font-bold text-white">AL</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-semibold text-slate-200">Allen Lin</p>
            <p className="text-[9px] uppercase tracking-wider text-slate-600">Pro trader</p>
          </div>
          <LogOut size={14} className="text-slate-600" />
        </div>
      </div>
      <button className="absolute -right-3 top-[101px] grid h-6 w-6 place-items-center rounded-full border border-line bg-[#0d1219] text-slate-600">
        <ChevronLeft size={12} />
      </button>
    </aside>
  );
}
