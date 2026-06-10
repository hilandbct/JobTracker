import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id: Number(id) },
    include: {
      client: true,
      project: { select: { id: true, name: true } },
      lineItems: true,
    },
  });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(invoice);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await req.json();
  const { lineItems, ...rest } = data;

  // Only replace line items when the request actually includes them —
  // a status-only PATCH must not touch line items
  if (lineItems) {
    await prisma.lineItem.deleteMany({ where: { invoiceId: Number(id) } });
  }

  const invoice = await prisma.invoice.update({
    where: { id: Number(id) },
    data: {
      ...rest,
      issueDate: rest.issueDate ? new Date(rest.issueDate) : undefined,
      dueDate: rest.dueDate === undefined ? undefined : rest.dueDate ? new Date(rest.dueDate) : null,
      lineItems: lineItems ? { create: lineItems } : undefined,
    },
    include: {
      client: true,
      project: { select: { id: true, name: true } },
      lineItems: true,
    },
  });
  return NextResponse.json(invoice);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.invoice.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
