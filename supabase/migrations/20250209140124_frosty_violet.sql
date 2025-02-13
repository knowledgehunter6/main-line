/*
  # Fix users table RLS policies

  1. Changes
    - Remove recursive policy that was causing infinite recursion
    - Simplify user access policies
    - Add proper policies for user management
  
  2. Security
    - Users can read their own data
    - Admins can read all user data
    - Users can only update their own data
    - Admins can update any user data
*/

-- Drop existing policies
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;

-- Create new simplified policies
CREATE POLICY "users_read_own_data"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "admins_read_all_users"
  ON users
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

CREATE POLICY "users_update_own_data"
  ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "admins_update_any_user"
  ON users
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

CREATE POLICY "users_insert_with_own_id"
  ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);