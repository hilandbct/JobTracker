export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { InvoiceActions } from "@/components/invoice-actions";
import { hasLogo } from "@/lib/logo";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "outline",
  sent: "secondary",
  paid: "default",
  overdue: "destructive",
};

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id: Number(id) },
    include: {
      client: true,
      project: { select: { id: true, name: true } },
      lineItems: true,
    },
  });
  if (!invoice) notFound();

  const total = invoice.lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0);
  const showLogo = hasLogo();
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "JobTracker";

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{invoice.number}</h1>
            <Badge variant={statusVariant[invoice.status] ?? "outline"}>{invoice.status}</Badge>
          </div>
          <p className="text-muted-foreground mt-0.5">{invoice.client.name}{invoice.project ? ` · ${invoice.project.name}` : ""}</p>
        </div>
        <InvoiceActions invoice={invoice} />
      </div>

      <div className="rounded-lg border p-6 space-y-6 bg-card text-card-foreground">
        <div className="flex justify-between">
          <div>
            {showLogo
              ? <img src="/logo-black.png" alt={appName} className="h-12 w-auto mb-3" />
              : <p className="font-semibold text-base mb-3">{appName}</p>
            }
            <p className="font-semibold text-lg">{invoice.client.name}</p>
            {invoice.client.company && <p className="text-muted-foreground">{invoice.client.company}</p>}
            {invoice.client.address && <p className="text-sm text-muted-foreground">{invoice.client.address}</p>}
            {(invoice.client.city || invoice.client.state) && (
              <p className="text-sm text-muted-foreground">
                {[invoice.client.city, invoice.client.state, invoice.client.zip].filter(Boolean).join(", ")}
              </p>
            )}
            {invoice.client.email && <p className="text-sm text-muted-foreground mt-1">{invoice.client.email}</p>}
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Invoice #</p>
            <p className="font-medium">{invoice.number}</p>
            <p className="text-sm text-muted-foreground mt-2">Issued</p>
            <p className="text-sm">{formatDate(invoice.issueDate)}</p>
            {invoice.dueDate && (
              <>
                <p className="text-sm text-muted-foreground mt-1">Due</p>
                <p className="text-sm">{formatDate(invoice.dueDate)}</p>
              </>
            )}
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 pr-3 font-medium">Description</th>
              <th className="text-right py-2 px-3 font-medium w-12">Qty</th>
              <th className="text-right py-2 px-3 font-medium w-24">Unit Price</th>
              <th className="text-right py-2 pl-3 font-medium w-24">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((li) => (
              <tr key={li.id} className="border-b border-muted">
                <td className="py-2 pr-3">{li.description}</td>
                <td className="py-2 px-3 text-right tabular-nums">{li.quantity}</td>
                <td className="py-2 px-3 text-right tabular-nums">{formatCurrency(li.unitPrice)}</td>
                <td className="py-2 pl-3 text-right tabular-nums">{formatCurrency(li.quantity * li.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="py-3 pr-3 text-right font-semibold">Total</td>
              <td className="py-3 pl-3 text-right font-semibold text-lg tabular-nums">{formatCurrency(total)}</td>
            </tr>
          </tfoot>
        </table>

        {invoice.notes && (
          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-1">Notes</p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
