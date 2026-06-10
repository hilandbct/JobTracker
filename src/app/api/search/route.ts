import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ clients: [], projects: [], invoices: [], estimates: [] });

  const [clients, projects, invoices, estimates] = await Promise.all([
    prisma.client.findMany({
      where: { OR: [{ name: { contains: q } }, { company: { contains: q } }, { email: { contains: q } }] },
      select: { id: true, name: true, company: true },
      take: 5,
    }),
    prisma.project.findMany({
      where: { name: { contains: q } },
      select: { id: true, name: true, status: true, client: { select: { name: true } } },
      take: 5,
    }),
    prisma.invoice.findMany({
      where: { OR: [{ number: { contains: q } }, { client: { name: { contains: q } } }] },
      select: { id: true, number: true, status: true, client: { select: { name: true } } },
      orderBy: { issueDate: "desc" },
      take: 5,
    }),
    prisma.estimate.findMany({
      where: { OR: [{ number: { contains: q } }, { client: { name: { contains: q } } }] },
      select: { id: true, number: true, status: true, client: { select: { name: true } } },
      orderBy: { issueDate: "desc" },
      take: 5,
    }),
  ]);

  return NextResponse.json({ clients, projects, invoices, estimates });
}
