-- AlterTable
ALTER TABLE "AssignmentSubmission" ADD COLUMN "moodleUserId" INTEGER;

-- CreateTable
CREATE TABLE "CourseParticipant" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "courseId" INTEGER NOT NULL,
    "moodleUserId" INTEGER NOT NULL,
    "fullname" TEXT NOT NULL,
    "email" TEXT,
    "profileImageUrl" TEXT,
    CONSTRAINT "CourseParticipant_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CourseParticipant_courseId_moodleUserId_key" ON "CourseParticipant"("courseId", "moodleUserId");
