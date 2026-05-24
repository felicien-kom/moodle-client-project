/*
  Warnings:

  - You are about to drop the `Annotation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Quiz` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `QuizAnswer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `QuizAttempt` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `QuizQuestion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Resource` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `visible` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `fileName` on the `AssignmentSubmission` table. All the data in the column will be lost.
  - You are about to drop the column `filePath` on the `AssignmentSubmission` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Quiz_server_id_key";

-- DropIndex
DROP INDEX "QuizAnswer_server_id_key";

-- DropIndex
DROP INDEX "QuizAttempt_server_id_key";

-- DropIndex
DROP INDEX "QuizQuestion_server_id_key";

-- DropIndex
DROP INDEX "Resource_server_id_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Annotation";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Quiz";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "QuizAnswer";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "QuizAttempt";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "QuizQuestion";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Resource";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "LocalFile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "filename" TEXT NOT NULL,
    "moodleUrl" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "localPath" TEXT,
    "fileResourceId" INTEGER,
    "folderResourceId" INTEGER,
    "assignmentId" INTEGER,
    "submissionId" INTEGER,
    "server_id" INTEGER,
    "sync_status" TEXT NOT NULL DEFAULT 'SYNCED',
    "server_timemodified" INTEGER,
    "local_updated_at" DATETIME NOT NULL,
    "last_synced_at" INTEGER,
    CONSTRAINT "LocalFile_fileResourceId_fkey" FOREIGN KEY ("fileResourceId") REFERENCES "FileResource" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LocalFile_folderResourceId_fkey" FOREIGN KEY ("folderResourceId") REFERENCES "FolderResource" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LocalFile_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LocalFile_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "AssignmentSubmission" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FileResource" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "moduleId" INTEGER,
    "name" TEXT NOT NULL,
    "intro" TEXT,
    "server_id" INTEGER,
    "sync_status" TEXT NOT NULL DEFAULT 'SYNCED',
    "server_timemodified" INTEGER,
    "local_updated_at" DATETIME NOT NULL,
    "last_synced_at" INTEGER,
    CONSTRAINT "FileResource_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FolderResource" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "moduleId" INTEGER,
    "name" TEXT NOT NULL,
    "intro" TEXT,
    "server_id" INTEGER,
    "sync_status" TEXT NOT NULL DEFAULT 'SYNCED',
    "server_timemodified" INTEGER,
    "local_updated_at" DATETIME NOT NULL,
    "last_synced_at" INTEGER,
    CONSTRAINT "FolderResource_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExternalUrl" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "moduleId" INTEGER,
    "name" TEXT NOT NULL,
    "externalUrl" TEXT NOT NULL,
    "description" TEXT,
    "server_id" INTEGER,
    "sync_status" TEXT NOT NULL DEFAULT 'SYNCED',
    "server_timemodified" INTEGER,
    "local_updated_at" DATETIME NOT NULL,
    "last_synced_at" INTEGER,
    CONSTRAINT "ExternalUrl_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "eventType" TEXT NOT NULL,
    "timeStart" INTEGER NOT NULL,
    "timeDuration" INTEGER NOT NULL DEFAULT 0,
    "courseId" INTEGER,
    "server_id" INTEGER,
    "sync_status" TEXT NOT NULL DEFAULT 'SYNCED',
    "server_timemodified" INTEGER,
    "local_updated_at" DATETIME NOT NULL,
    "last_synced_at" INTEGER,
    CONSTRAINT "CalendarEvent_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Assignment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "courseId" INTEGER NOT NULL,
    "moduleId" INTEGER,
    "name" TEXT NOT NULL,
    "intro" TEXT,
    "dueDate" INTEGER,
    "cutoffDate" INTEGER,
    "allowedTypes" TEXT,
    "maxFileSize" INTEGER,
    "maxGrade" REAL,
    "server_id" INTEGER,
    "sync_status" TEXT NOT NULL DEFAULT 'SYNCED',
    "server_timemodified" INTEGER,
    "local_updated_at" DATETIME NOT NULL,
    "last_synced_at" INTEGER,
    CONSTRAINT "Assignment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Assignment_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Assignment" ("allowedTypes", "courseId", "cutoffDate", "dueDate", "id", "intro", "last_synced_at", "local_updated_at", "maxFileSize", "maxGrade", "name", "server_id", "server_timemodified", "sync_status") SELECT "allowedTypes", "courseId", "cutoffDate", "dueDate", "id", "intro", "last_synced_at", "local_updated_at", "maxFileSize", "maxGrade", "name", "server_id", "server_timemodified", "sync_status" FROM "Assignment";
DROP TABLE "Assignment";
ALTER TABLE "new_Assignment" RENAME TO "Assignment";
CREATE UNIQUE INDEX "Assignment_server_id_key" ON "Assignment"("server_id");
CREATE TABLE "new_AssignmentSubmission" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "assignmentId" INTEGER NOT NULL,
    "submissionText" TEXT,
    "state" TEXT NOT NULL DEFAULT 'DRAFT',
    "grade" REAL,
    "gradedAt" INTEGER,
    "feedback" TEXT,
    "server_id" INTEGER,
    "sync_status" TEXT NOT NULL DEFAULT 'PENDING_PUSH',
    "server_timemodified" INTEGER,
    "local_updated_at" DATETIME NOT NULL,
    "last_synced_at" INTEGER,
    CONSTRAINT "AssignmentSubmission_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_AssignmentSubmission" ("assignmentId", "feedback", "grade", "gradedAt", "id", "last_synced_at", "local_updated_at", "server_id", "server_timemodified", "state", "submissionText", "sync_status") SELECT "assignmentId", "feedback", "grade", "gradedAt", "id", "last_synced_at", "local_updated_at", "server_id", "server_timemodified", "state", "submissionText", "sync_status" FROM "AssignmentSubmission";
DROP TABLE "AssignmentSubmission";
ALTER TABLE "new_AssignmentSubmission" RENAME TO "AssignmentSubmission";
CREATE UNIQUE INDEX "AssignmentSubmission_server_id_key" ON "AssignmentSubmission"("server_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "LocalFile_moodleUrl_key" ON "LocalFile"("moodleUrl");

-- CreateIndex
CREATE UNIQUE INDEX "LocalFile_server_id_key" ON "LocalFile"("server_id");

-- CreateIndex
CREATE UNIQUE INDEX "FileResource_server_id_key" ON "FileResource"("server_id");

-- CreateIndex
CREATE UNIQUE INDEX "FolderResource_server_id_key" ON "FolderResource"("server_id");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalUrl_server_id_key" ON "ExternalUrl"("server_id");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEvent_server_id_key" ON "CalendarEvent"("server_id");
