-- Drop existing column
ALTER TABLE public.quiz_to_roadmap
DROP COLUMN IF EXISTS correct_answer;

-- Add new column for multiple correct answers
ALTER TABLE public.quiz_to_roadmap
ADD COLUMN correct_answers integer[] DEFAULT ARRAY[]::integer[];

-- Create index for better performance
CREATE INDEX idx_quiz_correct_answers ON public.quiz_to_roadmap USING GIN (correct_answers);