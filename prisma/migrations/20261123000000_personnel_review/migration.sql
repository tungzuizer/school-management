CREATE TABLE "PersonnelReview" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "campusId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "revision" INTEGER NOT NULL DEFAULT 1,
    "sourceSnapshot" JSONB NOT NULL,
    "supplementalTasks" JSONB NOT NULL DEFAULT '[]',
    "notes" TEXT NOT NULL DEFAULT '',
    "returnReason" TEXT,
    "submittedAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PersonnelReview_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PersonnelReviewEvent" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fromState" TEXT,
    "toState" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PersonnelReviewEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PersonnelReview_schoolId_campusId_period_key" ON "PersonnelReview"("schoolId", "campusId", "period");
CREATE INDEX "PersonnelReview_schoolId_status_idx" ON "PersonnelReview"("schoolId", "status");
CREATE INDEX "PersonnelReview_campusId_status_idx" ON "PersonnelReview"("campusId", "status");
CREATE INDEX "PersonnelReviewEvent_reviewId_createdAt_idx" ON "PersonnelReviewEvent"("reviewId", "createdAt");
CREATE INDEX "PersonnelReviewEvent_actorId_idx" ON "PersonnelReviewEvent"("actorId");

ALTER TABLE "PersonnelReview" ADD CONSTRAINT "PersonnelReview_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PersonnelReview" ADD CONSTRAINT "PersonnelReview_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PersonnelReviewEvent" ADD CONSTRAINT "PersonnelReviewEvent_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "PersonnelReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PersonnelReviewEvent" ADD CONSTRAINT "PersonnelReviewEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
