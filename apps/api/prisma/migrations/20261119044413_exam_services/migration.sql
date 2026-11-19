-- CreateEnum
CREATE TYPE "ExamStatus" AS ENUM ('DRAFT', 'SIGNED');

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "durationMax" INTEGER,
    "unitNote" TEXT,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Icd10" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Icd10_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "ExamForm" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "status" "ExamStatus" NOT NULL DEFAULT 'DRAFT',
    "rev" INTEGER NOT NULL DEFAULT 1,
    "screening" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "signedById" TEXT,
    "signedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamAmendment" (
    "id" TEXT NOT NULL,
    "examFormId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "byId" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamAmendment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Service_code_key" ON "Service"("code");

-- CreateIndex
CREATE INDEX "Icd10_name_idx" ON "Icd10"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ExamForm_encounterId_key" ON "ExamForm"("encounterId");

-- CreateIndex
CREATE INDEX "ExamForm_patientId_idx" ON "ExamForm"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamAmendment_examFormId_version_key" ON "ExamAmendment"("examFormId", "version");

-- AddForeignKey
ALTER TABLE "ExamForm" ADD CONSTRAINT "ExamForm_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "Encounter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamForm" ADD CONSTRAINT "ExamForm_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamAmendment" ADD CONSTRAINT "ExamAmendment_examFormId_fkey" FOREIGN KEY ("examFormId") REFERENCES "ExamForm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
