-- Migration: RBAC Roles and Scope
-- Date: 2026-08-26
-- Description:
--   1. Extend Role enum: add SUPER_ADMIN, DISTRICT_ADMIN, SUBJECT_HEAD
--   2. Repurpose WARD_ADMIN semantic: now = UBND Xa commune (was Phong GD&DT)
--      Existing WARD_ADMIN users are migrated to DISTRICT_ADMIN.
--   3. Add ScopeType enum
--   4. Add UserRoleScope table (user x role x scope many-to-many)
--   5. Add CampusWardMap table (campus <-> ward geographic mapping)
--   6. Add mustChangePassword column to User

-- ============================================================
-- STEP 1: Add new Role enum values
-- ============================================================

ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'DISTRICT_ADMIN';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'SUBJECT_HEAD';

-- ============================================================
-- STEP 2: Migrate existing WARD_ADMIN rows to DISTRICT_ADMIN
-- Old WARD_ADMIN = Phong GD&DT => new name is DISTRICT_ADMIN.
-- New WARD_ADMIN = UBND Xa commune (a narrower role).
-- ============================================================

UPDATE "User"
SET role = 'DISTRICT_ADMIN'
WHERE role = 'WARD_ADMIN';

-- ============================================================
-- STEP 3: Add ScopeType enum
-- ============================================================

CREATE TYPE "ScopeType" AS ENUM (
  'GLOBAL',
  'CAMPUS',
  'SUBJECT_GROUP',
  'WARD'
);

-- ============================================================
-- STEP 4: Add mustChangePassword column to User
-- ============================================================

ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

-- ============================================================
-- STEP 5: Create UserRoleScope table
-- ============================================================

CREATE TABLE "UserRoleScope" (
  "id"             TEXT NOT NULL,
  "userId"         TEXT NOT NULL,
  "role"           "Role" NOT NULL,
  "scopeType"      "ScopeType" NOT NULL,
  "scopeId"        TEXT,
  "subjectGroupId" TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "UserRoleScope_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserRoleScope_userId_role_scopeId_subjectGroupId_key"
  ON "UserRoleScope"("userId", "role", "scopeId", "subjectGroupId");

CREATE INDEX "UserRoleScope_userId_idx"          ON "UserRoleScope"("userId");
CREATE INDEX "UserRoleScope_role_idx"            ON "UserRoleScope"("role");
CREATE INDEX "UserRoleScope_subjectGroupId_idx"  ON "UserRoleScope"("subjectGroupId");

ALTER TABLE "UserRoleScope"
  ADD CONSTRAINT "UserRoleScope_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserRoleScope"
  ADD CONSTRAINT "UserRoleScope_subjectGroupId_fkey"
    FOREIGN KEY ("subjectGroupId") REFERENCES "SubjectGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- STEP 6: Create CampusWardMap table
-- ============================================================

CREATE TABLE "CampusWardMap" (
  "campusId" TEXT NOT NULL,
  "wardId"   TEXT NOT NULL,

  CONSTRAINT "CampusWardMap_pkey" PRIMARY KEY ("campusId", "wardId")
);

CREATE INDEX "CampusWardMap_campusId_idx" ON "CampusWardMap"("campusId");
CREATE INDEX "CampusWardMap_wardId_idx"   ON "CampusWardMap"("wardId");

ALTER TABLE "CampusWardMap"
  ADD CONSTRAINT "CampusWardMap_campusId_fkey"
    FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CampusWardMap"
  ADD CONSTRAINT "CampusWardMap_wardId_fkey"
    FOREIGN KEY ("wardId") REFERENCES "DistrictWard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- STEP 7: Backfill UserRoleScope for existing users
-- ============================================================

INSERT INTO "UserRoleScope" ("id", "userId", "role", "scopeType", "createdAt")
SELECT
  gen_random_uuid()::TEXT,
  "id",
  'ADMIN'::"Role",
  'GLOBAL'::"ScopeType",
  NOW()
FROM "User"
WHERE role = 'ADMIN'
ON CONFLICT DO NOTHING;

INSERT INTO "UserRoleScope" ("id", "userId", "role", "scopeType", "scopeId", "createdAt")
SELECT
  gen_random_uuid()::TEXT,
  "id",
  'VICE_PRINCIPAL'::"Role",
  'CAMPUS'::"ScopeType",
  "campusId",
  NOW()
FROM "User"
WHERE role = 'VICE_PRINCIPAL' AND "campusId" IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO "UserRoleScope" ("id", "userId", "role", "scopeType", "createdAt")
SELECT
  gen_random_uuid()::TEXT,
  "id",
  'DISTRICT_ADMIN'::"Role",
  'GLOBAL'::"ScopeType",
  NOW()
FROM "User"
WHERE role = 'DISTRICT_ADMIN'
ON CONFLICT DO NOTHING;

-- ============================================================
-- RUN INSTRUCTIONS:
--   Option A (recommended): npx prisma migrate dev --name rbac_roles_and_scope
--   Option B (manual):      psql $DATABASE_URL -f prisma/migrations/20260826000000_rbac_roles_and_scope/migration.sql
--   After applying:         npx prisma db seed
-- ============================================================