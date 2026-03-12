-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_generated_contents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clinicId" TEXT NOT NULL,
    "templateId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "inputParams" TEXT NOT NULL,
    "output" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "rating" TEXT NOT NULL DEFAULT 'none',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "generated_contents_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "clinics" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "generated_contents_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "content_templates" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_generated_contents" ("clinicId", "createdAt", "id", "inputParams", "note", "output", "status", "tags", "templateId", "title", "type", "updatedAt") SELECT "clinicId", "createdAt", "id", "inputParams", "note", "output", "status", "tags", "templateId", "title", "type", "updatedAt" FROM "generated_contents";
DROP TABLE "generated_contents";
ALTER TABLE "new_generated_contents" RENAME TO "generated_contents";
CREATE INDEX "generated_contents_clinicId_type_status_idx" ON "generated_contents"("clinicId", "type", "status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
