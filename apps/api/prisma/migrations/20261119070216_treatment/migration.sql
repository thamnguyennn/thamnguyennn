-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "TreatmentPlan" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "encounterId" TEXT,
    "examFormId" TEXT,
    "doctorId" TEXT NOT NULL,
    "therapistId" TEXT,
    "totalSessions" INTEGER NOT NULL,
    "frequency" TEXT,
    "reevalAfter" INTEGER,
    "diagnosis" TEXT,
    "note" TEXT,
    "status" "PlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TreatmentPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanItem" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "serviceCode" TEXT NOT NULL,
    "region" TEXT,
    "note" TEXT,

    CONSTRAINT "PlanItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreatmentSession" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "encounterId" TEXT,
    "sessionNo" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "progress" TEXT,
    "note" TEXT,
    "adverse" BOOLEAN NOT NULL DEFAULT false,
    "performedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TreatmentSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreatmentLine" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "serviceCode" TEXT NOT NULL,
    "minutes" INTEGER,
    "detail" TEXT,
    "sort" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TreatmentLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TreatmentPlan_patientId_status_idx" ON "TreatmentPlan"("patientId", "status");

-- CreateIndex
CREATE INDEX "PlanItem_planId_idx" ON "PlanItem"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "TreatmentSession_planId_sessionNo_key" ON "TreatmentSession"("planId", "sessionNo");

-- CreateIndex
CREATE INDEX "TreatmentLine_sessionId_idx" ON "TreatmentLine"("sessionId");

-- AddForeignKey
ALTER TABLE "TreatmentPlan" ADD CONSTRAINT "TreatmentPlan_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanItem" ADD CONSTRAINT "PlanItem_planId_fkey" FOREIGN KEY ("planId") REFERENCES "TreatmentPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreatmentSession" ADD CONSTRAINT "TreatmentSession_planId_fkey" FOREIGN KEY ("planId") REFERENCES "TreatmentPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreatmentSession" ADD CONSTRAINT "TreatmentSession_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreatmentLine" ADD CONSTRAINT "TreatmentLine_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TreatmentSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
