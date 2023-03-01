-- CreateTable
CREATE TABLE "Warehouse" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "remoteId" INTEGER,
    "vehicleName" TEXT NOT NULL,
    "vehicleId" INTEGER,
    "importerName" TEXT NOT NULL,
    "currentPrice" INTEGER NOT NULL,
    "exported" BOOLEAN NOT NULL DEFAULT false,
    "exporterName" TEXT,
    "exportedPrice" INTEGER
);

-- CreateTable
CREATE TABLE "Log" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "remoteId" INTEGER NOT NULL,
    "authorName" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_remoteId_key" ON "Warehouse"("remoteId");

-- CreateIndex
CREATE UNIQUE INDEX "Log_remoteId_key" ON "Log"("remoteId");
