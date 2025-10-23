-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "orgName" TEXT,
    "regCode" TEXT,
    "vat" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "segment" TEXT NOT NULL DEFAULT 'RETAIL',
    "consentEmail" BOOLEAN NOT NULL DEFAULT false,
    "consentSms" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Ring" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ringDate" DATETIME NOT NULL,
    "region" TEXT NOT NULL,
    "driver" TEXT,
    "visibleFrom" DATETIME NOT NULL,
    "visibleTo" DATETIME NOT NULL,
    "cutoffAt" DATETIME NOT NULL,
    "capacityOrders" INTEGER,
    "capacityKg" DECIMAL,
    "status" TEXT NOT NULL DEFAULT 'OPEN'
);

-- CreateTable
CREATE TABLE "Stop" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ringId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "meetingPoint" TEXT NOT NULL,
    "timeStart" DATETIME NOT NULL,
    "timeEnd" DATETIME NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    CONSTRAINT "Stop_ringId_fkey" FOREIGN KEY ("ringId") REFERENCES "Ring" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Product" (
    "sku" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "uom" TEXT NOT NULL,
    "catchWeight" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "PriceList" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "segment" TEXT NOT NULL,
    "validFrom" DATETIME NOT NULL,
    "validTo" DATETIME
);

-- CreateTable
CREATE TABLE "PriceItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "priceListId" TEXT NOT NULL,
    "productSku" TEXT NOT NULL,
    "unitPrice" DECIMAL NOT NULL,
    CONSTRAINT "PriceItem_priceListId_fkey" FOREIGN KEY ("priceListId") REFERENCES "PriceList" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PriceItem_productSku_fkey" FOREIGN KEY ("productSku") REFERENCES "Product" ("sku") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "channel" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "ringId" TEXT NOT NULL,
    "stopId" TEXT NOT NULL,
    "deliveryType" TEXT NOT NULL,
    "deliveryAddress" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "notesCustomer" TEXT,
    "notesInternal" TEXT,
    "paymentMethod" TEXT NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
    "invoiceId" TEXT,
    "invoiceTotal" DECIMAL,
    "taxRate" DECIMAL,
    "pickedBy" TEXT,
    "deliveredBy" TEXT,
    CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_ringId_fkey" FOREIGN KEY ("ringId") REFERENCES "Ring" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_stopId_fkey" FOREIGN KEY ("stopId") REFERENCES "Stop" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrderLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "productSku" TEXT NOT NULL,
    "uom" TEXT NOT NULL,
    "requestedQty" DECIMAL NOT NULL,
    "packedQty" DECIMAL,
    "packedWeight" DECIMAL,
    "unitPrice" DECIMAL,
    "lineTotal" DECIMAL,
    "substitutionAllowed" BOOLEAN NOT NULL DEFAULT false,
    "substitutionSku" TEXT,
    CONSTRAINT "OrderLine_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OrderLine_productSku_fkey" FOREIGN KEY ("productSku") REFERENCES "Product" ("sku") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");
