-- CreateTable
CREATE TABLE "Setting" ("key" TEXT NOT NULL PRIMARY KEY, "value" TEXT NOT NULL);

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN "portalToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_portalToken_key" ON "Invoice"("portalToken");
