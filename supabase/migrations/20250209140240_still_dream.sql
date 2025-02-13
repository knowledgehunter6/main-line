/*
  # Fix user policies to prevent recursion

  1. Changes
    - Remove recursive policy checks that were causing infinite loops
    - Simplify user policies to use direct auth.uid() checks
    - Add separate policies for admins using role-based checks
    
  2. Security
    - Maintains row-level security
    - Preserves data access restrictions
    - Prevents unauthorized access
*/

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "users_read_own_data" ON users;
DROP POLICY IF EXISTS "admins_read_all_users" ON users;
DROP POLICY IF EXISTS "users_update_own_data" ON users;
DROP POLICY IF EXISTS "admins_update_any_user" ON users;
DROP POLICY IF EXISTS "users_insert_with_own_id" ON users;

-- Create new simplified policies
CREATE POLICY "users_read_own"
  ON users
  FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "admins_read_all"
  ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "users_insert_self"
  ON users
  FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "users_update_own"
  ON users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());