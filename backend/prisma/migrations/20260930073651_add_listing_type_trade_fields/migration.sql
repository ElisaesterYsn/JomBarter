-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Listing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "listingType" TEXT NOT NULL DEFAULT 'PHYSICAL_ITEM',
    "condition" TEXT NOT NULL,
    "estimatedValue" REAL,
    "location" TEXT,
    "lookingFor" TEXT,
    "tradePreference" TEXT,
    "exchangeMethod" TEXT,
    "interestedInCategories" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Listing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Listing_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Listing" ("categoryId", "condition", "createdAt", "description", "estimatedValue", "id", "location", "lookingFor", "status", "title", "updatedAt", "userId") SELECT "categoryId", "condition", "createdAt", "description", "estimatedValue", "id", "location", "lookingFor", "status", "title", "updatedAt", "userId" FROM "Listing";
DROP TABLE "Listing";
ALTER TABLE "new_Listing" RENAME TO "Listing";
CREATE INDEX "Listing_userId_idx" ON "Listing"("userId");
CREATE INDEX "Listing_categoryId_idx" ON "Listing"("categoryId");
CREATE INDEX "Listing_status_idx" ON "Listing"("status");
CREATE INDEX "Listing_condition_idx" ON "Listing"("condition");
CREATE INDEX "Listing_createdAt_idx" ON "Listing"("createdAt");
CREATE INDEX "Listing_estimatedValue_idx" ON "Listing"("estimatedValue");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
