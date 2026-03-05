-- Add partial status to InvoiceStatus enum
ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'partial';

-- CreateTable
CREATE TABLE "InvoicePayment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amountPaid" DECIMAL(14,2) NOT NULL,
    "paymentDate" DATE NOT NULL,
    "paymentMethod" TEXT,
    "receiptNumber" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoicePayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InvoicePayment_invoiceId_idx" ON "InvoicePayment"("invoiceId");

-- CreateIndex
CREATE INDEX "InvoicePayment_userId_idx" ON "InvoicePayment"("userId");

-- AddForeignKey
ALTER TABLE "InvoicePayment" ADD CONSTRAINT "InvoicePayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoicePayment" ADD CONSTRAINT "InvoicePayment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
