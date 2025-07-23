-- Popular totalUsage com dados existentes da tabela Usage
UPDATE "Client" 
SET "totalUsage" = (
  SELECT COALESCE(SUM(value), 0) 
  FROM "Usage" 
  WHERE "Usage"."clientId" = "Client".id
);-- This is an empty migration.