-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ListingImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listingId" TEXT NOT NULL,
    "imageUrl" TEXT,
    "videoUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ListingImage_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ListingImage" ("createdAt", "id", "imageUrl", "listingId", "sortOrder") SELECT "createdAt", "id", "imageUrl", "listingId", "sortOrder" FROM "ListingImage";
DROP TABLE "ListingImage";
ALTER TABLE "new_ListingImage" RENAME TO "ListingImage";
CREATE INDEX "ListingImage_listingId_idx" ON "ListingImage"("listingId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
