-- CreateTable
CREATE TABLE "LocalUser" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "clientPasswordHash" TEXT NOT NULL,
    "moodleToken" TEXT NOT NULL,
    "moodleUserId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "server_id" INTEGER,
    "sync_status" TEXT NOT NULL DEFAULT 'SYNCED',
    "server_timemodified" INTEGER,
    "local_updated_at" DATETIME NOT NULL,
    "last_synced_at" INTEGER
);

-- CreateTable
CREATE TABLE "SyncCursor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "lastCursor" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SyncCursor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "LocalUser" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SyncLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME,
    "status" TEXT NOT NULL,
    "pushed" INTEGER NOT NULL DEFAULT 0,
    "pulled" INTEGER NOT NULL DEFAULT 0,
    "conflicts" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    CONSTRAINT "SyncLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "LocalUser" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Course" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "shortName" TEXT,
    "summary" TEXT,
    "categoryId" INTEGER,
    "categoryName" TEXT,
    "startDate" INTEGER,
    "endDate" INTEGER,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "enrolledAt" INTEGER,
    "server_id" INTEGER,
    "sync_status" TEXT NOT NULL DEFAULT 'PENDING_PUSH',
    "server_timemodified" INTEGER,
    "local_updated_at" DATETIME NOT NULL,
    "last_synced_at" INTEGER
);

-- CreateTable
CREATE TABLE "Module" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "courseId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "modType" TEXT NOT NULL,
    "instance" INTEGER,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "server_id" INTEGER,
    "sync_status" TEXT NOT NULL DEFAULT 'SYNCED',
    "server_timemodified" INTEGER,
    "local_updated_at" DATETIME NOT NULL,
    "last_synced_at" INTEGER,
    CONSTRAINT "Module_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Quiz" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "courseId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "intro" TEXT,
    "timeLimit" INTEGER,
    "maxAttempts" INTEGER NOT NULL DEFAULT 0,
    "gradeMethod" INTEGER NOT NULL DEFAULT 1,
    "sumGrades" REAL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "server_id" INTEGER,
    "sync_status" TEXT NOT NULL DEFAULT 'SYNCED',
    "server_timemodified" INTEGER,
    "local_updated_at" DATETIME NOT NULL,
    "last_synced_at" INTEGER,
    CONSTRAINT "Quiz_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuizQuestion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "quizId" INTEGER NOT NULL,
    "slot" INTEGER NOT NULL,
    "qtype" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "maxMark" REAL NOT NULL DEFAULT 1,
    "answers" TEXT,
    "server_id" INTEGER,
    "sync_status" TEXT NOT NULL DEFAULT 'SYNCED',
    "server_timemodified" INTEGER,
    "local_updated_at" DATETIME NOT NULL,
    "last_synced_at" INTEGER,
    CONSTRAINT "QuizQuestion_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuizAttempt" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "quizId" INTEGER NOT NULL,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "state" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "timeStart" INTEGER,
    "timeFinish" INTEGER,
    "sumGrades" REAL,
    "gradedAt" INTEGER,
    "server_id" INTEGER,
    "sync_status" TEXT NOT NULL DEFAULT 'PENDING_PUSH',
    "server_timemodified" INTEGER,
    "local_updated_at" DATETIME NOT NULL,
    "last_synced_at" INTEGER,
    CONSTRAINT "QuizAttempt_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuizAnswer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "attemptId" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,
    "responseText" TEXT,
    "fraction" REAL,
    "state" TEXT,
    "server_id" INTEGER,
    "sync_status" TEXT NOT NULL DEFAULT 'PENDING_PUSH',
    "server_timemodified" INTEGER,
    "local_updated_at" DATETIME NOT NULL,
    "last_synced_at" INTEGER,
    CONSTRAINT "QuizAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "QuizAttempt" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "QuizAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QuizQuestion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "courseId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "intro" TEXT,
    "dueDate" INTEGER,
    "cutoffDate" INTEGER,
    "allowedTypes" TEXT,
    "maxFileSize" INTEGER,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "server_id" INTEGER,
    "sync_status" TEXT NOT NULL DEFAULT 'SYNCED',
    "server_timemodified" INTEGER,
    "local_updated_at" DATETIME NOT NULL,
    "last_synced_at" INTEGER,
    CONSTRAINT "Assignment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AssignmentSubmission" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "assignmentId" INTEGER NOT NULL,
    "submissionText" TEXT,
    "filePath" TEXT,
    "fileName" TEXT,
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

-- CreateTable
CREATE TABLE "Annotation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "courseId" INTEGER,
    "content" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#FFFF88',
    "local_updated_at" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Annotation_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "LocalUser_email_key" ON "LocalUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "LocalUser_username_key" ON "LocalUser"("username");

-- CreateIndex
CREATE UNIQUE INDEX "LocalUser_server_id_key" ON "LocalUser"("server_id");

-- CreateIndex
CREATE UNIQUE INDEX "SyncCursor_userId_key" ON "SyncCursor"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Course_server_id_key" ON "Course"("server_id");

-- CreateIndex
CREATE UNIQUE INDEX "Module_server_id_key" ON "Module"("server_id");

-- CreateIndex
CREATE UNIQUE INDEX "Quiz_server_id_key" ON "Quiz"("server_id");

-- CreateIndex
CREATE UNIQUE INDEX "QuizQuestion_server_id_key" ON "QuizQuestion"("server_id");

-- CreateIndex
CREATE UNIQUE INDEX "QuizAttempt_server_id_key" ON "QuizAttempt"("server_id");

-- CreateIndex
CREATE UNIQUE INDEX "QuizAnswer_server_id_key" ON "QuizAnswer"("server_id");

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_server_id_key" ON "Assignment"("server_id");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentSubmission_server_id_key" ON "AssignmentSubmission"("server_id");
