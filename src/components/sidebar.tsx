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
    <aside className="w-52 shrink-0 border-r bg-muted/30 flex flex-col">
      <div className="px-4 py-4 border-b">
        {!logoError ? (
          <img
            src="/logo-black.png"
            alt={appName}
            className="h-8 w-auto"
            onError={() => setLogoError(true)}
          />
        ) : (
          <span className="font-semibold text-base tracking-tight">{appName}</span>
        )}
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              pathname === href || (href !== "/" && pathname.startsWith(href))
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-4 py-3 border-t space-y-3">
        {/* Theme switcher */}
        <div className="flex items-center gap-1.5">
          {themes.map((t) => (
            <button
              key={t.id}
              title={t.label}
              onClick={() => applyTheme(t.id)}
              className={cn(
                "h-5 w-5 rounded-full transition-all",
                t.bg,
                theme === t.id ? `ring-2 ring-offset-1 ${t.ring}` : "opacity-60 hover:opacity-100"
              )}
            />
          ))}
        </div>

        {/* Sign out */}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
