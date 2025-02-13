/*
  # Update schema for simplified call training system

  1. Changes
    - Add call_feedback table
    - Update call_sessions table structure
    - Add RLS policies for all tables
    
  2. Security
    - Enable RLS on all tables
    - Add comprehensive access policies
*/

-- Call sessions table modifications
DO $$ BEGIN
  -- Drop old columns if they exist
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'call_sessions' AND column_name = 'scenario_type'
  ) THEN
    ALTER TABLE call_sessions DROP COLUMN scenario_type;
    ALTER TABLE call_sessions DROP COLUMN emotional_state;
    ALTER TABLE call_sessions DROP COLUMN recording;
    ALTER TABLE call_sessions DROP COLUMN feedback;
  END IF;

  -- Add new columns if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'call_sessions' AND column_name = 'transcript'
  ) THEN
    ALTER TABLE call_sessions ADD COLUMN transcript jsonb;
    ALTER TABLE call_sessions ADD COLUMN recording_url text;
  END IF;
END $$;

-- Create call_feedback table if it doesn't exist
CREATE TABLE IF NOT EXISTS call_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_session_id uuid REFERENCES call_sessions(id),
  scores jsonb NOT NULL,
  comments text,
  is_automated boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE call_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_feedback ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ BEGIN
  -- Call sessions policies
  DROP POLICY IF EXISTS "Trainees can view their own call sessions" ON call_sessions;
  DROP POLICY IF EXISTS "Trainees can insert their own call sessions" ON call_sessions;
  DROP POLICY IF EXISTS "Trainers and admins can view all call sessions" ON call_sessions;

  -- Call feedback policies
  DROP POLICY IF EXISTS "Users can view feedback for their calls" ON call_feedback;
  DROP POLICY IF EXISTS "Users can insert feedback for their calls" ON call_feedback;
  DROP POLICY IF EXISTS "Trainers and admins can view all feedback" ON call_feedback;
  DROP POLICY IF EXISTS "Trainers and admins can insert feedback" ON call_feedback;
END $$;

-- Create new policies
-- RLS Policies for call_sessions table
CREATE POLICY "Trainees can view their own call sessions"
  ON call_sessions
  FOR SELECT
  TO authenticated
  USING (trainee_id = auth.uid());

CREATE POLICY "Trainees can insert their own call sessions"
  ON call_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (trainee_id = auth.uid());

CREATE POLICY "Trainers and admins can view all call sessions"
  ON call_sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'trainer')
    )
  );

-- RLS Policies for call_feedback table
CREATE POLICY "Users can view feedback for their calls"
  ON call_feedback
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM call_sessions
      WHERE call_sessions.id = call_feedback.call_session_id
      AND call_sessions.trainee_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert feedback for their calls"
  ON call_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM call_sessions
      WHERE call_sessions.id = call_feedback.call_session_id
      AND call_sessions.trainee_id = auth.uid()
    )
  );

CREATE POLICY "Trainers and admins can view all feedback"
  ON call_feedback
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'trainer')
    )
  );

CREATE POLICY "Trainers and admins can insert feedback"
  ON call_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'trainer')
    )
  );