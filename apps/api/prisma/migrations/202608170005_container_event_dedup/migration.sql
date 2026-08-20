DROP INDEX IF EXISTS "ContainerEvent_tenantId_md5Hash_key";
CREATE UNIQUE INDEX "ContainerEvent_containerId_md5Hash_key" ON "ContainerEvent" ("containerId", "md5Hash");
CREATE INDEX IF NOT EXISTS "ContainerEvent_tenantId_md5Hash_idx" ON "ContainerEvent" ("tenantId", "md5Hash");
