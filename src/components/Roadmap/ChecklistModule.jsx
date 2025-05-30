import React from 'react';
import { supabase } from '../../config/supabase';

export default function ChecklistModule({ 
  roadmapId, 
  dashboardId, 
  profileId,
  onProgressUpdate,
  onAllCompleted 
}) {
  const [checklistItems, setChecklistItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    fetchChecklistItems();
  }, [roadmapId, dashboardId, profileId]);

  const fetchChecklistItems = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch checklist items
      const { data: items, error: itemsError } = await supabase
        .from('checklist_to_roadmap')
        .select('*')
        .eq('roadmap_id', roadmapId)
        .order('order_index');

      if (itemsError) throw itemsError;

      // Fetch progress for these items
      const { data: progress, error: progressError } = await supabase
        .from('checklist_progress')
        .select('*')
        .eq('profile_id', profileId)
        .eq('dashboard_id', dashboardId)
        .in('checklist_id', items.map(item => item.id));

      if (progressError) throw progressError;

      // Combine items with their progress
      const itemsWithProgress = items.map(item => ({
        ...item,
        isCompleted: progress.some(p => p.checklist_id === item.id && p.is_completed)
      }));

      setChecklistItems(itemsWithProgress);

      // Calculate and emit progress
      const completedItems = itemsWithProgress.filter(item => item.isCompleted).length;
      const totalItems = itemsWithProgress.length;
      const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
      onProgressUpdate?.(progressPercentage);

      // Check if all items are completed
      if (totalItems > 0 && completedItems === totalItems) {
        onAllCompleted?.();
      }

    } catch (err) {
      console.error('Error fetching checklist items:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleItem = async (itemId, isCompleted) => {
    try {
      const { error } = await supabase
        .from('checklist_progress')
        .upsert({
          checklist_id: itemId,
          profile_id: profileId,
          dashboard_id: dashboardId,
          is_completed: isCompleted
        }, {
          onConflict: 'checklist_id,profile_id,dashboard_id'
        });

      if (error) throw error;

      // Update local state
      setChecklistItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, isCompleted } : item
      ));

      // Calculate and emit new progress
      const updatedItems = checklistItems.map(item => 
        item.id === itemId ? { ...item, isCompleted } : item
      );
      const completedItems = updatedItems.filter(item => item.isCompleted).length;
      const totalItems = updatedItems.length;
      const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
      onProgressUpdate?.(progressPercentage);

      // Check if all items are completed
      if (totalItems > 0 && completedItems === totalItems) {
        onAllCompleted?.();
      }

    } catch (err) {
      console.error('Error updating checklist item:', err);
      setError(err.message);
    }
  };

  if (loading && !checklistItems.length) {
    return (
      <div className="py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#6B46FE] mx-auto"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 py-4">
        {error}
      </div>
    );
  }

  if (!checklistItems.length) {
    return null;
  }

  return (
    <div className="mt-4">
      <h4 className="font-medium text-gray-900 mb-2">Requirements Checklist</h4>
      <div className="space-y-2">
        {checklistItems.map((item) => (
          <div 
            key={item.id}
            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <input
              type="checkbox"
              checked={item.isCompleted}
              onChange={(e) => handleToggleItem(item.id, e.target.checked)}
              className="w-4 h-4 text-[#6B46FE] focus:ring-[#6B46FE] rounded"
            />
            <span className={item.isCompleted ? 'line-through text-gray-500' : ''}>
              {item.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}