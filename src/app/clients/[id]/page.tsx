export const dynamic = "force-dynamic";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/format";
import Link from "next/link";
import { EditClientButton } from "@/components/edit-client-button";
import { NotesPanel } from "@/components/notes-panel";
import { TodosPanel } from "@/components/todos-panel";

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await prisma.client.findUnique({
    where: { id: Number(id) },
    include: {
      projects: { orderBy: { createdAt: "desc" } },
      invoices: {
        orderBy: { issueDate: "desc" },
        include: { lineItems: true },
      },
      estimates: {
        orderBy: { issueDate: "desc" },
        include: { lineItems: true },
      },
      clientNotes: { orderBy: { createdAt: "desc" } },
      todos: { orderBy: [{ completed: "asc" }, { createdAt: "desc" }] },
    },
  });
  if (!client) notFound();

  const statusColor: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    draft: "outline",
    sent: "secondary",
    paid: "default",
    overdue: "destructive",
  };

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{client.name}</h1>
          {client.company && <p className="text-muted-foreground">{client.company}</p>}
          <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
            {client.email && <span>{client.email}</span>}
            {client.phone && <span>{client.phone}</span>}
          </div>
          {(client.address || client.city) && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {[client.address, client.city, client.state, client.zip].filter(Boolean).join(", ")}
            </p>
          )}
        </div>
        <EditClientButton client={client} />
      </div>

      <Tabs defaultValue="projects">
        <TabsList>
          <TabsTrigger value="projects">Projects ({client.projects.length})</TabsTrigger>
          <TabsTrigger value="invoices">Invoices ({client.invoices.length})</TabsTrigger>
          <TabsTrigger value="estimates">Estimates ({client.estimates.length})</TabsTrigger>
          <TabsTrigger value="notes">Notes ({client.clientNotes.length})</TabsTrigger>
          <TabsTrigger value="todos">To-Dos ({client.todos.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="mt-4 space-y-2">
          {client.projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No projects.</p>
          ) : (
            client.projects.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`}>
                <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/40 transition-colors cursor-pointer">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {p.hourlyRate && <span className="text-sm text-muted-foreground">{formatCurrency(p.hourlyRate)}/hr</span>}
                    <Badge variant={p.status === "active" ? "default" : "secondary"}>{p.status}</Badge>
                  </div>
                </div>
              </Link>
            ))
          )}
        </TabsContent>

        <TabsContent value="invoices" className="mt-4 space-y-2">
          {client.invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No invoices.</p>
          ) : (
            client.invoices.map((inv) => {
              const total = inv.lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0);
              return (
                <Link key={inv.id} href={`/invoices/${inv.id}`}>
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/40 transition-colors cursor-pointer">
                    <div>
                      <p className="font-medium">{inv.number}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(inv.issueDate)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{formatCurrency(total)}</span>
                      <Badge variant={statusColor[inv.status] ?? "outline"}>{inv.status}</Badge>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="estimates" className="mt-4 space-y-2">
          {client.estimates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No estimates.</p>
          ) : (
            client.estimates.map((est) => {
              const total = est.lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0);
              return (
                <Link key={est.id} href={`/estimates/${est.id}`}>
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/40 transition-colors cursor-pointer">
                    <div>
                      <p className="font-medium">{est.number}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(est.issueDate)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{formatCurrency(total)}</span>
                      <Badge variant={statusColor[est.status] ?? "outline"}>{est.status}</Badge>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <NotesPanel clientId={client.id} initialNotes={client.clientNotes} />
        </TabsContent>

        <TabsContent value="todos" className="mt-4">
          <TodosPanel clientId={client.id} initialTodos={client.todos} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
