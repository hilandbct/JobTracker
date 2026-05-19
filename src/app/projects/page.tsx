export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NewProjectButton } from "@/components/new-project-button";
import { formatCurrency, formatDuration } from "@/lib/format";

function ProjectCard({ p }: { p: {
  id: number; name: string; description: string | null;
  status: string; hourlyRate: number | null; fixedPrice: number | null;
  client: { name: string };
  timeEntries: { durationMin: number | null }[];
}}) {
  const totalMin = p.timeEntries.reduce((s, e) => s + (e.durationMin ?? 0), 0);
  const earned = p.hourlyRate && totalMin > 0 ? (totalMin / 60) * p.hourlyRate : null;
  return (
    <Link href={`/projects/${p.id}`}>
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
            {p.hourlyRate && <span>{formatCurrency(p.hourlyRate)}/hr</span>}
            {p.fixedPrice && <span>{formatCurrency(p.fixedPrice)} fixed</span>}
            {totalMin > 0 && <span className="tabular-nums">{formatDuration(totalMin)}</span>}
            {earned && <span className="tabular-nums font-medium text-foreground">{formatCurrency(earned)}</span>}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function Section({ title, projects }: { title: string; projects: Parameters<typeof ProjectCard>[0]["p"][] }) {
  if (projects.length === 0) return null;
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{title}</h2>
      <div className="grid gap-3">
        {projects.map((p) => <ProjectCard key={p.id} p={p} />)}
      </div>
    </div>
  );
}

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

  const active    = projects.filter((p) => p.status === "active");
  const completed = projects.filter((p) => p.status === "completed");
  const onHold    = projects.filter((p) => p.status === "on-hold");

  return (
    <div className="space-y-7 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <NewProjectButton clients={clients} />
      </div>

      {projects.length === 0 ? (
        <p className="text-muted-foreground text-sm">No projects yet.</p>
      ) : (
        <div className="space-y-7">
          <Section title="Active" projects={active} />
          <Section title="Completed" projects={completed} />
          <Section title="On Hold" projects={onHold} />
        </div>
      )}
    </div>
  );
}
