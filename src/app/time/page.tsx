import { prisma } from "@/lib/db";
import { formatDate, formatDuration } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { NewTimeEntryButton } from "@/components/new-time-entry-button";

export default async function TimePage() {
  const [entries, projects] = await Promise.all([
    prisma.timeEntry.findMany({
      orderBy: { startTime: "desc" },
      include: {
        project: { select: { id: true, name: true, client: { select: { name: true } } } },
      },
    }),
    prisma.project.findMany({
      where: { status: "active" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, client: { select: { name: true } } },
    }),
  ]);

  const totalMinutes = entries.reduce((s, e) => s + (e.durationMin ?? 0), 0);

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Time</h1>
          {totalMinutes > 0 && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {formatDuration(totalMinutes)} logged total
            </p>
          )}
        </div>
        <NewTimeEntryButton projects={projects} />
      </div>

      {entries.length === 0 ? (
        <p className="text-muted-foreground text-sm">No time entries yet.</p>
      ) : (
        <div className="rounded-lg border divide-y">
          {entries.map((e) => (
            <div key={e.id} className="flex items-center justify-between px-4 py-3 gap-3 text-sm">
              <div className="flex-1 min-w-0">
                <p>{e.description || <span className="text-muted-foreground italic">no description</span>}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{e.project.client.name} / {e.project.name}</p>
              </div>
              <span className="text-muted-foreground shrink-0">{formatDate(e.startTime)}</span>
              <Badge variant="secondary" className="shrink-0">
                {e.durationMin ? formatDuration(e.durationMin) : "—"}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
