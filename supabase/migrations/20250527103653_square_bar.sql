-- First drop existing constraints if they exist
ALTER TABLE stripe_checkout_sessions
DROP CONSTRAINT IF EXISTS valid_income_range,
DROP CONSTRAINT IF EXISTS valid_budget_range,
DROP CONSTRAINT IF EXISTS valid_skill_level,
DROP CONSTRAINT IF EXISTS valid_time_commitment;

-- Add check constraints for registration form data
ALTER TABLE stripe_checkout_sessions
ADD CONSTRAINT valid_income_range 
  CHECK (income_max >= income_min AND income_min >= 0),
ADD CONSTRAINT valid_budget_range 
  CHECK (budget_max >= budget_min AND budget_min >= 0),
ADD CONSTRAINT valid_skill_level 
  CHECK (skill_level IN ('beginner', 'intermediate', 'advanced')),
ADD CONSTRAINT valid_time_commitment
  CHECK (time_commitment IN (
    '2-5 hours/week',
    '5-10 hours/week',
    '10-20 hours/week',
    '20-30 hours/week',
    '30+ hours/week'
  ));