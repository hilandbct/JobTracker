export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDuration } from "@/lib/format";

export default async function ReportsPage() {
  const [invoices, timeEntries] = await Promise.all([
    prisma.invoice.findMany({
      where: { status: "paid" },
      include: { lineItems: true, client: { select: { name: true } } },
    }),
    prisma.timeEntry.findMany({
      include: { project: { select: { name: true, hourlyRate: true, client: { select: { name: true } } } } },
    }),
  ]);

  // Revenue by month (paid invoices)
  const revenueByMonth: Record<string, number> = {};
  for (const inv of invoices) {
    const month = new Date(inv.issueDate).toLocaleDateString("en-US", { year: "numeric", month: "short" });
    const total = inv.lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0);
    revenueByMonth[month] = (revenueByMonth[month] ?? 0) + total;
  }
  const revenueMonths = Object.entries(revenueByMonth).sort((a,b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()).slice(0, 12);

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
  const clientRows = Object.values(clientStats).sort((a,b) => b.earned - a.earned || b.minutes - a.minutes);

  // Revenue by client (paid invoices)
  const clientRevenue: Record<string, number> = {};
  for (const inv of invoices) {
    const total = inv.lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0);
    clientRevenue[inv.client.name] = (clientRevenue[inv.client.name] ?? 0) + total;
  }
  const clientRevenueRows = Object.entries(clientRevenue).sort((a,b) => b[1] - a[1]);

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-semibold">Reports</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Revenue by Month</CardTitle></CardHeader>
          <CardContent>
            {revenueMonths.length === 0 ? <p className="text-sm text-muted-foreground">No paid invoices yet.</p> : (
              <div className="space-y-1">
                {revenueMonths.map(([month, total]) => (
                  <div key={month} className="flex justify-between text-sm py-1.5 border-b last:border-0">
                    <span className="text-muted-foreground">{month}</span>
                    <span className="font-medium tabular-nums">{formatCurrency(total)}</span>
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
              <div className="space-y-1">
                {clientRevenueRows.map(([name, total]) => (
                  <div key={name} className="flex justify-between text-sm py-1.5 border-b last:border-0">
                    <span className="text-muted-foreground truncate">{name}</span>
                    <span className="font-medium tabular-nums">{formatCurrency(total)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
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
