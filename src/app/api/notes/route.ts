import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  const projectId = searchParams.get("projectId");
  const notes = await prisma.note.findMany({
    where: {
      ...(clientId ? { clientId: Number(clientId) } : {}),
      ...(projectId ? { projectId: Number(projectId) } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(notes);
}

export async function POST(req: Request) {
  const data = await req.json();
  const note = await prisma.note.create({ data });
  return NextResponse.json(note, { status: 201 });
}
