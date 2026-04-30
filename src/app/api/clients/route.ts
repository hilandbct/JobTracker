import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const clients = await prisma.client.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { projects: true, invoices: true } } },
  });
  return NextResponse.json(clients);
}

export async function POST(req: Request) {
  const data = await req.json();
  const client = await prisma.client.create({ data });
  return NextResponse.json(client, { status: 201 });
}
