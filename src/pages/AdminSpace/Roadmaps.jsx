import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import RoadmapStepModal from '../../components/RoadmapStepModal';
import PreviewModal from '../../components/Roadmap/PreviewModal';

export default function Roadmaps() {
  const [interestAreas, setInterestAreas] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [modules, setModules] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverTask, setDragOverTask] = useState(null);
  const [dragOverModule, setDragOverModule] = useState(null);
  const [previewTask, setPreviewTask] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [moduleFormData, setModuleFormData] = useState({ title: '' });
  const [activeModule, setActiveModule] = useState(null);

  useEffect(() => {
    fetchInterestAreas();
  }, []);

  useEffect(() => {
    if (activeTab) {
      fetchModules();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab) {
      fetchTasks();
    }
  }, [activeTab]);

  const fetchInterestAreas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('interest_areas')
        .select('*')
        .order('title');

      if (error) throw error;
      setInterestAreas(data || []);
      
      if (data && data.length > 0 && !activeTab) {
        setActiveTab(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching interest areas:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchModules = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('roadmap_modules')
        .select('*')
        .eq('interest_area_id', activeTab)
        .order('order_index');

      if (error) throw error;
      setModules(data || []);
      
      if (data && data.length > 0 && !activeModule) {
        setActiveModule(data[0].id);
      } else if (!data || data.length === 0) {
        setActiveModule(null);
      }
    } catch (err) {
      console.error('Error fetching modules:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data: tasksData, error: tasksError } = await supabase
        .from('roadmap_tasks')
        .select('*')
        .order('order_index');

      if (tasksError) throw tasksError;

      // Fetch additional data for each task
      const tasksWithDetails = await Promise.all(tasksData.map(async (task) => {
        const [
          { data: quizItems }
        ] = await Promise.all([
          supabase
            .from('quiz_to_roadmap')
            .select('id')
            .eq('roadmap_id', task.id)
        ]);

        return {
          ...task,
          hasVideos: task.video_links?.length > 0,
          hasQuiz: quizItems?.length > 0
        };
      }));

      setTasks(tasksWithDetails || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveModule = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setError(null);

      const { data: existingModules } = await supabase
        .from('roadmap_modules')
        .select('order_index')
        .eq('interest_area_id', activeTab)
        .order('order_index', { ascending: false })
        .limit(1);

      const nextOrderIndex = (existingModules?.[0]?.order_index ?? 0) + 1;

      const { data, error } = await supabase
        .from('roadmap_modules')
        .insert({
          interest_area_id: activeTab,
          title: moduleFormData.title,
          order_index: nextOrderIndex
        })
        .select()
        .single();

      if (error) throw error;

      setModules(prev => [...prev, data]);
      setModuleFormData({ title: '' });
      setShowModuleModal(false);
      setActiveModule(data.id);
    } catch (err) {
      console.error('Error saving module:', err);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveStep = async (formData) => {
    try {
      setIsSaving(true);
      setError(null);

      // Process video links
      const videoLinks = formData.videoLinks.map(link => ({
        url: link.url,
        shortcode: link.shortcode
      }));

      // Save the main task data
      const taskData = {
        title: formData.title?.trim() || '',
        description: formData.description?.trim() || '',
        video_links: videoLinks,
        module_id: activeModule
      };

      let result;
      if (editingTask) {
        const { data, error: updateError } = await supabase
          .from('roadmap_tasks')
          .update(taskData)
          .eq('id', editingTask.id)
          .select()
          .single();

        if (updateError) throw updateError;
        result = data;
      } else {
        const { data: existingTasks } = await supabase
          .from('roadmap_tasks')
          .select('order_index')
          .eq('module_id', activeModule)
          .order('order_index', { ascending: false })
          .limit(1);

        const nextOrderIndex = (existingTasks?.[0]?.order_index ?? 0) + 1;

        const { data, error: insertError } = await supabase
          .from('roadmap_tasks')
          .insert({
            ...taskData,
            order_index: nextOrderIndex
          })
          .select()
          .single();

        if (insertError) throw insertError;
        result = data;
      }

      // If save was successful and we have a roadmap task id
      if (result?.id) {
        const taskId = result.id;

        // Handle quiz items
        const validQuizItems = (formData.quizItems || []).filter(item => 
          item?.question?.trim() && 
          (item.options || []).filter(opt => opt?.trim()).length >= 2 &&
          item.correctAnswers?.length > 0
        );

        if (editingTask) {
          // For existing task, first delete all existing quiz items
          await supabase
            .from('quiz_to_roadmap')
            .delete()
            .eq('roadmap_id', taskId);
        }

        // Insert new quiz items
        if (validQuizItems.length > 0) {
          const { error: quizError } = await supabase
            .from('quiz_to_roadmap')
            .insert(
              validQuizItems.map((item, index) => ({
                roadmap_id: taskId,
                question: item.question.trim(),
                options: item.options.filter(opt => opt?.trim()),
                correct_answers: item.correctAnswers,
                explanation: item.explanation?.trim() || null,
                order_index: index
              }))
            );

          if (quizError) throw quizError;
        }
      }

      setIsModalOpen(false);
      setEditingTask(null);
      fetchTasks();

      return result;
    } catch (err) {
      console.error('Error saving step:', err.message);
      setError(err.message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClick = (task) => {
    setEditingTask(task);
    setActiveModule(task.module_id);
    setIsModalOpen(true);
  };

  const handlePreviewClick = (task) => {
    setPreviewTask(task);
    setShowPreviewModal(true);
  };

  const handleDeleteStep = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('roadmap_tasks')
        .delete()
        .eq('id', deleteTarget);

      if (error) throw error;

      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      fetchTasks();
    } catch (err) {
      console.error('Error deleting step:', err);
      setError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDragStart = (task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e, task, moduleId) => {
    e.preventDefault();
    if (task?.id !== draggedTask?.id) {
      setDragOverTask(task);
    }
    if (moduleId) {
      setDragOverModule(moduleId);
    }
  };

  const handleDragLeave = () => {
    setDragOverTask(null);
    setDragOverModule(null);
  };

  const handleDrop = async (targetTask, targetModuleId) => {
    if (!draggedTask) {
      setDraggedTask(null);
      setDragOverTask(null);
      setDragOverModule(null);
      return;
    }

    try {
      setLoading(true);
      
      let newOrderIndex;
      let newModuleId = targetModuleId || draggedTask.module_id;

      if (targetTask) {
        // If dropping on another task, use its order index
        newOrderIndex = targetTask.order_index;
        
        // Update order of other tasks
        await supabase.rpc('reorder_roadmap_tasks', {
          task_id: draggedTask.id,
          new_order: newOrderIndex,
          module_id: newModuleId
        });
      } else {
        // If dropping on a module, add to the end of that module
        const { data: lastTask } = await supabase
          .from('roadmap_tasks')
          .select('order_index')
          .eq('module_id', newModuleId)
          .order('order_index', { ascending: false })
          .limit(1)
          .single();

        newOrderIndex = (lastTask?.order_index || 0) + 1;
      }

      // Update the task with new module and order
      const { error: updateError } = await supabase
        .from('roadmap_tasks')
        .update({
          module_id: newModuleId,
          order_index: newOrderIndex
        })
        .eq('id', draggedTask.id);

      if (updateError) throw updateError;

      fetchTasks();
    } catch (err) {
      console.error('Error reordering tasks:', err);
      setError(err.message);
    } finally {
      setDraggedTask(null);
      setDragOverTask(null);
      setDragOverModule(null);
      setLoading(false);
    }
  };

  if (loading && !tasks.length) {
    return (
      <div className="p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Delete Lesson</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this lesson? This action cannot be undone.
            </p>
            
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteTarget(null);
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteStep}
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Module Modal */}
      {showModuleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Add New Module</h2>
            <form onSubmit={handleSaveModule}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Module Title
                </label>
                <input
                  type="text"
                  value={moduleFormData.title}
                  onChange={(e) => setModuleFormData({ title: e.target.value })}
                  placeholder="e.g., Module 1 - Introduction"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a1b2e]"
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModuleModal(false);
                    setModuleFormData({ title: '' });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1a1b2e] text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Module'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      <PreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        task={previewTask}
      />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Roadmaps</h1>
      </div>

      {/* Mobile Selector */}
      <div className="lg:hidden mb-6">
        <select
          value={activeTab || ''}
          onChange={(e) => setActiveTab(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a1b2e]"
        >
          <option value="" disabled>Select Interest Area</option>
          {interestAreas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.title}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop Tabs */}
      <div className="hidden lg:block border-b border-gray-200 mb-6">
        <div className="flex space-x-8">
          {interestAreas.map((area) => (
            <button
              key={area.id}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === area.id
                  ? 'border-[#1a1b2e] text-[#1a1b2e]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab(area.id)}
            >
              {area.title}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div>
        {activeTab && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg lg:text-xl font-semibold text-gray-900">
                {interestAreas.find(area => area.id === activeTab)?.title} Roadmap
              </h2>
              <button
                onClick={() => setShowModuleModal(true)}
                className="bg-[#1a1b2e] text-white px-4 py-2 rounded-lg hover:bg-opacity-90"
              >
                Add New Module
              </button>
            </div>

            {/* Modules */}
            <div className="mb-8 space-y-6">
              {modules.map((module) => (
                <div 
                  key={module.id} 
                  className="bg-gray-50 p-6 rounded-lg"
                  onDragOver={(e) => handleDragOver(e, null, module.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={() => handleDrop(null, module.id)}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">{module.title}</h3>
                    <button
                      onClick={() => {
                        setActiveModule(module.id);
                        setEditingTask(null);
                        setIsModalOpen(true);
                      }}
                      className="bg-[#1a1b2e] text-white px-4 py-2 rounded-lg hover:bg-opacity-90"
                    >
                      Add New Lesson
                    </button>
                  </div>

                  {/* Tasks list */}
                  <div className="space-y-4">
                    {tasks
                      .filter(task => task.module_id === module.id)
                      .map((task, index) => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={() => handleDragStart(task)}
                        onDragOver={(e) => handleDragOver(e, task)}
                        onDragLeave={handleDragLeave}
                        onDrop={() => handleDrop(task)}
                        className={`
                          bg-white border rounded-lg p-4 lg:p-6 cursor-move transition-all duration-200
                          ${draggedTask?.id === task.id ? 'opacity-50' : ''}
                          ${dragOverTask?.id === task.id ? 'border-[#1a1b2e] border-2 shadow-lg' : 'hover:shadow-md'}
                          ${dragOverTask?.id === task.id ? 'transform scale-[1.02]' : ''}
                        `}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                              <span className="text-gray-500 font-medium">Lesson {index + 1}</span>
                              <div className="flex items-center gap-2">
                                {task.hasVideos && (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                                    Videos
                                  </span>
                                )}
                                {task.hasQuiz && (
                                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                                    Quiz
                                  </span>
                                )}
                              </div>
                            </div>
                            <h3 className="text-lg font-semibold">{task.title}</h3>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handlePreviewClick(task)}
                              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                              title="Preview"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleEditClick(task)}
                              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                              title="Edit"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113 .536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget(task.id);
                                setShowDeleteConfirm(true);
                              }}
                              className="p-2 text-gray-400 hover:text-red-600 rounded-lg"
                              title="Delete"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Step Modal */}
      <RoadmapStepModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveStep}
        loading={isSaving}
        editData={editingTask}
      />
    </div>
  );
}