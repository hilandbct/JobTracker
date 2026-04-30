"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";

type Project = { id: number; name: string; client: { name: string } };

export function NewTimeEntryButton({ projects }: { projects: Project[] }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [projectId, setProjectId] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!projectId) return;
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const hours = Number(fd.get("hours") || 0);
    const minutes = Number(fd.get("minutes") || 0);
    const durationMin = hours * 60 + minutes;
    const startTime = fd.get("date") ? new Date(fd.get("date") as string) : new Date();
    await fetch("/api/time-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: Number(projectId),
        description: fd.get("description") || null,
        startTime: startTime.toISOString(),
        durationMin,
      }),
    });
    setSaving(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} size="sm" disabled={projects.length === 0}>
        <Plus className="h-4 w-4 mr-1" /> Log Time
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Log Time</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label>Project *</Label>
              <Select value={projectId} onValueChange={(v) => setProjectId(v ?? "")} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select project">
                    {(v: string | null) => {
                      if (!v) return null;
                      const p = projects.find(p => String(p.id) === v);
                      return p ? `${p.client.name} / ${p.name}` : null;
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.client.name} / {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="date">Date</Label>
              <Input id="date" name="date" type="date" defaultValue={new Date().toISOString().split("T")[0]} />
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
              <Button type="submit" disabled={saving || !projectId}>{saving ? "Saving…" : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
