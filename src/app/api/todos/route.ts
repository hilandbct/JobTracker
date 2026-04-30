import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  const projectId = searchParams.get("projectId");
  const todos = await prisma.todo.findMany({
    where: {
      ...(clientId ? { clientId: Number(clientId) } : {}),
      ...(projectId ? { projectId: Number(projectId) } : {}),
    },
    orderBy: [{ completed: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(todos);
}

export async function POST(req: Request) {
  const data = await req.json();
  const todo = await prisma.todo.create({
    data: {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    },
  });
  return NextResponse.json(todo, { status: 201 });
}
