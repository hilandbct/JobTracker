import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { randomBytes } from "crypto";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({ where: { id: Number(id) } });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const token = invoice.portalToken ?? randomBytes(24).toString("hex");
  if (!invoice.portalToken) {
    await prisma.invoice.update({ where: { id: Number(id) }, data: { portalToken: token } });
  }
  return NextResponse.json({ token });
}
