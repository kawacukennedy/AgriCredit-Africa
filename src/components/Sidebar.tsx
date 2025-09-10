"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Dashboard" },
  { href: "/explainability", label: "Explainability" },
  { href: "/reports", label: "Reports" },
  { href: "#", label: "Integrations" },
  { href: "#", label: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 shrink-0 border-r border-black/10 dark:border-white/10 h-screen sticky top-0 hidden md:flex flex-col bg-black/[.02] dark:bg-white/[.02]">
      <div className="px-4 py-4 text-lg font-semibold">VeritasAI</div>
      <nav className="flex-1 px-2 py-2 space-y-1">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                "block rounded px-3 py-2 text-sm transition-colors " +
                (active
                  ? "bg-foreground text-background"
                  : "hover:bg-black/5 dark:hover:bg-white/10")
              }
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
