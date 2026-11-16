UPDATE "user"
SET "role" = 'SUPERADMIN'
WHERE "email" = 'admin@barbearia.com'
  AND "barbershopId" IS NULL;
