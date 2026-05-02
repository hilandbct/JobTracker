"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

type Client = { id: number; name: string };
type Project = { id: number; name: string; clientId: number };

type LineItem = { description: string; quantity: number; unitPrice: number };

export function NewInvoiceButton({
  clients,
  projects,
  defaultClientId,
  defaultProjectId,
  defaultLineItems,
}: {
  clients: Client[];
  projects: Project[];
  defaultClientId?: number;
  defaultProjectId?: number;
  defaultLineItems?: LineItem[];
}) {
  const emptyItem: LineItem = { description: "", quantity: 1, unitPrice: 0 };
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clientId, setClientId] = useState(defaultClientId ? String(defaultClientId) : "");
  const [projectId, setProjectId] = useState(defaultProjectId ? String(defaultProjectId) : "");
  const [items, setItems] = useState<LineItem[]>(defaultLineItems?.length ? defaultLineItems : [emptyItem]);
  const router = useRouter();

  const filteredProjects = projects.filter((p) => !clientId || p.clientId === Number(clientId));

  function updateItem(i: number, field: keyof LineItem, value: string | number) {
    setItems(items.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  }

  function addItem() {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0 }]);
  }

  function removeItem(i: number) {
    setItems(items.filter((_, idx) => idx !== i));
  }

  const total = items.reduce((s, li) => s + li.quantity * li.unitPrice, 0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!clientId) return;
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const data = {
      clientId: Number(clientId),
      projectId: projectId ? Number(projectId) : null,
      status: fd.get("status") || "draft",
      issueDate: fd.get("issueDate") || new Date().toISOString().split("T")[0],
      dueDate: fd.get("dueDate") || null,
      notes: fd.get("notes") || null,
      lineItems: items.filter((li) => li.description.trim()),
    };
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(false);
    if (res.ok) {
      const inv = await res.json();
      setOpen(false);
      router.push(`/invoices/${inv.id}`);
      router.refresh();
    }
  }

  return (
    <>
      <Button onClick={() => { setItems(defaultLineItems?.length ? defaultLineItems : [emptyItem]); setOpen(true); }} size="sm" disabled={clients.length === 0}>
        <Plus className="h-4 w-4 mr-1" /> New Invoice
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Invoice</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Client *</Label>
                <Select value={clientId} onValueChange={(v) => { setClientId(v ?? ""); setProjectId(""); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client">
                      {(v: string | null) => v ? clients.find(c => String(c.id) === v)?.name ?? null : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Project</Label>
                <Select value={projectId} onValueChange={(v) => setProjectId(v ?? "")} disabled={!clientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Optional">
                      {(v: string | null) => v ? filteredProjects.find(p => String(p.id) === v)?.name ?? null : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {filteredProjects.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="issueDate">Issue Date</Label>
                <Input id="issueDate" name="issueDate" type="date" defaultValue={new Date().toISOString().split("T")[0]} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input id="dueDate" name="dueDate" type="date" />
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select name="status" defaultValue="draft">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Line Items</Label>
                <Button type="button" size="sm" variant="outline" onClick={addItem}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add
                </Button>
              </div>
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-[1fr_60px_80px_24px] gap-2 items-center">
                  <Input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateItem(i, "description", e.target.value)}
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateItem(i, "quantity", Number(e.target.value))}
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Price"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(i, "unitPrice", Number(e.target.value))}
                  />
                  <Button type="button" size="icon" variant="ghost" className="h-8 w-6 text-destructive" onClick={() => removeItem(i)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <div className="text-right text-sm font-medium">
                Total: {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(total)}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" rows={2} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving || !clientId}>{saving ? "Saving…" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
