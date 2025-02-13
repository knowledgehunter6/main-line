/*
  # Optimize RLS Policies

  1. Changes
    - Replace auth.uid() with (SELECT auth.uid()) in all policies for better performance
    - Consolidate multiple permissive policies into single policies with OR conditions
    - Remove redundant policies

  2. Security
    - Maintains same security rules but with optimized implementation
    - All tables retain RLS enabled
*/

-- Drop existing policies
DO $$ 
BEGIN
  -- Call sessions policies
  DROP POLICY IF EXISTS "Trainees can view their own call sessions" ON call_sessions;
  DROP POLICY IF EXISTS "Trainees can insert their own call sessions" ON call_sessions;
  DROP POLICY IF EXISTS "Trainers and admins can view all call sessions" ON call_sessions;
  DROP POLICY IF EXISTS "call_sessions_access_policy" ON call_sessions;

  -- Call feedback policies
  DROP POLICY IF EXISTS "Users can view feedback for their calls" ON call_feedback;
  DROP POLICY IF EXISTS "Users can insert feedback for their calls" ON call_feedback;
  DROP POLICY IF EXISTS "Trainers and admins can view all feedback" ON call_feedback;
  DROP POLICY IF EXISTS "Trainers and admins can insert feedback" ON call_feedback;
  DROP POLICY IF EXISTS "call_feedback_access_policy" ON call_feedback;
END $$;

-- Create optimized policies for call_sessions
CREATE POLICY "call_sessions_select_policy"
  ON call_sessions
  FOR SELECT
  TO authenticated
  USING (
    trainee_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = (SELECT auth.uid())
      AND users.role IN ('admin', 'trainer')
    )
  );

CREATE POLICY "call_sessions_insert_policy"
  ON call_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (trainee_id = (SELECT auth.uid()));

-- Create optimized policies for call_feedback
CREATE POLICY "call_feedback_select_policy"
  ON call_feedback
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM call_sessions
      WHERE call_sessions.id = call_feedback.call_session_id
      AND (
        call_sessions.trainee_id = (SELECT auth.uid())
        OR EXISTS (
          SELECT 1 FROM users
          WHERE users.id = (SELECT auth.uid())
          AND users.role IN ('admin', 'trainer')
        )
      )
    )
  );

CREATE POLICY "call_feedback_insert_policy"
  ON call_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM call_sessions
      WHERE call_sessions.id = call_feedback.call_session_id
      AND (
        call_sessions.trainee_id = (SELECT auth.uid())
        OR EXISTS (
          SELECT 1 FROM users
          WHERE users.id = (SELECT auth.uid())
          AND users.role IN ('admin', 'trainer')
        )
      )
    )
  );