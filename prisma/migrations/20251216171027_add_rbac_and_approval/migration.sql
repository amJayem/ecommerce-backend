-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" INTEGER,
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "Role" (
    "name" TEXT NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" SERIAL NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PermissionToRole" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PermissionToRole_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Permission_action_key" ON "Permission"("action");

-- CreateIndex
CREATE INDEX "_PermissionToRole_B_index" ON "_PermissionToRole"("B");

-- Data Migration: Seed Roles
INSERT INTO "Role" ("name") VALUES ('customer'), ('admin'), ('moderator') ON CONFLICT DO NOTHING;

-- Data Migration: Safety net - Ensure all existing user roles exist in Role table
INSERT INTO "Role" ("name") 
SELECT DISTINCT "role" FROM "User" WHERE "role" IS NOT NULL
ON CONFLICT DO NOTHING;

-- Data Migration: Seed Permissions
INSERT INTO "Permission" ("action", "description") VALUES 
('user.manage', 'Manage all users'),
('user.approve', 'Approve pending users'),
('user.read', 'Read user details')
ON CONFLICT DO NOTHING;

-- Data Migration: Assign Permissions to Roles
-- Admin gets all
INSERT INTO "_PermissionToRole" ("A", "B")
SELECT p.id, 'admin' FROM "Permission" p
ON CONFLICT DO NOTHING;

-- Moderator gets approve and read
INSERT INTO "_PermissionToRole" ("A", "B")
SELECT p.id, 'moderator' FROM "Permission" p WHERE p.action IN ('user.approve', 'user.read')
ON CONFLICT DO NOTHING;

-- Data Migration: Set existing users to APPROVED
UPDATE "User" SET "status" = 'APPROVED' WHERE "id" IS NOT NULL;


-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_role_fkey" FOREIGN KEY ("role") REFERENCES "Role"("name") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PermissionToRole" ADD CONSTRAINT "_PermissionToRole_A_fkey" FOREIGN KEY ("A") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PermissionToRole" ADD CONSTRAINT "_PermissionToRole_B_fkey" FOREIGN KEY ("B") REFERENCES "Role"("name") ON DELETE CASCADE ON UPDATE CASCADE;
