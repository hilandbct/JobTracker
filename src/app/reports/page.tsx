export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDuration } from "@/lib/format";

export default async function ReportsPage() {
  const [invoices, openInvoices, timeEntries] = await Promise.all([
    prisma.invoice.findMany({
      where: { status: "paid" },
      include: { lineItems: true, client: { select: { name: true } } },
    }),
    prisma.invoice.findMany({
      where: { status: { in: ["sent", "draft", "overdue"] } },
      include: { lineItems: true },
    }),
    prisma.timeEntry.findMany({
      include: { project: { select: { name: true, hourlyRate: true, client: { select: { name: true } } } } },
    }),
  ]);

  const invoiceTotal = (inv: { lineItems: { quantity: number; unitPrice: number }[] }) =>
    inv.lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0);

  // Summary stats
  const thisYear = new Date().getFullYear();
  const revenueThisYear = invoices
    .filter((inv) => new Date(inv.issueDate).getFullYear() === thisYear)
    .reduce((s, inv) => s + invoiceTotal(inv), 0);
  const outstanding = openInvoices.reduce((s, inv) => s + invoiceTotal(inv), 0);
  const unbilledValue = timeEntries
    .filter((t) => !t.billed && t.durationMin && t.project.hourlyRate)
    .reduce((s, t) => s + (t.durationMin! / 60) * t.project.hourlyRate!, 0);
  const minutesThisYear = timeEntries
    .filter((t) => new Date(t.startTime).getFullYear() === thisYear)
    .reduce((s, t) => s + (t.durationMin ?? 0), 0);

  // Revenue by month (paid invoices), chronological, last 12 months
  const revenueByMonth: Record<string, number> = {};
  for (const inv of invoices) {
    const d = new Date(inv.issueDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    revenueByMonth[key] = (revenueByMonth[key] ?? 0) + invoiceTotal(inv);
  }
  const revenueMonths = Object.entries(revenueByMonth)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12)
    .map(([key, total]) => ({
      label: new Date(key + "-01T00:00:00").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      total,
    }));
  const maxMonth = Math.max(...revenueMonths.map((m) => m.total), 1);

  // Hours + earned by client
  const clientStats: Record<string, { name: string; minutes: number; earned: number }> = {};
  for (const t of timeEntries) {
    const clientName = t.project.client.name;
    if (!clientStats[clientName]) clientStats[clientName] = { name: clientName, minutes: 0, earned: 0 };
    clientStats[clientName].minutes += t.durationMin ?? 0;
    if (t.project.hourlyRate && t.durationMin) {
      clientStats[clientName].earned += (t.durationMin / 60) * t.project.hourlyRate;
    }
  }
  const clientRows = Object.values(clientStats).sort((a, b) => b.earned - a.earned || b.minutes - a.minutes);

  // Revenue by client (paid invoices), with bars relative to the top client
  const clientRevenue: Record<string, number> = {};
  for (const inv of invoices) {
    clientRevenue[inv.client.name] = (clientRevenue[inv.client.name] ?? 0) + invoiceTotal(inv);
  }
  const clientRevenueRows = Object.entries(clientRevenue).sort((a, b) => b[1] - a[1]);
  const maxClient = Math.max(...clientRevenueRows.map(([, t]) => t), 1);

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-semibold">Reports</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard label={`Revenue ${thisYear}`} value={formatCurrency(revenueThisYear)} />
        <SummaryCard label="Outstanding" value={formatCurrency(outstanding)} />
        <SummaryCard label="Unbilled Time Value" value={formatCurrency(unbilledValue)} />
        <SummaryCard label={`Hours ${thisYear}`} value={formatDuration(minutesThisYear)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Revenue by Month</CardTitle></CardHeader>
          <CardContent>
            {revenueMonths.length === 0 ? <p className="text-sm text-muted-foreground">No paid invoices yet.</p> : (
              <div className="flex items-end gap-2 h-40">
                {revenueMonths.map((m) => (
                  <div key={m.label} className="flex-1 flex flex-col items-center justify-end gap-1 min-w-0 h-full">
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {m.total >= 1000 ? `$${Math.round(m.total / 100) / 10}k` : `$${Math.round(m.total)}`}
                    </span>
                    <div
                      className="w-full rounded-t-md bg-primary/80 hover:bg-primary transition-colors"
                      style={{ height: `${Math.max((m.total / maxMonth) * 80, 3)}%` }}
                      title={`${m.label}: ${formatCurrency(m.total)}`}
                    />
                    <span className="text-[10px] text-muted-foreground truncate">{m.label}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Revenue by Client</CardTitle></CardHeader>
          <CardContent>
            {clientRevenueRows.length === 0 ? <p className="text-sm text-muted-foreground">No paid invoices yet.</p> : (
              <div className="space-y-3">
                {clientRevenueRows.map(([name, total]) => (
                  <div key={name} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground truncate">{name}</span>
                      <span className="font-medium tabular-nums">{formatCurrency(total)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary/70" style={{ width: `${(total / maxClient) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Hours by Client</CardTitle></CardHeader>
          <CardContent>
            {clientRows.length === 0 ? <p className="text-sm text-muted-foreground">No time entries yet.</p> : (
              <div className="divide-y">
                {clientRows.map(row => (
                  <div key={row.name} className="flex justify-between items-center py-2 text-sm gap-4">
                    <span className="flex-1 truncate">{row.name}</span>
                    <span className="text-muted-foreground tabular-nums">{formatDuration(row.minutes)}</span>
                    {row.earned > 0 && <span className="font-medium tabular-nums">{formatCurrency(row.earned)}</span>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card px-4 py-3">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
