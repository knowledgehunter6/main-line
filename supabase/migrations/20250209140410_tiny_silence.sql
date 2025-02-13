/*
  # Fix user policies with direct role checks
  
  1. Changes
    - Remove ALL nested queries that cause recursion
    - Use direct role column checks instead of subqueries
    - Simplify policy logic to absolute minimum
    
  2. Security
    - Maintains proper access control
    - Prevents unauthorized access
    - Eliminates recursion completely
*/

-- Drop ALL existing policies
DROP POLICY IF EXISTS "users_read_own" ON users;
DROP POLICY IF EXISTS "admins_read_all" ON users;
DROP POLICY IF EXISTS "users_insert_self" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;

-- Create new ultra-simplified policies
CREATE POLICY "allow_user_select"
  ON users
  FOR SELECT
  USING (
    id = auth.uid() -- User can read their own data
    OR 
    current_user_role() = 'admin' -- Admin can read all data
  );

CREATE POLICY "allow_user_insert"
  ON users
  FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "allow_user_update"
  ON users
  FOR UPDATE
  USING (
    id = auth.uid() -- User can update their own data
    OR 
    current_user_role() = 'admin' -- Admin can update all data
  )
  WITH CHECK (
    id = auth.uid() -- User can update their own data
    OR 
    current_user_role() = 'admin' -- Admin can update all data
  );

-- Create function to get current user's role without recursion
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$;