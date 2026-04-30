"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type Todo = {
  id: number;
  title: string;
  completed: boolean;
  dueDate: Date | string | null;
};

export function TodosPanel({
  clientId,
  projectId,
  initialTodos,
}: {
  clientId?: number;
  projectId?: number;
  initialTodos: Todo[];
}) {
  const [todos, setTodos] = useState(initialTodos);
  const [newTitle, setNewTitle] = useState("");

  async function addTodo() {
    if (!newTitle.trim()) return;
    const res = await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle, clientId, projectId }),
    });
    const todo = await res.json();
    setTodos([todo, ...todos]);
    setNewTitle("");
  }

  async function toggle(id: number, completed: boolean) {
    const res = await fetch(`/api/todos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed }),
    });
    const updated = await res.json();
    setTodos(
      todos
        .map((t) => (t.id === id ? updated : t))
        .sort((a, b) => Number(a.completed) - Number(b.completed))
    );
  }

  async function deleteTodo(id: number) {
    await fetch(`/api/todos/${id}`, { method: "DELETE" });
    setTodos(todos.filter((t) => t.id !== id));
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a to-do…"
          onKeyDown={(e) => e.key === "Enter" && addTodo()}
        />
        <Button size="sm" onClick={addTodo}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {todos.length === 0 ? (
        <p className="text-sm text-muted-foreground">No to-dos.</p>
      ) : (
        <ul className="space-y-1">
          {todos.map((todo) => (
            <li key={todo.id} className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/40 group">
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={(e) => toggle(todo.id, e.target.checked)}
                className="h-4 w-4 shrink-0 cursor-pointer accent-primary"
              />
              <span className={cn("flex-1 text-sm", todo.completed && "line-through text-muted-foreground")}>
                {todo.title}
              </span>
              {todo.dueDate && (
                <span className="text-xs text-muted-foreground">{formatDate(todo.dueDate)}</span>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                onClick={() => deleteTodo(todo.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
