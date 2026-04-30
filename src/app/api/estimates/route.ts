import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { nextEstimateNumber } from "@/lib/format";

export async function GET() {
  const estimates = await prisma.estimate.findMany({
    orderBy: { issueDate: "desc" },
    include: {
      client: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
      lineItems: true,
    },
  });
  return NextResponse.json(estimates);
}

export async function POST(req: Request) {
  const data = await req.json();
  const last = await prisma.estimate.findFirst({ orderBy: { number: "desc" } });
  const number = data.number || nextEstimateNumber(last?.number ?? null);
  const { lineItems, ...rest } = data;
  const estimate = await prisma.estimate.create({
    data: {
      ...rest,
      number,
      issueDate: rest.issueDate ? new Date(rest.issueDate) : new Date(),
      expiryDate: rest.expiryDate ? new Date(rest.expiryDate) : null,
      lineItems: lineItems ? { create: lineItems } : undefined,
    },
    include: {
      client: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
      lineItems: true,
    },
  });
  return NextResponse.json(estimate, { status: 201 });
}
