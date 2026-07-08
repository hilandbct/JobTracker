export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, formatDuration } from "@/lib/format";
import Link from "next/link";
import { EditProjectButton } from "@/components/edit-project-button";
import { NewInvoiceButton } from "@/components/new-invoice-button";
import { NotesPanel } from "@/components/notes-panel";
import { TodosPanel } from "@/components/todos-panel";
import { TimeEntriesPanel } from "@/components/time-entries-panel";
import { MaterialsPanel } from "@/components/materials-panel";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [project, clients, allProjects] = await Promise.all([
    prisma.project.findUnique({
      where: { id: Number(id) },
      include: {
        client: true,
        timeEntries: { orderBy: { startTime: "desc" } },
        materials: { orderBy: { createdAt: "desc" } },
        notes: { orderBy: { createdAt: "desc" } },
        todos: { orderBy: [{ completed: "asc" }, { createdAt: "desc" }] },
      },
    }),
    prisma.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.project.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, clientId: true } }),
  ]);
  if (!project) notFound();

  const totalMinutes = project.timeEntries.reduce((s, e) => s + (e.durationMin ?? 0), 0);
  const unbilledMinutes = project.timeEntries.filter((e) => !e.billed).reduce((s, e) => s + (e.durationMin ?? 0), 0);
  const totalEarned =
    project.hourlyRate && totalMinutes > 0
      ? (totalMinutes / 60) * project.hourlyRate
      : null;
  const unbilledEarned =
    project.hourlyRate && unbilledMinutes > 0
      ? (unbilledMinutes / 60) * project.hourlyRate
      : null;

  // Build default invoice line items from unbilled time entries only
  const unbilledEntries = project.timeEntries.filter((e) => e.durationMin && e.durationMin > 0 && !e.billed);
  const timeLineItems = unbilledEntries.map((e) => ({
    description: e.description || "Time",
    quantity: Math.round((e.durationMin! / 60) * 100) / 100,
    unitPrice: project.hourlyRate ?? 0,
  }));
  const unbilledEntryIds = unbilledEntries.map((e) => e.id);

  const totalMaterialsCost = project.materials.reduce((s, m) => s + m.quantity * m.unitCost, 0);
  const unbilledMaterials = project.materials.filter((m) => !m.billed);
  const unbilledMaterialsCost = unbilledMaterials.reduce((s, m) => s + m.quantity * m.unitCost, 0);
  const materialLineItems = unbilledMaterials.map((m) => ({
    description: m.description,
    quantity: m.quantity,
    unitPrice: m.unitCost,
  }));
  const unbilledMaterialIds = unbilledMaterials.map((m) => m.id);

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          <Link href={`/clients/${project.clientId}`} className="text-muted-foreground hover:underline text-sm">
            {project.client.name}
          </Link>
          {project.description && <p className="text-sm mt-1 text-muted-foreground">{project.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={project.status === "active" ? "default" : "secondary"}>{project.status}</Badge>
          <NewInvoiceButton
            clients={clients}
            projects={allProjects}
            defaultClientId={project.clientId}
            defaultProjectId={project.id}
            defaultLineItems={[...timeLineItems, ...materialLineItems]}
            timeEntryIds={unbilledEntryIds}
            materialIds={unbilledMaterialIds}
          />
          <EditProjectButton project={project} clients={clients} />
        </div>
      </div>

      {(() => {
        const hasRate = !!(project.hourlyRate || project.fixedPrice);
        const hasMaterials = project.materials.length > 0;
        const cardCount = 1 + (hasRate ? 2 : 0) + (hasMaterials ? 1 : 0);
        const gridClass = cardCount >= 4 ? "grid-cols-4" : cardCount === 3 ? "grid-cols-3" : cardCount === 2 ? "grid-cols-2" : "grid-cols-1 max-w-[200px]";
        return (
          <div className={`grid gap-3 ${gridClass}`}>
            {hasRate && (
              <div className="rounded-xl border bg-card px-4 py-3">
                <p className="text-xs text-muted-foreground mb-1">{project.fixedPrice ? "Fixed Price" : "Rate"}</p>
                <p className="text-xl font-semibold tabular-nums">
                  {project.fixedPrice ? formatCurrency(project.fixedPrice) : `${formatCurrency(project.hourlyRate!)}/hr`}
                </p>
              </div>
            )}
            <div className="rounded-xl border bg-card px-4 py-3">
              <p className="text-xs text-muted-foreground mb-1">Time Logged</p>
              <p className="text-xl font-semibold tabular-nums">{totalMinutes > 0 ? formatDuration(totalMinutes) : "—"}</p>
              {unbilledMinutes < totalMinutes && unbilledMinutes > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">{formatDuration(unbilledMinutes)} unbilled</p>
              )}
              {unbilledMinutes === 0 && totalMinutes > 0 && (
                <p className="text-xs text-emerald-600 mt-0.5">All billed</p>
              )}
            </div>
            {hasMaterials && (
              <div className="rounded-xl border bg-card px-4 py-3">
                <p className="text-xs text-muted-foreground mb-1">Materials</p>
                <p className="text-xl font-semibold tabular-nums">{formatCurrency(totalMaterialsCost)}</p>
                {unbilledMaterialsCost > 0 && unbilledMaterialsCost < totalMaterialsCost && (
                  <p className="text-xs text-muted-foreground mt-0.5">{formatCurrency(unbilledMaterialsCost)} unbilled</p>
                )}
                {unbilledMaterialsCost === 0 && totalMaterialsCost > 0 && (
                  <p className="text-xs text-emerald-600 mt-0.5">All billed</p>
                )}
              </div>
            )}
            {hasRate && (
              <div className="rounded-xl border bg-card px-4 py-3">
                <p className="text-xs text-muted-foreground mb-1">Earned</p>
                <p className="text-xl font-semibold tabular-nums">{totalEarned ? formatCurrency(totalEarned) : "—"}</p>
                {unbilledEarned && unbilledEarned < totalEarned! && (
                  <p className="text-xs text-muted-foreground mt-0.5">{formatCurrency(unbilledEarned)} unbilled</p>
                )}
                {!unbilledEarned && totalEarned && (
                  <p className="text-xs text-emerald-600 mt-0.5">All billed</p>
                )}
              </div>
            )}
          </div>
        );
      })()}

      <Tabs defaultValue="time">
        <TabsList>
          <TabsTrigger value="time">Time ({project.timeEntries.length})</TabsTrigger>
          <TabsTrigger value="materials">Materials ({project.materials.length})</TabsTrigger>
          <TabsTrigger value="notes">Notes ({project.notes.length})</TabsTrigger>
          <TabsTrigger value="todos">To-Dos ({project.todos.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="time" className="mt-4">
          <TimeEntriesPanel projectId={project.id} initialEntries={project.timeEntries} hourlyRate={project.hourlyRate} />
        </TabsContent>

        <TabsContent value="materials" className="mt-4">
          <MaterialsPanel projectId={project.id} initialMaterials={project.materials} />
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <NotesPanel projectId={project.id} initialNotes={project.notes} />
        </TabsContent>

        <TabsContent value="todos" className="mt-4">
          <TodosPanel projectId={project.id} initialTodos={project.todos} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
