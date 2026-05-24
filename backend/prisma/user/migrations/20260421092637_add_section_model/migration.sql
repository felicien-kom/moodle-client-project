/*
  Warnings:

  - You are about to drop the column `sectionName` on the `Module` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Section" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "courseId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "sectionIndex" INTEGER NOT NULL,
    "summary" TEXT,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "server_id" INTEGER,
    "sync_status" TEXT NOT NULL DEFAULT 'SYNCED',
    "server_timemodified" INTEGER,
    "local_updated_at" DATETIME NOT NULL,
    "last_synced_at" INTEGER,
    CONSTRAINT "Section_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Module" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "courseId" INTEGER NOT NULL,
    "sectionId" INTEGER,
    "name" TEXT NOT NULL,
    "modType" TEXT NOT NULL,
    "instance" INTEGER,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "server_id" INTEGER,
    "sync_status" TEXT NOT NULL DEFAULT 'SYNCED',
    "server_timemodified" INTEGER,
    "local_updated_at" DATETIME NOT NULL,
    "last_synced_at" INTEGER,
    CONSTRAINT "Module_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Module_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Module" ("courseId", "description", "id", "instance", "last_synced_at", "local_updated_at", "modType", "name", "sectionId", "server_id", "server_timemodified", "sortOrder", "sync_status", "visible") SELECT "courseId", "description", "id", "instance", "last_synced_at", "local_updated_at", "modType", "name", "sectionId", "server_id", "server_timemodified", "sortOrder", "sync_status", "visible" FROM "Module";
DROP TABLE "Module";
ALTER TABLE "new_Module" RENAME TO "Module";
CREATE UNIQUE INDEX "Module_server_id_key" ON "Module"("server_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Section_server_id_key" ON "Section"("server_id");
