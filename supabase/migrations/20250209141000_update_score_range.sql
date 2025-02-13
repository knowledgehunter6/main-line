-- Step 1: Drop existing constraints and functions
DROP CONSTRAINT IF EXISTS valid_scores ON call_feedback;
DROP FUNCTION IF EXISTS calculate_average_score(jsonb);

-- Step 2: Add new constraints and functions
ALTER TABLE call_feedback
  ADD CONSTRAINT valid_scores
  CHECK (
    jsonb_typeof(scores) = 'object'
    AND (
      SELECT bool_and(jsonb_typeof(value) = 'number' AND (value::text)::numeric BETWEEN 1 AND 10)
      FROM jsonb_each(scores)
    )
  );

CREATE OR REPLACE FUNCTION calculate_average_score(scores jsonb)
RETURNS numeric AS $$
BEGIN
  RETURN (
    SELECT avg(value::numeric)
    FROM jsonb_each_text(scores)
    WHERE value::numeric BETWEEN 1 AND 10
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE; 