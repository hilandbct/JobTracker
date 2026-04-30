import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const entries = await prisma.timeEntry.findMany({
    where: projectId ? { projectId: Number(projectId) } : undefined,
    orderBy: { startTime: "desc" },
    include: { project: { select: { id: true, name: true, client: { select: { name: true } } } } },
  });
  return NextResponse.json(entries);
}

export async function POST(req: Request) {
  const data = await req.json();
  const entry = await prisma.timeEntry.create({
    data: {
      ...data,
      startTime: new Date(data.startTime),
      endTime: data.endTime ? new Date(data.endTime) : null,
    },
    include: { project: { select: { id: true, name: true } } },
  });
  return NextResponse.json(entry, { status: 201 });
}
