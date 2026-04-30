import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await prisma.client.findUnique({
    where: { id: Number(id) },
    include: {
      projects: { orderBy: { createdAt: "desc" } },
      invoices: { orderBy: { issueDate: "desc" }, include: { lineItems: true } },
      estimates: { orderBy: { issueDate: "desc" }, include: { lineItems: true } },
      clientNotes: { orderBy: { createdAt: "desc" } },
      todos: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(client);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await req.json();
  const client = await prisma.client.update({ where: { id: Number(id) }, data });
  return NextResponse.json(client);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.client.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
