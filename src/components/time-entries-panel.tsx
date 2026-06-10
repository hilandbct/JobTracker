"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatDate, formatDuration, formatCurrency } from "@/lib/format";
import { Plus, Trash2, Play, Square, Receipt, Pencil, CheckCheck } from "lucide-react";

type Entry = {
  id: number;
  description: string | null;
  startTime: Date | string;
  endTime: Date | string | null;
  durationMin: number | null;
  billed: boolean;
};

export function TimeEntriesPanel({
  projectId,
  initialEntries,
  hourlyRate,
}: {
  projectId: number;
  initialEntries: Entry[];
  hourlyRate: number | null;
}) {
  const [entries, setEntries] = useState(initialEntries);
  const [open, setOpen] = useState(false);
  // editing holds the entry through the close animation; editOpen drives the dialog
  const [editing, setEditing] = useState<Entry | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [running, setRunning] = useState<{ startTime: Date; description: string } | null>(null);
  const [runDesc, setRunDesc] = useState("");

  function startTimer() {
    setRunning({ startTime: new Date(), description: runDesc });
  }

  async function stopTimer() {
    if (!running) return;
    const endTime = new Date();
    const durationMin = Math.round((endTime.getTime() - running.startTime.getTime()) / 60000);
    const res = await fetch("/api/time-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        description: running.description || null,
        startTime: running.startTime.toISOString(),
        endTime: endTime.toISOString(),
        durationMin,
      }),
    });
    const entry = await res.json();
    setEntries([entry, ...entries]);
    setRunning(null);
    setRunDesc("");
  }

  async function addManual(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const hours = Number(fd.get("hours") || 0);
    const minutes = Number(fd.get("minutes") || 0);
    const durationMin = hours * 60 + minutes;
    const startTime = fd.get("date") ? new Date((fd.get("date") as string) + "T00:00:00") : new Date();
    const res = await fetch("/api/time-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        description: fd.get("description") || null,
        startTime: startTime.toISOString(),
        durationMin,
      }),
    });
    const entry = await res.json();
    setEntries([entry, ...entries]);
    setOpen(false);
  }

  async function saveEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    const fd = new FormData(e.currentTarget);
    const hours = Number(fd.get("hours") || 0);
    const minutes = Number(fd.get("minutes") || 0);
    const startTime = fd.get("date")
      ? new Date((fd.get("date") as string) + "T00:00:00")
      : new Date(editing.startTime);
    const res = await fetch(`/api/time-entries/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: fd.get("description") || null,
        startTime: startTime.toISOString(),
        durationMin: hours * 60 + minutes,
      }),
    });
    const updated = await res.json();
    setEntries(entries.map((en) => (en.id === updated.id ? updated : en)));
    setEditOpen(false);
  }

  async function markAllBilled() {
    const unbilled = entries.filter((e) => !e.billed);
    await Promise.all(
      unbilled.map((e) =>
        fetch(`/api/time-entries/${e.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ billed: true }),
        })
      )
    );
    setEntries(entries.map((e) => ({ ...e, billed: true })));
  }

  async function deleteEntry(id: number) {
    await fetch(`/api/time-entries/${id}`, { method: "DELETE" });
    setEntries(entries.filter((e) => e.id !== id));
  }

  async function toggleBilled(id: number, current: boolean) {
    const res = await fetch(`/api/time-entries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ billed: !current }),
    });
    const updated = await res.json();
    setEntries(entries.map((e) => (e.id === id ? { ...e, billed: updated.billed } : e)));
  }

  const unbilledMinutes = entries.filter((e) => !e.billed).reduce((s, e) => s + (e.durationMin ?? 0), 0);
  const billedMinutes = entries.filter((e) => e.billed).reduce((s, e) => s + (e.durationMin ?? 0), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <Input
            value={runDesc}
            onChange={(e) => setRunDesc(e.target.value)}
            placeholder="What are you working on?"
            disabled={!!running}
          />
          {running ? (
            <Button size="sm" variant="destructive" onClick={stopTimer}>
              <Square className="h-3.5 w-3.5 mr-1" /> Stop
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={startTimer}>
              <Play className="h-3.5 w-3.5 mr-1" /> Start
            </Button>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Manual
        </Button>
      </div>

      {running && (
        <p className="text-sm text-muted-foreground">
          Timer running since {running.startTime.toLocaleTimeString()}…
        </p>
      )}

      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">No time entries yet.</p>
      ) : (
        <>
          <ul className="space-y-1">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className={`flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/40 group text-sm gap-2 ${entry.billed ? "opacity-50" : ""}`}
              >
                <span className="flex-1 truncate">
                  {entry.description || <span className="italic">no description</span>}
                </span>
                <span className="text-muted-foreground shrink-0">{formatDate(entry.startTime)}</span>
                <span className="font-medium shrink-0 w-16 text-right">
                  {entry.durationMin ? formatDuration(entry.durationMin) : "—"}
                </span>
                <button
                  title={entry.billed ? "Mark as unbilled" : "Mark as billed"}
                  onClick={() => toggleBilled(entry.id, entry.billed)}
                  className={`shrink-0 flex items-center gap-1 text-xs rounded-full px-2 py-0.5 border transition-colors ${
                    entry.billed
                      ? "border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100"
                      : "border-transparent text-muted-foreground opacity-0 group-hover:opacity-100 hover:border-border hover:bg-muted"
                  }`}
                >
                  <Receipt className="h-3 w-3" />
                  {entry.billed ? "Billed" : "Bill"}
                </button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                  onClick={() => { setEditing(entry); setEditOpen(true); }}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive shrink-0"
                  onClick={() => deleteEntry(entry.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </li>
            ))}
          </ul>

          {(billedMinutes > 0 || unbilledMinutes > 0) && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 border-t">
              {unbilledMinutes > 0 && (
                <span>
                  Unbilled: <span className="font-medium text-foreground">{formatDuration(unbilledMinutes)}</span>
                  {hourlyRate ? ` (${formatCurrency((unbilledMinutes / 60) * hourlyRate)})` : ""}
                </span>
              )}
              {billedMinutes > 0 && (
                <span>
                  Billed: <span className="font-medium text-foreground">{formatDuration(billedMinutes)}</span>
                  {hourlyRate ? ` (${formatCurrency((billedMinutes / 60) * hourlyRate)})` : ""}
                </span>
              )}
              {unbilledMinutes > 0 && (
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
          <DialogHeader><DialogTitle>Log Time Manually</DialogTitle></DialogHeader>
          <form onSubmit={addManual} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="date">Date</Label>
              <Input id="date" name="date" type="date" defaultValue={new Date().toLocaleDateString("en-CA")} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="hours">Hours</Label>
                <Input id="hours" name="hours" type="number" min="0" max="24" defaultValue="0" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="minutes">Minutes</Label>
                <Input id="minutes" name="minutes" type="number" min="0" max="59" defaultValue="0" />
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
          <DialogHeader><DialogTitle>Edit Time Entry</DialogTitle></DialogHeader>
          {editing && (
            <form key={editing.id} onSubmit={saveEdit} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="edit-description">Description</Label>
                <Input id="edit-description" name="description" defaultValue={editing.description ?? ""} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-date">Date</Label>
                <Input id="edit-date" name="date" type="date" defaultValue={new Date(editing.startTime).toLocaleDateString("en-CA")} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="edit-hours">Hours</Label>
                  <Input id="edit-hours" name="hours" type="number" min="0" max="24" defaultValue={Math.floor((editing.durationMin ?? 0) / 60)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-minutes">Minutes</Label>
                  <Input id="edit-minutes" name="minutes" type="number" min="0" max="59" defaultValue={(editing.durationMin ?? 0) % 60} />
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
