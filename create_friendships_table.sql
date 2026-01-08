-- Create friendships table
CREATE TABLE IF NOT EXISTS "friendships" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "friendId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "friendships_userId_friendId_key" UNIQUE ("userId", "friendId"),
    CONSTRAINT "friendships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "friendships_friendId_fkey" FOREIGN KEY ("friendId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "friendships_userId_idx" ON "friendships"("userId");
CREATE INDEX IF NOT EXISTS "friendships_friendId_idx" ON "friendships"("friendId");
CREATE INDEX IF NOT EXISTS "friendships_status_idx" ON "friendships"("status");