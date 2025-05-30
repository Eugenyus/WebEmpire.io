/*
  # Add registration form data validation

  1. Changes
    - Add check constraints for registration form data
    - Add indexes for better query performance
*/

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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_stripe_sessions_income_range 
ON stripe_checkout_sessions(income_min, income_max);

CREATE INDEX IF NOT EXISTS idx_stripe_sessions_budget_range 
ON stripe_checkout_sessions(budget_min, budget_max);

CREATE INDEX IF NOT EXISTS idx_stripe_sessions_skill_level 
ON stripe_checkout_sessions(skill_level);

CREATE INDEX IF NOT EXISTS idx_stripe_sessions_time_commitment 
ON stripe_checkout_sessions(time_commitment);