-- AlterTable
ALTER TABLE "User" ADD COLUMN "password" TEXT;

-- Update existing users with a default hashed password (bcrypt hash of "1234")
UPDATE "User" SET "password" = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' WHERE "password" IS NULL;

-- Make the password field required
ALTER TABLE "User" ALTER COLUMN "password" SET NOT NULL;