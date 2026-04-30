import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { renderToBuffer } from "@react-pdf/renderer";
import { EstimatePDF } from "@/components/estimate-pdf";
import React from "react";
import path from "path";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const estimate = await prisma.estimate.findUnique({
    where: { id: Number(id) },
    include: { client: true, project: { select: { name: true } }, lineItems: true },
  });
  if (!estimate) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const logoPath = path.join(process.cwd(), "public", "logo-black.png");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(React.createElement(EstimatePDF, { estimate, logoPath }) as any);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${estimate.number}.pdf"`,
    },
  });
}
