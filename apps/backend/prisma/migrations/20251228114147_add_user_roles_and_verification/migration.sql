-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phoneNumber" TEXT NOT NULL,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "email" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "state" TEXT NOT NULL,
    "lga" TEXT,
    "role" TEXT NOT NULL DEFAULT 'attendee',
    "walletBalance" INTEGER NOT NULL DEFAULT 0,
    "referralCode" TEXT NOT NULL,
    "referredBy" TEXT,
    "organizationName" TEXT,
    "organizationType" TEXT,
    "bankDetails" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" DATETIME,
    "adminLevel" TEXT,
    "permissions" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "firstName", "id", "lastName", "lga", "phoneNumber", "phoneVerified", "preferredLanguage", "referralCode", "referredBy", "role", "state", "updatedAt", "walletBalance") SELECT "createdAt", "email", "firstName", "id", "lastName", "lga", "phoneNumber", "phoneVerified", "preferredLanguage", "referralCode", "referredBy", "role", "state", "updatedAt", "walletBalance" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");
CREATE INDEX "User_phoneNumber_idx" ON "User"("phoneNumber");
CREATE INDEX "User_referralCode_idx" ON "User"("referralCode");
CREATE INDEX "User_state_preferredLanguage_idx" ON "User"("state", "preferredLanguage");
CREATE INDEX "User_role_idx" ON "User"("role");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
