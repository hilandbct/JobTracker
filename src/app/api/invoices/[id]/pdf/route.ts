import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { renderToBuffer } from "@react-pdf/renderer";
import { InvoicePDF } from "@/components/invoice-pdf";
import React from "react";
import path from "path";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [invoice, settingsRows] = await Promise.all([
    prisma.invoice.findUnique({
      where: { id: Number(id) },
      include: { client: true, project: { select: { name: true } }, lineItems: true },
    }),
    prisma.setting.findMany(),
  ]);
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const bizInfo = Object.fromEntries(settingsRows.map(r => [r.key, r.value]));
  const logoPath = path.join(process.cwd(), "public", "logo-black.png");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(React.createElement(InvoicePDF, { invoice, logoPath, bizInfo }) as any);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.number}.pdf"`,
    },
  });
}
