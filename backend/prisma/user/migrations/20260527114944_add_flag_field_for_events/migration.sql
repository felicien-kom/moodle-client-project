-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CalendarEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "eventType" TEXT NOT NULL,
    "timeStart" INTEGER NOT NULL,
    "timeDuration" INTEGER NOT NULL DEFAULT 0,
    "courseId" INTEGER,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "server_id" INTEGER,
    "sync_status" TEXT NOT NULL DEFAULT 'SYNCED',
    "server_timemodified" INTEGER,
    "local_updated_at" DATETIME NOT NULL,
    "last_synced_at" INTEGER,
    CONSTRAINT "CalendarEvent_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_CalendarEvent" ("courseId", "description", "eventType", "id", "last_synced_at", "local_updated_at", "name", "server_id", "server_timemodified", "sync_status", "timeDuration", "timeStart") SELECT "courseId", "description", "eventType", "id", "last_synced_at", "local_updated_at", "name", "server_id", "server_timemodified", "sync_status", "timeDuration", "timeStart" FROM "CalendarEvent";
DROP TABLE "CalendarEvent";
ALTER TABLE "new_CalendarEvent" RENAME TO "CalendarEvent";
CREATE UNIQUE INDEX "CalendarEvent_server_id_key" ON "CalendarEvent"("server_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
