"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Users, FolderOpen, Clock, FileText, ClipboardList, LayoutDashboard,
  BarChart2, Settings, Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Item = {
  key: string;
  label: string;
  sublabel?: string;
  href: string;
  icon: React.ElementType;
  group: string;
};

const navItems: Item[] = [
  { key: "nav-dashboard", label: "Dashboard", href: "/", icon: LayoutDashboard, group: "Pages" },
  { key: "nav-clients", label: "Clients", href: "/clients", icon: Users, group: "Pages" },
  { key: "nav-projects", label: "Projects", href: "/projects", icon: FolderOpen, group: "Pages" },
  { key: "nav-time", label: "Time", href: "/time", icon: Clock, group: "Pages" },
  { key: "nav-invoices", label: "Invoices", href: "/invoices", icon: FileText, group: "Pages" },
  { key: "nav-estimates", label: "Estimates", href: "/estimates", icon: ClipboardList, group: "Pages" },
  { key: "nav-reports", label: "Reports", href: "/reports", icon: BarChart2, group: "Pages" },
  { key: "nav-settings", label: "Settings", href: "/settings", icon: Settings, group: "Pages" },
];

type SearchResults = {
  clients: { id: number; name: string; company: string | null }[];
  projects: { id: number; name: string; status: string; client: { name: string } }[];
  invoices: { id: number; number: string; status: string; client: { name: string } }[];
  estimates: { id: number; number: string; status: string; client: { name: string } }[];
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const disabled = pathname.startsWith("/login") || pathname.startsWith("/portal");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("jt:open-palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("jt:open-palette", onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults(null);
      setSelected(0);
      // Wait for the dialog to render before focusing
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      setSelected(0);
      return;
    }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
      if (res.ok) {
        setResults(await res.json());
        setSelected(0);
      }
    }, 150);
    return () => clearTimeout(t);
  }, [query]);

  const items: Item[] = [
    ...navItems.filter((n) => !query || n.label.toLowerCase().includes(query.toLowerCase())),
    ...(results?.clients.map((c) => ({
      key: `client-${c.id}`, label: c.name, sublabel: c.company ?? undefined,
      href: `/clients/${c.id}`, icon: Users, group: "Clients",
    })) ?? []),
    ...(results?.projects.map((p) => ({
      key: `project-${p.id}`, label: p.name, sublabel: `${p.client.name} · ${p.status}`,
      href: `/projects/${p.id}`, icon: FolderOpen, group: "Projects",
    })) ?? []),
    ...(results?.invoices.map((i) => ({
      key: `invoice-${i.id}`, label: i.number, sublabel: `${i.client.name} · ${i.status}`,
      href: `/invoices/${i.id}`, icon: FileText, group: "Invoices",
    })) ?? []),
    ...(results?.estimates.map((es) => ({
      key: `estimate-${es.id}`, label: es.number, sublabel: `${es.client.name} · ${es.status}`,
      href: `/estimates/${es.id}`, icon: ClipboardList, group: "Estimates",
    })) ?? []),
  ];

  const go = useCallback(
    (item: Item) => {
      setOpen(false);
      router.push(item.href);
    },
    [router]
  );

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter" && items[selected]) {
      e.preventDefault();
      go(items[selected]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  if (disabled || !open) return null;

  let lastGroup = "";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-[15vh]"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg rounded-xl border bg-popover text-popover-foreground shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 border-b">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKey}
            placeholder="Search clients, projects, invoices…"
            className="flex-1 bg-transparent py-3.5 text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="text-[10px] text-muted-foreground border rounded px-1.5 py-0.5">esc</kbd>
        </div>
        <div className="max-h-[50vh] overflow-y-auto py-2">
          {items.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">No results.</p>
          ) : (
            items.map((item, i) => {
              const header = item.group !== lastGroup ? item.group : null;
              lastGroup = item.group;
              const Icon = item.icon;
              return (
                <div key={item.key}>
                  {header && (
                    <p className="px-4 pt-2 pb-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{header}</p>
                  )}
                  <button
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2 text-sm text-left",
                      i === selected ? "bg-accent text-accent-foreground" : "hover:bg-muted/60"
                    )}
                    onMouseEnter={() => setSelected(i)}
                    onClick={() => go(item)}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{item.label}</span>
                    {item.sublabel && (
                      <span className="ml-auto text-xs text-muted-foreground truncate max-w-[45%]">{item.sublabel}</span>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
