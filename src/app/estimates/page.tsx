import { prisma } from "@/lib/db";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { NewEstimateButton } from "@/components/new-estimate-button";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "outline",
  sent: "secondary",
  accepted: "default",
  declined: "destructive",
};

export default async function EstimatesPage() {
  const [estimates, clients, projects] = await Promise.all([
    prisma.estimate.findMany({
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
        <h1 className="text-2xl font-semibold">Estimates</h1>
        <NewEstimateButton clients={clients} projects={projects} />
      </div>

      {estimates.length === 0 ? (
        <p className="text-muted-foreground text-sm">No estimates yet.</p>
      ) : (
        <div className="rounded-lg border divide-y">
          {estimates.map((est) => {
            const total = est.lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0);
            return (
              <Link key={est.id} href={`/estimates/${est.id}`}>
                <div className="flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors cursor-pointer gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{est.number}</p>
                    <p className="text-sm text-muted-foreground">{est.client.name}{est.project ? ` · ${est.project.name}` : ""}</p>
                  </div>
                  <span className="text-sm text-muted-foreground shrink-0">{formatDate(est.issueDate)}</span>
                  <span className="font-medium shrink-0">{formatCurrency(total)}</span>
                  <Badge variant={statusVariant[est.status] ?? "outline"} className="shrink-0">{est.status}</Badge>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
