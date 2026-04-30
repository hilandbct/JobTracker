"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Pencil, Trash2, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { buttonVariants } from "@/components/ui/button";

type LineItem = { id: number; description: string; quantity: number; unitPrice: number };
type Estimate = {
  id: number;
  number: string;
  status: string;
  issueDate: Date | string;
  expiryDate: Date | string | null;
  notes: string | null;
  clientId: number;
  projectId: number | null;
  lineItems: LineItem[];
};

export function EstimateActions({ estimate }: { estimate: Estimate }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(estimate.status);
  const [items, setItems] = useState<Omit<LineItem, "id">[]>(estimate.lineItems);
  const router = useRouter();

  function updateItem(i: number, field: string, value: string | number) {
    setItems(items.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  }

  const total = items.reduce((s, li) => s + li.quantity * li.unitPrice, 0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const data = {
      status,
      issueDate: fd.get("issueDate"),
      expiryDate: fd.get("expiryDate") || null,
      notes: fd.get("notes") || null,
      lineItems: items.filter((li) => li.description.trim()),
    };
    await fetch(`/api/estimates/${estimate.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(false);
    setOpen(false);
    router.refresh();
  }

  async function handleDelete() {
    await fetch(`/api/estimates/${estimate.id}`, { method: "DELETE" });
    router.push("/estimates");
    router.refresh();
  }

  const issueDateStr = estimate.issueDate ? new Date(estimate.issueDate).toISOString().split("T")[0] : "";
  const expiryDateStr = estimate.expiryDate ? new Date(estimate.expiryDate).toISOString().split("T")[0] : "";

  return (
    <div className="flex gap-2">
      <a
        href={`/api/estimates/${estimate.id}/pdf`}
        download
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        <Download className="h-3.5 w-3.5 mr-1" /> PDF
      </a>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
      </Button>
      <AlertDialog>
        <AlertDialogTrigger className={buttonVariants({ variant: "ghost", size: "sm" }) + " text-destructive hover:text-destructive"}>
          <Trash2 className="h-3.5 w-3.5" />
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete estimate?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete {estimate.number}.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Estimate</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="issueDate">Issue Date</Label>
                <Input id="issueDate" name="issueDate" type="date" defaultValue={issueDateStr} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="expiryDate">Valid Until</Label>
                <Input id="expiryDate" name="expiryDate" type="date" defaultValue={expiryDateStr} />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v ?? "")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="declined">Declined</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Line Items</Label>
                <Button type="button" size="sm" variant="outline" onClick={() => setItems([...items, { description: "", quantity: 1, unitPrice: 0 }])}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add
                </Button>
              </div>
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-[1fr_60px_80px_24px] gap-2 items-center">
                  <Input placeholder="Description" value={item.description} onChange={(e) => updateItem(i, "description", e.target.value)} />
                  <Input type="number" min="0" step="0.01" value={item.quantity} onChange={(e) => updateItem(i, "quantity", Number(e.target.value))} />
                  <Input type="number" min="0" step="0.01" value={item.unitPrice} onChange={(e) => updateItem(i, "unitPrice", Number(e.target.value))} />
                  <Button type="button" size="icon" variant="ghost" className="h-8 w-6 text-destructive" onClick={() => setItems(items.filter((_, idx) => idx !== i))}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <div className="text-right text-sm font-medium">Total: {formatCurrency(total)}</div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" rows={2} defaultValue={estimate.notes ?? ""} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
