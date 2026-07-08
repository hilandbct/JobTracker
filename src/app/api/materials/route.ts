import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const materials = await prisma.material.findMany({
    where: projectId ? { projectId: Number(projectId) } : undefined,
    orderBy: { createdAt: "desc" },
    include: { project: { select: { id: true, name: true, client: { select: { name: true } } } } },
  });
  return NextResponse.json(materials);
}

export async function POST(req: Request) {
  const data = await req.json();
  const material = await prisma.material.create({
    data,
    include: { project: { select: { id: true, name: true } } },
  });
  return NextResponse.json(material, { status: 201 });
}
