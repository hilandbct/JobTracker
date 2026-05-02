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

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [project, clients, allProjects] = await Promise.all([
    prisma.project.findUnique({
      where: { id: Number(id) },
      include: {
        client: true,
        timeEntries: { orderBy: { startTime: "desc" } },
        notes: { orderBy: { createdAt: "desc" } },
        todos: { orderBy: [{ completed: "asc" }, { createdAt: "desc" }] },
      },
    }),
    prisma.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.project.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, clientId: true } }),
  ]);
  if (!project) notFound();

  const totalMinutes = project.timeEntries.reduce((s, e) => s + (e.durationMin ?? 0), 0);
  const totalEarned =
    project.hourlyRate && totalMinutes > 0
      ? (totalMinutes / 60) * project.hourlyRate
      : null;

  // Build default invoice line items from time entries with a recorded duration
  const timeLineItems = project.timeEntries
    .filter((e) => e.durationMin && e.durationMin > 0)
    .map((e) => ({
      description: e.description || "Time",
      quantity: Math.round((e.durationMin! / 60) * 100) / 100,
      unitPrice: project.hourlyRate ?? 0,
    }));

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          <Link href={`/clients/${project.clientId}`} className="text-muted-foreground hover:underline text-sm">
            {project.client.name}
          </Link>
          {project.description && <p className="text-sm mt-1">{project.description}</p>}
          <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
            {project.hourlyRate && <span>{formatCurrency(project.hourlyRate)}/hr</span>}
            {project.fixedPrice && <span>{formatCurrency(project.fixedPrice)} fixed</span>}
            {totalMinutes > 0 && <span>{formatDuration(totalMinutes)} logged</span>}
            {totalEarned && <span>{formatCurrency(totalEarned)} earned</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={project.status === "active" ? "default" : "secondary"}>{project.status}</Badge>
          <NewInvoiceButton
            clients={clients}
            projects={allProjects}
            defaultClientId={project.clientId}
            defaultProjectId={project.id}
            defaultLineItems={timeLineItems}
          />
          <EditProjectButton project={project} clients={clients} />
        </div>
      </div>

      <Tabs defaultValue="time">
        <TabsList>
          <TabsTrigger value="time">Time ({project.timeEntries.length})</TabsTrigger>
          <TabsTrigger value="notes">Notes ({project.notes.length})</TabsTrigger>
          <TabsTrigger value="todos">To-Dos ({project.todos.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="time" className="mt-4">
          <TimeEntriesPanel projectId={project.id} initialEntries={project.timeEntries} hourlyRate={project.hourlyRate} />
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
