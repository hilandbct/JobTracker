"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/format";
import { Pencil, Trash2, Plus, Check, X } from "lucide-react";

type Note = { id: number; content: string; createdAt: Date | string };

export function NotesPanel({
  clientId,
  projectId,
  initialNotes,
}: {
  clientId?: number;
  projectId?: number;
  initialNotes: Note[];
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [adding, setAdding] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");

  async function addNote() {
    if (!newContent.trim()) return;
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newContent, clientId, projectId }),
    });
    const note = await res.json();
    setNotes([note, ...notes]);
    setNewContent("");
    setAdding(false);
  }

  async function saveEdit(id: number) {
    const res = await fetch(`/api/notes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editContent }),
    });
    const updated = await res.json();
    setNotes(notes.map((n) => (n.id === id ? updated : n)));
    setEditingId(null);
  }

  async function deleteNote(id: number) {
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    setNotes(notes.filter((n) => n.id !== id));
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Note
        </Button>
      </div>

      {adding && (
        <div className="space-y-2">
          <Textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Write a note…"
            rows={3}
            autoFocus
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={addNote}>Save</Button>
            <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setNewContent(""); }}>Cancel</Button>
          </div>
        </div>
      )}

      {notes.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground">No notes yet.</p>
      )}

      {notes.map((note) => (
        <div key={note.id} className="rounded-lg border p-3 space-y-1">
          {editingId === note.id ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => saveEdit(note.id)}><Check className="h-3.5 w-3.5" /></Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}><X className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm whitespace-pre-wrap">{note.content}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{formatDate(note.createdAt)}</span>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setEditingId(note.id); setEditContent(note.content); }}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => deleteNote(note.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
