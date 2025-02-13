/*
  # Database Optimizations

  1. Changes
    - Add missing index for foreign key on call_sessions
    - Remove unused indexes
    - Optimize users table RLS policies with SELECT subqueries

  2. Performance
    - Improves query performance for foreign key lookups
    - Reduces database size by removing unused indexes
    - Optimizes RLS policy evaluation
*/

-- Add missing index for foreign key
CREATE INDEX IF NOT EXISTS idx_call_sessions_trainee_id 
  ON call_sessions (trainee_id);

-- Remove unused indexes
DROP INDEX IF EXISTS idx_assigned_scenarios_assigned_by;
DROP INDEX IF EXISTS idx_assigned_scenarios_scenario;
DROP INDEX IF EXISTS idx_call_feedback_trainer;
DROP INDEX IF EXISTS idx_assigned_scenarios_trainee_complete;
DROP INDEX IF EXISTS idx_call_feedback_session_trainer;
DROP INDEX IF EXISTS idx_users_auth_lookup;

-- Drop existing users policies
DROP POLICY IF EXISTS users_read_own ON users;
DROP POLICY IF EXISTS users_insert_public ON users;

-- Create optimized policies for users table
CREATE POLICY "users_select_policy"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = (SELECT auth.uid())
      AND u.role = 'admin'
    )
  );

CREATE POLICY "users_insert_policy"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    id = (SELECT auth.uid())
  );