-- Add function to reorder tasks
CREATE OR REPLACE FUNCTION reorder_roadmap_tasks(
    task_id uuid,
    new_order integer,
    area_id text
)
RETURNS void AS $$
DECLARE
    old_order integer;
BEGIN
    -- Get the current order of the task
    SELECT order_index INTO old_order
    FROM public.roadmap_tasks
    WHERE id = task_id;

    IF new_order > old_order THEN
        -- Moving down: update tasks in between old and new position
        UPDATE public.roadmap_tasks
        SET order_index = order_index - 1
        WHERE interest_area_id = area_id
        AND order_index > old_order
        AND order_index <= new_order;
    ELSE
        -- Moving up: update tasks in between new and old position
        UPDATE public.roadmap_tasks
        SET order_index = order_index + 1
        WHERE interest_area_id = area_id
        AND order_index >= new_order
        AND order_index < old_order;
    END IF;

    -- Update the task to its new position
    UPDATE public.roadmap_tasks
    SET order_index = new_order
    WHERE id = task_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION reorder_roadmap_tasks TO authenticated;

-- Create policy for executing reorder function
CREATE POLICY "Allow reorder for admin users"
    ON public.roadmap_tasks
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
    );