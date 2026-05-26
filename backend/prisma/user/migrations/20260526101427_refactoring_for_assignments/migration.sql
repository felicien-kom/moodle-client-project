/*
  Warnings:

  - You are about to drop the column `allowedTypes` on the `Assignment` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Assignment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "courseId" INTEGER NOT NULL,
    "moduleId" INTEGER,
    "name" TEXT NOT NULL,
    "intro" TEXT,
    "activity" TEXT,
    "allowSubmissionsFromDate" INTEGER,
    "dueDate" INTEGER,
    "cutoffDate" INTEGER,
    "requiresText" BOOLEAN NOT NULL DEFAULT false,
    "wordLimit" INTEGER,
    "requiresFile" BOOLEAN NOT NULL DEFAULT false,
    "maxFiles" INTEGER,
    "maxFileSize" INTEGER,
    "maxAttempts" INTEGER,
    "maxGrade" REAL,
    "server_id" INTEGER,
    "sync_status" TEXT NOT NULL DEFAULT 'SYNCED',
    "server_timemodified" INTEGER,
    "local_updated_at" DATETIME NOT NULL,
    "last_synced_at" INTEGER,
    CONSTRAINT "Assignment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Assignment_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Assignment" ("courseId", "cutoffDate", "dueDate", "id", "intro", "last_synced_at", "local_updated_at", "maxFileSize", "maxGrade", "moduleId", "name", "server_id", "server_timemodified", "sync_status") SELECT "courseId", "cutoffDate", "dueDate", "id", "intro", "last_synced_at", "local_updated_at", "maxFileSize", "maxGrade", "moduleId", "name", "server_id", "server_timemodified", "sync_status" FROM "Assignment";
DROP TABLE "Assignment";
ALTER TABLE "new_Assignment" RENAME TO "Assignment";
CREATE UNIQUE INDEX "Assignment_server_id_key" ON "Assignment"("server_id");
CREATE TABLE "new_AssignmentSubmission" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "assignmentId" INTEGER NOT NULL,
    "attemptNumber" INTEGER NOT NULL DEFAULT 0,
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
CREATE TABLE "new_LocalFile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "filename" TEXT NOT NULL,
    "moodleUrl" TEXT,
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
INSERT INTO "new_LocalFile" ("assignmentId", "fileResourceId", "fileSize", "filename", "folderResourceId", "id", "last_synced_at", "localPath", "local_updated_at", "mimeType", "moodleUrl", "server_id", "server_timemodified", "submissionId", "sync_status") SELECT "assignmentId", "fileResourceId", "fileSize", "filename", "folderResourceId", "id", "last_synced_at", "localPath", "local_updated_at", "mimeType", "moodleUrl", "server_id", "server_timemodified", "submissionId", "sync_status" FROM "LocalFile";
DROP TABLE "LocalFile";
ALTER TABLE "new_LocalFile" RENAME TO "LocalFile";
CREATE UNIQUE INDEX "LocalFile_moodleUrl_key" ON "LocalFile"("moodleUrl");
CREATE UNIQUE INDEX "LocalFile_server_id_key" ON "LocalFile"("server_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
