-- Update existing users without barbershopId from EMPLOYEE to CLIENT
UPDATE "user"
SET role = 'CLIENT'
WHERE role = 'EMPLOYEE' AND "barbershopId" IS NULL;
