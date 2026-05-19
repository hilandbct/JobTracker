export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NewProjectButton } from "@/components/new-project-button";
import { formatCurrency, formatDuration } from "@/lib/format";

export default async function ProjectsPage() {
  const [projects, clients] = await Promise.all([
    prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, name: true } },
        timeEntries: { select: { durationMin: true } },
      },
    }),
    prisma.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <NewProjectButton clients={clients} />
      </div>

      {projects.length === 0 ? (
        <p className="text-muted-foreground text-sm">No projects yet.</p>
      ) : (
        <div className="grid gap-3">
          {projects.map((p) => {
            const totalMin = p.timeEntries.reduce((s, e) => s + (e.durationMin ?? 0), 0);
            const earned = p.hourlyRate && totalMin > 0 ? (totalMin / 60) * p.hourlyRate : null;
            return (
              <Link key={p.id} href={`/projects/${p.id}`}>
                <Card className="hover:bg-muted/40 transition-colors cursor-pointer">
                  <CardContent className="py-4 flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{p.name}</p>
                      <p className="text-sm text-muted-foreground">{p.client.name}</p>
                      {p.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{p.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-sm text-muted-foreground">
                      {p.hourlyRate && (
                        <span>{formatCurrency(p.hourlyRate)}/hr</span>
                      )}
                      {p.fixedPrice && (
                        <span>{formatCurrency(p.fixedPrice)} fixed</span>
                      )}
                      {totalMin > 0 && (
                        <span className="tabular-nums">{formatDuration(totalMin)}</span>
                      )}
                      {earned && (
                        <span className="tabular-nums font-medium text-foreground">{formatCurrency(earned)}</span>
                      )}
                      <Badge variant={p.status === "active" ? "default" : "secondary"}>{p.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
