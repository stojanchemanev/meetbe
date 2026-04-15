-- Employee ↔ Service junction table
-- Tracks which employees can perform which services within a business

CREATE TABLE IF NOT EXISTS employee_services (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  service_id  UUID NOT NULL REFERENCES services(id)  ON DELETE CASCADE,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT employee_services_unique UNIQUE (employee_id, service_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_employee_services_employee ON employee_services(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_services_service  ON employee_services(service_id);

-- RLS
ALTER TABLE employee_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employee_services_public_read"
  ON employee_services FOR SELECT USING (true);

CREATE POLICY "employee_services_owner_write"
  ON employee_services FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN businesses b ON b.id = e.business_id
      WHERE e.id = employee_services.employee_id
        AND b.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN businesses b ON b.id = e.business_id
      WHERE e.id = employee_services.employee_id
        AND b.owner_id = auth.uid()
    )
  );
