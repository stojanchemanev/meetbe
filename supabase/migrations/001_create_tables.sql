-- DROP (reverse dependency order)
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS timeslots CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS businesses CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- USERS (no FK to auth)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('CLIENT', 'BUSINESS', 'ADMIN')),
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- BUSINESSES
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  logo TEXT,
  rating FLOAT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- EMPLOYEES
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(100) NOT NULL,
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SERVICES
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  duration INT NOT NULL,
  price VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TIMESLOTS
CREATE TABLE timeslots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  is_booked BOOLEAN NOT NULL DEFAULT FALSE,
  booked_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT timeslots_end_after_start CHECK (end_time > start_time)
);

-- APPOINTMENTS
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id UUID NOT NULL REFERENCES timeslots(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED')),
  cancellation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- FAVORITES
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT favorites_unique UNIQUE(client_id, business_id)
);

-- INDEXES
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_businesses_owner_id ON businesses(owner_id);
CREATE INDEX idx_employees_business_id ON employees(business_id);
CREATE INDEX idx_services_business_id ON services(business_id);
CREATE INDEX idx_timeslots_employee_id ON timeslots(employee_id);
CREATE INDEX idx_timeslots_business_id ON timeslots(business_id);
CREATE INDEX idx_timeslots_start_time ON timeslots(start_time);
CREATE INDEX idx_timeslots_is_booked ON timeslots(is_booked);
CREATE INDEX idx_appointments_slot_id ON appointments(slot_id);
CREATE INDEX idx_appointments_client_id ON appointments(client_id);
CREATE INDEX idx_appointments_business_id ON appointments(business_id);
CREATE INDEX idx_appointments_employee_id ON appointments(employee_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_service_id ON appointments(service_id);
CREATE INDEX idx_favorites_client_id ON favorites(client_id);
CREATE INDEX idx_favorites_business_id ON favorites(business_id);

-- EMPLOYEE-USER LINK INDEXES
-- One user per business (enforces the one-to-one employee↔user constraint per business)
CREATE UNIQUE INDEX idx_employees_business_user_unique
  ON employees (business_id, user_id)
  WHERE user_id IS NOT NULL;

-- Fast lookup: which businesses is this user an employee at?
CREATE INDEX idx_employees_user_id
  ON employees (user_id)
  WHERE user_id IS NOT NULL;

-- SELF-BOOKING PREVENTION
CREATE OR REPLACE FUNCTION prevent_employee_self_booking()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM employees
    WHERE business_id = NEW.business_id
      AND user_id = NEW.client_id
      AND user_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'EMPLOYEE_SELF_BOOKING: User % cannot book at business %.',
      NEW.client_id, NEW.business_id USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_employee_self_booking
  BEFORE INSERT ON appointments
  FOR EACH ROW EXECUTE FUNCTION prevent_employee_self_booking();

-- RLS ON EMPLOYEES
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Anyone can read employee cards (preserves existing /business/[id] behaviour)
CREATE POLICY "employees_public_read"
  ON employees FOR SELECT USING (true);

-- Business owner can manage their own employees (and set user_id)
CREATE POLICY "employees_owner_write"
  ON employees FOR ALL
  USING (
    EXISTS (SELECT 1 FROM businesses
            WHERE businesses.id = employees.business_id
              AND businesses.owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM businesses
            WHERE businesses.id = employees.business_id
              AND businesses.owner_id = auth.uid())
  );

-- Linked user can always read their own employee row (needed for navbar check)
CREATE POLICY "employees_self_read"
  ON employees FOR SELECT USING (user_id = auth.uid());
