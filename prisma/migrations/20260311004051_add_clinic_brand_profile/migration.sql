-- CreateTable
CREATE TABLE "clinic_brand_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clinicId" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "brandTone" TEXT NOT NULL DEFAULT '',
    "primaryKeywords" TEXT NOT NULL DEFAULT '',
    "areaKeywords" TEXT NOT NULL DEFAULT '',
    "greeting" TEXT NOT NULL DEFAULT '',
    "ctaText" TEXT NOT NULL DEFAULT '',
    "recommendedPhrases" TEXT NOT NULL DEFAULT '',
    "forbiddenPhrases" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "clinic_brand_profiles_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "clinic_brand_profiles_clinicId_key" ON "clinic_brand_profiles"("clinicId");
