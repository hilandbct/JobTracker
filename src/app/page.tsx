import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import Link from "next/link";
import { Users, FolderOpen, Clock, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const [clientCount, projectCount, openInvoices, recentTime, openTodoCount] = await Promise.all([
    prisma.client.count(),
    prisma.project.count({ where: { status: "active" } }),
    prisma.invoice.findMany({
      where: { status: { in: ["sent", "draft", "overdue"] } },
      include: { lineItems: true, client: { select: { name: true } } },
      orderBy: { issueDate: "desc" },
      take: 5,
    }),
    prisma.timeEntry.findMany({
      orderBy: { startTime: "desc" },
      take: 5,
      include: { project: { select: { name: true, client: { select: { name: true } } } } },
    }),
    prisma.todo.count({ where: { completed: false } }),
  ]);

  const invoiceTotal = openInvoices.reduce((sum, inv) => {
    return sum + inv.lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0);
  }, 0);

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Clients" value={String(clientCount)} href="/clients" />
        <StatCard icon={FolderOpen} label="Active Projects" value={String(projectCount)} href="/projects" />
        <StatCard icon={Clock} label="Open To-Dos" value={String(openTodoCount)} href="/clients" />
        <StatCard icon={FileText} label="Outstanding" value={formatCurrency(invoiceTotal)} href="/invoices" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Open Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            {openInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No open invoices.</p>
            ) : (
              <ul className="space-y-2">
                {openInvoices.map((inv) => {
                  const total = inv.lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0);
                  return (
                    <li key={inv.id} className="flex justify-between items-center text-sm gap-2">
                      <Link href={`/invoices/${inv.id}`} className="hover:underline font-medium shrink-0">
                        {inv.number}
                      </Link>
                      <span className="text-muted-foreground truncate flex-1">{inv.client.name}</span>
                      <span className="shrink-0">{formatCurrency(total)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Time Entries</CardTitle>
          </CardHeader>
          <CardContent>
            {recentTime.length === 0 ? (
              <p className="text-sm text-muted-foreground">No time entries yet.</p>
            ) : (
              <ul className="space-y-2">
                {recentTime.map((t) => (
                  <li key={t.id} className="flex justify-between items-center text-sm gap-2">
                    <span className="truncate flex-1">{t.description || "—"}</span>
                    <span className="text-muted-foreground shrink-0 truncate max-w-[120px]">{t.project.name}</span>
                    <span className="shrink-0">
                      {t.durationMin ? `${Math.round((t.durationMin / 60) * 10) / 10}h` : "—"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary/10">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold leading-none">{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
