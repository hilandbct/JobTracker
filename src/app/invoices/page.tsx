import { prisma } from "@/lib/db";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { NewInvoiceButton } from "@/components/new-invoice-button";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "outline",
  sent: "secondary",
  paid: "default",
  overdue: "destructive",
};

export default async function InvoicesPage() {
  const [invoices, clients, projects] = await Promise.all([
    prisma.invoice.findMany({
      orderBy: { issueDate: "desc" },
      include: {
        client: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        lineItems: true,
      },
    }),
    prisma.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.project.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, clientId: true } }),
  ]);

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Invoices</h1>
        <NewInvoiceButton clients={clients} projects={projects} />
      </div>

      {invoices.length === 0 ? (
        <p className="text-muted-foreground text-sm">No invoices yet.</p>
      ) : (
        <div className="rounded-lg border divide-y">
          {invoices.map((inv) => {
            const total = inv.lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0);
            return (
              <Link key={inv.id} href={`/invoices/${inv.id}`}>
                <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors cursor-pointer gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{inv.number}</p>
                    <p className="text-sm text-muted-foreground">{inv.client.name}{inv.project ? ` · ${inv.project.name}` : ""}</p>
                  </div>
                  <span className="text-sm text-muted-foreground shrink-0">{formatDate(inv.issueDate)}</span>
                  <span className="font-medium shrink-0">{formatCurrency(total)}</span>
                  <Badge variant={statusVariant[inv.status] ?? "outline"} className="shrink-0">{inv.status}</Badge>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
