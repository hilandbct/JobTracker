import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const rows = await prisma.setting.findMany();
  return NextResponse.json(Object.fromEntries(rows.map(r => [r.key, r.value])));
}

export async function POST(req: Request) {
  const body = await req.json();
  await Promise.all(
    Object.entries(body).map(([key, value]) =>
      prisma.setting.upsert({ where: { key }, update: { value: String(value) }, create: { key, value: String(value) } })
    )
  );
  return NextResponse.json({ ok: true });
}
