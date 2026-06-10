import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const estimate = await prisma.estimate.findUnique({
    where: { id: Number(id) },
    include: {
      client: true,
      project: { select: { id: true, name: true } },
      lineItems: true,
    },
  });
  if (!estimate) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(estimate);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await req.json();
  const { lineItems, ...rest } = data;

  // Only replace line items when the request actually includes them —
  // a status-only PATCH must not touch line items
  if (lineItems) {
    await prisma.estimateLineItem.deleteMany({ where: { estimateId: Number(id) } });
  }

  const estimate = await prisma.estimate.update({
    where: { id: Number(id) },
    data: {
      ...rest,
      issueDate: rest.issueDate ? new Date(rest.issueDate) : undefined,
      expiryDate: rest.expiryDate === undefined ? undefined : rest.expiryDate ? new Date(rest.expiryDate) : null,
      lineItems: lineItems ? { create: lineItems } : undefined,
    },
    include: {
      client: true,
      project: { select: { id: true, name: true } },
      lineItems: true,
    },
  });
  return NextResponse.json(estimate);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.estimate.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
