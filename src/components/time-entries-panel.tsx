"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatDate, formatDuration, formatCurrency } from "@/lib/format";
import { Plus, Trash2, Play, Square } from "lucide-react";

type Entry = {
  id: number;
  description: string | null;
  startTime: Date | string;
  endTime: Date | string | null;
  durationMin: number | null;
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
    // Parse as local midnight — "YYYY-MM-DD" alone is treated as UTC by the JS spec
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

  async function deleteEntry(id: number) {
    await fetch(`/api/time-entries/${id}`, { method: "DELETE" });
    setEntries(entries.filter((e) => e.id !== id));
  }

  const totalMinutes = entries.reduce((s, e) => s + (e.durationMin ?? 0), 0);

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
        <ul className="space-y-1">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/40 group text-sm gap-2">
              <span className="flex-1 truncate">{entry.description || <span className="text-muted-foreground italic">no description</span>}</span>
              <span className="text-muted-foreground shrink-0">{formatDate(entry.startTime)}</span>
              <span className="font-medium shrink-0 w-16 text-right">
                {entry.durationMin ? formatDuration(entry.durationMin) : "—"}
              </span>
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
    </div>
  );
}
