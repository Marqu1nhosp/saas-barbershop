-- Fix roles for OAuth users (users without password and without barbershopId)
-- They should be CLIENT, not EMPLOYEE
UPDATE "user"
SET role = 'CLIENT'
WHERE 
  "password" IS NULL
  AND "barbershopId" IS NULL
  AND role != 'CLIENT'
  AND role != 'ADMIN';
