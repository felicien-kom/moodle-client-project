-- CreateTable
CREATE TABLE "Event" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "format" TEXT,
    "categoryId" INTEGER,
    "courseId" INTEGER,
    "groupId" INTEGER,
    "userId" INTEGER,
    "eventType" TEXT NOT NULL DEFAULT 'SITE',
    "timestart" INTEGER NOT NULL,
    "timeduration" INTEGER,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "location" TEXT,
    "timemodified" INTEGER,
    "server_id" INTEGER,
    "sync_status" TEXT NOT NULL DEFAULT 'SYNCED',
    "server_timemodified" INTEGER,
    "local_updated_at" DATETIME NOT NULL,
    "last_synced_at" INTEGER,
    CONSTRAINT "Event_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Event_server_id_key" ON "Event"("server_id");
