"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type Project = { id: number; name: string; client: { name: string } };

export function QuickTimeWidget({ projects }: { projects: Project[] }) {
  const [projectId, setProjectId] = useState("");
  const [desc, setDesc] = useState("");
  const [hours, setHours] = useState("0");
  const [minutes, setMinutes] = useState("0");
  const [date, setDate] = useState(new Date().toLocaleDateString("en-CA"));
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId) return;
    setSaving(true);
    const durationMin = Number(hours) * 60 + Number(minutes);
    const startTime = new Date(date + "T00:00:00");
    await fetch("/api/time-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: Number(projectId), description: desc || null, startTime: startTime.toISOString(), durationMin }),
    });
    setSaving(false);
    setDone(true);
    setDesc(""); setHours("0"); setMinutes("0");
    setTimeout(() => setDone(false), 2000);
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Project</Label>
        <Select value={projectId} onValueChange={v => setProjectId(v ?? "")}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="Select project" />
          </SelectTrigger>
          <SelectContent>
            {projects.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.client.name} / {p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Description</Label>
        <Input className="h-8 text-sm" value={desc} onChange={e => setDesc(e.target.value)} placeholder="What did you work on?" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Date</Label>
          <Input className="h-8 text-sm" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Hours</Label>
          <Input className="h-8 text-sm" type="number" min="0" max="24" value={hours} onChange={e => setHours(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Minutes</Label>
          <Input className="h-8 text-sm" type="number" min="0" max="59" value={minutes} onChange={e => setMinutes(e.target.value)} />
        </div>
      </div>
      <Button size="sm" type="submit" disabled={saving || !projectId} className="w-full">
        {done ? "Logged!" : saving ? "Saving…" : "Log Time"}
      </Button>
    </form>
  );
}
