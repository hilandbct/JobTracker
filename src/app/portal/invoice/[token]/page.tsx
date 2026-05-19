import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PortalInvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { portalToken: token },
    include: { client: true, project: { select: { name: true } }, lineItems: true },
  });
  if (!invoice) notFound();

  const settingsRows = await prisma.setting.findMany();
  const biz = Object.fromEntries(settingsRows.map(r => [r.key, r.value]));

  const total = invoice.lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0);

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border p-8 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            {biz.biz_name && <p className="font-semibold text-base">{biz.biz_name}</p>}
            {biz.biz_address && <p className="text-sm text-gray-500">{biz.biz_address}</p>}
            {(biz.biz_city || biz.biz_state) && (
              <p className="text-sm text-gray-500">{[biz.biz_city, biz.biz_state, biz.biz_zip].filter(Boolean).join(", ")}</p>
            )}
            {biz.biz_email && <p className="text-sm text-gray-500">{biz.biz_email}</p>}
            <h1 className="text-2xl font-bold mt-4">INVOICE</h1>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Invoice #</p>
            <p className="font-semibold">{invoice.number}</p>
            <p className="text-sm text-gray-500 mt-2">Issued</p>
            <p className="text-sm">{formatDate(invoice.issueDate)}</p>
            {invoice.dueDate && (<><p className="text-sm text-gray-500 mt-1">Due</p><p className="text-sm">{formatDate(invoice.dueDate)}</p></>)}
            <p className="text-sm text-gray-500 mt-3">Bill To</p>
            <p className="font-medium">{invoice.client.name}</p>
            {invoice.client.company && <p className="text-sm text-gray-500">{invoice.client.company}</p>}
            {invoice.client.email && <p className="text-sm text-gray-500">{invoice.client.email}</p>}
          </div>
        </div>

        <table className="w-full text-sm border-t pt-4">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 font-medium">Description</th>
              <th className="text-right py-2 font-medium w-12">Qty</th>
              <th className="text-right py-2 font-medium w-24">Unit Price</th>
              <th className="text-right py-2 font-medium w-24">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((li) => (
              <tr key={li.id} className="border-b border-gray-100">
                <td className="py-2">{li.description}</td>
                <td className="py-2 text-right tabular-nums">{li.quantity}</td>
                <td className="py-2 text-right tabular-nums">{formatCurrency(li.unitPrice)}</td>
                <td className="py-2 text-right tabular-nums">{formatCurrency(li.quantity * li.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="py-3 text-right font-semibold">Total</td>
              <td className="py-3 text-right font-semibold text-lg tabular-nums">{formatCurrency(total)}</td>
            </tr>
          </tfoot>
        </table>

        {invoice.notes && (
          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-1">Notes</p>
            <p className="text-sm text-gray-500 whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}
        {biz.biz_payment_terms && (
          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-1">Payment Terms</p>
            <p className="text-sm text-gray-500 whitespace-pre-wrap">{biz.biz_payment_terms}</p>
          </div>
        )}
      </div>
    </div>
  );
}
