-- Add selected_answers column to quiz_progress table
ALTER TABLE public.quiz_progress
ADD COLUMN IF NOT EXISTS selected_answers integer[] DEFAULT ARRAY[]::integer[];

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_quiz_progress_selected_answers 
ON public.quiz_progress USING GIN (selected_answers);

-- Drop needs_review column if it exists (since we're not using it anymore)
ALTER TABLE public.quiz_progress 
DROP COLUMN IF EXISTS needs_review;

-- Force a schema cache refresh
SELECT pg_notify('pgrst', 'reload schema');