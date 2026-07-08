"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/format";
import { Plus, Trash2, Receipt, Pencil, CheckCheck } from "lucide-react";

type Material = {
  id: number;
  description: string;
  quantity: number;
  unitCost: number;
  billed: boolean;
};

export function MaterialsPanel({
  projectId,
  initialMaterials,
}: {
  projectId: number;
  initialMaterials: Material[];
}) {
  const [materials, setMaterials] = useState(initialMaterials);
  const [open, setOpen] = useState(false);
  // editing holds the item through the close animation; editOpen drives the dialog
  const [editing, setEditing] = useState<Material | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  async function addMaterial(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/materials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        description: fd.get("description"),
        quantity: Number(fd.get("quantity") || 1),
        unitCost: Number(fd.get("unitCost") || 0),
      }),
    });
    const material = await res.json();
    setMaterials([material, ...materials]);
    setOpen(false);
  }

  async function saveEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/materials/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: fd.get("description"),
        quantity: Number(fd.get("quantity") || 1),
        unitCost: Number(fd.get("unitCost") || 0),
      }),
    });
    const updated = await res.json();
    setMaterials(materials.map((m) => (m.id === updated.id ? updated : m)));
    setEditOpen(false);
  }

  async function markAllBilled() {
    const unbilled = materials.filter((m) => !m.billed);
    await Promise.all(
      unbilled.map((m) =>
        fetch(`/api/materials/${m.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ billed: true }),
        })
      )
    );
    setMaterials(materials.map((m) => ({ ...m, billed: true })));
  }

  async function deleteMaterial(id: number) {
    await fetch(`/api/materials/${id}`, { method: "DELETE" });
    setMaterials(materials.filter((m) => m.id !== id));
  }

  async function toggleBilled(id: number, current: boolean) {
    const res = await fetch(`/api/materials/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ billed: !current }),
    });
    const updated = await res.json();
    setMaterials(materials.map((m) => (m.id === id ? { ...m, billed: updated.billed } : m)));
  }

  const unbilledCost = materials.filter((m) => !m.billed).reduce((s, m) => s + m.quantity * m.unitCost, 0);
  const billedCost = materials.filter((m) => m.billed).reduce((s, m) => s + m.quantity * m.unitCost, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Material
        </Button>
      </div>

      {materials.length === 0 ? (
        <p className="text-sm text-muted-foreground">No materials logged yet.</p>
      ) : (
        <>
          <ul className="space-y-1">
            {materials.map((m) => (
              <li
                key={m.id}
                className={`flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/40 group text-sm gap-2 ${m.billed ? "opacity-50" : ""}`}
              >
                <span className="flex-1 truncate">{m.description}</span>
                <span className="text-muted-foreground shrink-0">{m.quantity} × {formatCurrency(m.unitCost)}</span>
                <span className="font-medium shrink-0 w-20 text-right">{formatCurrency(m.quantity * m.unitCost)}</span>
                <button
                  title={m.billed ? "Mark as unbilled" : "Mark as billed"}
                  onClick={() => toggleBilled(m.id, m.billed)}
                  className={`shrink-0 flex items-center gap-1 text-xs rounded-full px-2 py-0.5 border transition-colors ${
                    m.billed
                      ? "border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100"
                      : "border-transparent text-muted-foreground opacity-0 group-hover:opacity-100 hover:border-border hover:bg-muted"
                  }`}
                >
                  <Receipt className="h-3 w-3" />
                  {m.billed ? "Billed" : "Bill"}
                </button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                  onClick={() => { setEditing(m); setEditOpen(true); }}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive shrink-0"
                  onClick={() => deleteMaterial(m.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </li>
            ))}
          </ul>

          {(billedCost > 0 || unbilledCost > 0) && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 border-t">
              {unbilledCost > 0 && (
                <span>
                  Unbilled: <span className="font-medium text-foreground">{formatCurrency(unbilledCost)}</span>
                </span>
              )}
              {billedCost > 0 && (
                <span>
                  Billed: <span className="font-medium text-foreground">{formatCurrency(billedCost)}</span>
                </span>
              )}
              {unbilledCost > 0 && (
                <button
                  onClick={markAllBilled}
                  className="ml-auto flex items-center gap-1 text-emerald-600 hover:underline"
                >
                  <CheckCheck className="h-3 w-3" /> Mark all billed
                </button>
              )}
            </div>
          )}
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Material</DialogTitle></DialogHeader>
          <form onSubmit={addMaterial} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="quantity">Quantity</Label>
                <Input id="quantity" name="quantity" type="number" min="0" step="0.01" defaultValue="1" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="unitCost">Unit Cost</Label>
                <Input id="unitCost" name="unitCost" type="number" min="0" step="0.01" defaultValue="0" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Edit Material</DialogTitle></DialogHeader>
          {editing && (
            <form key={editing.id} onSubmit={saveEdit} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="edit-description">Description</Label>
                <Input id="edit-description" name="description" defaultValue={editing.description} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="edit-quantity">Quantity</Label>
                  <Input id="edit-quantity" name="quantity" type="number" min="0" step="0.01" defaultValue={editing.quantity} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-unitCost">Unit Cost</Label>
                  <Input id="edit-unitCost" name="unitCost" type="number" min="0" step="0.01" defaultValue={editing.unitCost} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
