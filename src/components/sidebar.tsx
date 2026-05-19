"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Users, FolderOpen, Clock, FileText, ClipboardList, LayoutDashboard, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/time", label: "Time", icon: Clock },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/estimates", label: "Estimates", icon: ClipboardList },
];

type Theme = "light" | "dark" | "theme-ocean" | "theme-warm";

const themes: { id: Theme; label: string; bg: string; ring: string }[] = [
  { id: "light",       label: "Light",  bg: "bg-white border border-gray-300",    ring: "ring-gray-400" },
  { id: "dark",        label: "Dark",   bg: "bg-zinc-900",                        ring: "ring-zinc-600" },
  { id: "theme-ocean", label: "Ocean",  bg: "bg-[oklch(0.28_0.09_232)]",          ring: "ring-blue-400" },
  { id: "theme-warm",  label: "Warm",   bg: "bg-[oklch(0.28_0.055_55)]",          ring: "ring-amber-400" },
];

const appName = process.env.NEXT_PUBLIC_APP_NAME || "JobTracker";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [logoError, setLogoError] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("jt-theme") as Theme | null;
      if (saved) setTheme(saved);
    } catch {}
  }, []);

  function applyTheme(t: Theme) {
    document.documentElement.classList.remove("dark", "theme-ocean", "theme-warm");
    if (t !== "light") document.documentElement.classList.add(t);
    try { localStorage.setItem("jt-theme", t); } catch {}
    setTheme(t);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-56 shrink-0 border-r bg-sidebar flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-sidebar-border">
        {!logoError ? (
          <img
            src="/logo-black.png"
            alt={appName}
            className="h-8 w-auto"
            onError={() => setLogoError(true)}
          />
        ) : (
          <span className="font-semibold text-[15px] tracking-tight">{appName}</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-[13.5px] font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", active ? "opacity-90" : "opacity-70")} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-sidebar-border space-y-3">
        <div className="flex items-center gap-2 px-3">
          {themes.map((t) => (
            <button
              key={t.id}
              title={t.label}
              onClick={() => applyTheme(t.id)}
              className={cn(
                "h-4 w-4 rounded-full transition-all",
                t.bg,
                theme === t.id ? `ring-2 ring-offset-1 ${t.ring}` : "opacity-50 hover:opacity-100"
              )}
            />
          ))}
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-[13.5px] font-medium text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0 opacity-70" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
