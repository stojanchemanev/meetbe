-- Add claim token columns to employees
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS claim_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS claim_expires_at TIMESTAMPTZ;

-- Enforce one-business-per-user at the DB level:
-- A user_id can only appear once across the entire employees table.
CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_user_unique
  ON employees (user_id)
  WHERE user_id IS NOT NULL;

-- SECURITY DEFINER function so anyone with a valid token can claim
-- their employee record without needing to be the business owner.
CREATE OR REPLACE FUNCTION claim_employee(p_token TEXT)
RETURNS employees LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_employee employees;
BEGIN
  -- Find an unclaimed record with a valid, non-expired token
  SELECT * INTO v_employee
  FROM employees
  WHERE claim_token = p_token
    AND claim_expires_at > NOW()
    AND user_id IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INVALID_OR_EXPIRED_TOKEN';
  END IF;

  -- Reject if this user is already linked to any business
  IF EXISTS (
    SELECT 1 FROM employees
    WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'ALREADY_EMPLOYEE';
  END IF;

  -- Claim: link user and clear the token
  UPDATE employees
  SET user_id          = auth.uid(),
      claim_token      = NULL,
      claim_expires_at = NULL,
      updated_at       = NOW()
  WHERE id = v_employee.id
  RETURNING * INTO v_employee;

  RETURN v_employee;
END;
$$;
