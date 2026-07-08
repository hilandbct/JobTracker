import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await req.json();
  const material = await prisma.material.update({
    where: { id: Number(id) },
    data,
  });
  return NextResponse.json(material);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.material.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
