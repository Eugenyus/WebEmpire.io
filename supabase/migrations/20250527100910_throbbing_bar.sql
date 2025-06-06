/*
  # Add registration form fields to stripe_checkout_sessions

  1. Changes
    - Add income_min and income_max for income goal step
    - Add time_commitment for time commitment step
    - Add budget_min and budget_max for budget step
    - Add skill_level for skill level step
    - Add interest_area for selected interest area
    - Add registration_data jsonb for any additional data
*/

-- Add columns for registration form data
ALTER TABLE stripe_checkout_sessions
ADD COLUMN income_min integer,
ADD COLUMN income_max integer,
ADD COLUMN time_commitment text,
ADD COLUMN budget_min integer,
ADD COLUMN budget_max integer,
ADD COLUMN skill_level text,
ADD COLUMN interest_area text REFERENCES public.interest_areas(id),


-- Add constraints to ensure valid data
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
CREATE INDEX idx_stripe_sessions_interest_area 
ON stripe_checkout_sessions(interest_area);

CREATE INDEX idx_stripe_sessions_skill_level 
ON stripe_checkout_sessions(skill_level);