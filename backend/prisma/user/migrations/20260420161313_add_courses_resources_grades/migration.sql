/*
  Warnings:

  - You are about to drop the column `enrolledAt` on the `Course` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN "maxGrade" REAL;

-- AlterTable
ALTER TABLE "Module" ADD COLUMN "description" TEXT;
ALTER TABLE "Module" ADD COLUMN "sectionId" INTEGER;
ALTER TABLE "Module" ADD COLUMN "sectionName" TEXT;

-- AlterTable
ALTER TABLE "Quiz" ADD COLUMN "grade" REAL;

-- AlterTable
ALTER TABLE "QuizQuestion" ADD COLUMN "name" TEXT;

-- CreateTable
CREATE TABLE "CourseEnrollment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "courseServerId" INTEGER NOT NULL,
    "enrolledAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enrolledOnServer" BOOLEAN NOT NULL DEFAULT true,
    "syncEnabled" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Resource" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "courseId" INTEGER NOT NULL,
    "moduleId" INTEGER,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "moodleUrl" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "localPath" TEXT,
    "server_id" INTEGER,
    "sync_status" TEXT NOT NULL DEFAULT 'SYNCED',
    "server_timemodified" INTEGER,
    "local_updated_at" DATETIME NOT NULL,
    "last_synced_at" INTEGER,
    CONSTRAINT "Resource_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Resource_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Grade" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "courseId" INTEGER NOT NULL,
    "itemName" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "itemInstance" INTEGER,
    "grade" REAL,
    "maxGrade" REAL,
    "percentage" REAL,
    "server_id" INTEGER,
    "sync_status" TEXT NOT NULL DEFAULT 'SYNCED',
    "server_timemodified" INTEGER,
    "local_updated_at" DATETIME NOT NULL,
    "last_synced_at" INTEGER,
    CONSTRAINT "Grade_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Course" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "shortName" TEXT,
    "summary" TEXT,
    "categoryId" INTEGER,
    "categoryName" TEXT,
    "startDate" INTEGER,
    "endDate" INTEGER,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "imageUrl" TEXT,
    "format" TEXT,
    "server_id" INTEGER,
    "sync_status" TEXT NOT NULL DEFAULT 'SYNCED',
    "server_timemodified" INTEGER,
    "local_updated_at" DATETIME NOT NULL,
    "last_synced_at" INTEGER
);
INSERT INTO "new_Course" ("categoryId", "categoryName", "endDate", "id", "last_synced_at", "local_updated_at", "server_id", "server_timemodified", "shortName", "startDate", "summary", "sync_status", "title", "visible") SELECT "categoryId", "categoryName", "endDate", "id", "last_synced_at", "local_updated_at", "server_id", "server_timemodified", "shortName", "startDate", "summary", "sync_status", "title", "visible" FROM "Course";
DROP TABLE "Course";
ALTER TABLE "new_Course" RENAME TO "Course";
CREATE UNIQUE INDEX "Course_server_id_key" ON "Course"("server_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "CourseEnrollment_courseServerId_key" ON "CourseEnrollment"("courseServerId");

-- CreateIndex
CREATE UNIQUE INDEX "Resource_server_id_key" ON "Resource"("server_id");

-- CreateIndex
CREATE UNIQUE INDEX "Grade_server_id_key" ON "Grade"("server_id");
