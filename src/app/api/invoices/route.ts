import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { nextInvoiceNumber } from "@/lib/format";

export async function GET() {
  const invoices = await prisma.invoice.findMany({
    orderBy: { issueDate: "desc" },
    include: {
      client: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
      lineItems: true,
    },
  });
  return NextResponse.json(invoices);
}

export async function POST(req: Request) {
  const data = await req.json();
  const last = await prisma.invoice.findFirst({ orderBy: { number: "desc" } });
  const number = data.number || nextInvoiceNumber(last?.number ?? null);
  const { lineItems, ...rest } = data;
  const invoice = await prisma.invoice.create({
    data: {
      ...rest,
      number,
      issueDate: rest.issueDate ? new Date(rest.issueDate) : new Date(),
      dueDate: rest.dueDate ? new Date(rest.dueDate) : null,
      lineItems: lineItems ? { create: lineItems } : undefined,
    },
    include: {
      client: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
      lineItems: true,
    },
  });
  return NextResponse.json(invoice, { status: 201 });
}
