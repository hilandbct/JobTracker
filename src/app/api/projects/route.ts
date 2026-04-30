import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  const projects = await prisma.project.findMany({
    where: clientId ? { clientId: Number(clientId) } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { id: true, name: true } },
      _count: { select: { timeEntries: true } },
    },
  });
  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const data = await req.json();
  const project = await prisma.project.create({
    data,
    include: { client: { select: { id: true, name: true } } },
  });
  return NextResponse.json(project, { status: 201 });
}
