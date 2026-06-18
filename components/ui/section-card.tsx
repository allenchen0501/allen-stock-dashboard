import type { ReactNode } from "react";

interface SectionCardProps {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SectionCard({ title, eyebrow, action, children, className = "" }: SectionCardProps) {
  return (
    <section className={`panel-shell overflow-hidden ${className}`}>
      <div className="flex min-h-[66px] items-center justify-between border-b border-line/80 px-5 sm:px-6">
        <div>
          {eyebrow && <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{eyebrow}</p>}
          <h2 className="text-[15px] font-semibold tracking-wide text-slate-100">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
