import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import RoadmapStep from './RoadmapStep';

export default function Roadmap({ interestArea, activeModule, onProgressUpdate }) {
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedStepId, setExpandedStepId] = useState(null);
  const [visibleSteps, setVisibleSteps] = useState(5);
  const [userProgress, setUserProgress] = useState({});
  const [profileId, setProfileId] = useState(null);
  const [dashboardId, setDashboardId] = useState(null);
  const [moduleTitle, setModuleTitle] = useState('');

  const STEPS_PER_LOAD = 5;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          setProfileId(profile.id);

          const { data: dashboard } = await supabase
            .from('dashboards')
            .select('id')
            .eq('profile_id', profile.id)
            .eq('interest_area', interestArea)
            .single();

          if (dashboard) {
            setDashboardId(dashboard.id);
          }
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err.message);
      }
    };

    fetchUserData();
  }, [interestArea]);

  useEffect(() => {
    if (activeModule) {
      fetchSteps();
      fetchModuleTitle();
    }
  }, [activeModule]);

  const fetchModuleTitle = async () => {
    try {
      const { data, error } = await supabase
        .from('roadmap_modules')
        .select('title')
        .eq('id', activeModule)
        .single();

      if (error) throw error;
      if (data) {
        setModuleTitle(data.title);
      }
    } catch (err) {
      console.error('Error fetching module title:', err);
    }
  };

  const fetchSteps = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('roadmap_tasks')
        .select('*')
        .eq('module_id', activeModule)
        .order('order_index');

      if (error) throw error;

      // Only fetch progress if we have both profileId and dashboardId
      if (profileId && dashboardId) {
        const { data: progress, error: progressError } = await supabase
          .from('roadmap_to_user')
          .select('roadmap_id, status')
          .eq('profile_id', profileId)
          .eq('dashboard_id', dashboardId);

        if (progressError) throw progressError;

        if (progress) {
          const progressMap = progress.reduce((acc, curr) => {
            acc[curr.roadmap_id] = curr.status;
            return acc;
          }, {});
          setUserProgress(progressMap);
          
          // Find the last completed step and expand the next one
          let lastCompletedIndex = -1;
          data?.forEach((step, index) => {
            if (progressMap[step.id] === 'completed') {
              lastCompletedIndex = index;
            }
          });

          // If we found a completed step and it's not the last step,
          // expand the next step
          if (lastCompletedIndex >= 0 && lastCompletedIndex < data.length - 1) {
            setExpandedStepId(data[lastCompletedIndex + 1].id);
            // Ensure the expanded step is visible
            setVisibleSteps(Math.max(visibleSteps, lastCompletedIndex + 2));
          } else if (lastCompletedIndex === -1 && data?.length > 0) {
            // If no steps are completed, expand the first step
            setExpandedStepId(data[0].id);
          }
          
          // Calculate and emit progress percentage
          const totalTasks = data?.length || 0;
          const completedTasks = data?.filter(step => progressMap[step.id] === 'completed').length || 0;
          const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
          onProgressUpdate?.(percentage);
        }
      } else {
        // Reset progress if we don't have profileId or dashboardId
        setUserProgress({});
        onProgressUpdate?.(0);
      }

      setSteps(data || []);
    } catch (err) {
      console.error('Error fetching steps:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (stepId, newStatus) => {
    try {
      // Only update status if we have both profileId and dashboardId
      if (!profileId || !dashboardId) {
        console.warn('Cannot update status: profileId or dashboardId is missing');
        return;
      }

      const { error: upsertError } = await supabase
        .from('roadmap_to_user')
        .upsert({
          profile_id: profileId,
          dashboard_id: dashboardId,
          roadmap_id: stepId,
          status: newStatus
        }, {
          onConflict: 'profile_id,dashboard_id,roadmap_id'
        });

      if (upsertError) throw upsertError;

      // Update local state
      const newProgress = {
        ...userProgress,
        [stepId]: newStatus
      };
      setUserProgress(newProgress);
      
      // Update progress percentage
      const totalTasks = steps.length;
      const completedTasks = steps.filter(step => newProgress[step.id] === 'completed').length;
      const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      onProgressUpdate?.(percentage);

      // If a step is completed, find and expand the next incomplete step
      if (newStatus === 'completed') {
        const currentIndex = steps.findIndex(step => step.id === stepId);
        if (currentIndex < steps.length - 1) {
          const nextStep = steps[currentIndex + 1];
          setExpandedStepId(nextStep.id);
          // Ensure the next step is visible
          setVisibleSteps(Math.max(visibleSteps, currentIndex + 2));
        }
      }
    } catch (err) {
      console.error('Error updating step status:', err);
      setError(err.message);
    }
  };

  const handleNextStep = (currentIndex) => {
    if (currentIndex < steps.length - 1) {
      const nextStep = steps[currentIndex + 1];
      setExpandedStepId(nextStep.id);
      
      // Ensure the next step is visible
      if (currentIndex + 1 >= visibleSteps) {
        setVisibleSteps(currentIndex + 2);
      }

      // Scroll to the next step
      setTimeout(() => {
        const nextStepElement = document.getElementById(`step-${nextStep.id}`);
        if (nextStepElement) {
          nextStepElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  const handleToggleStep = (stepId) => {
    setExpandedStepId(expandedStepId === stepId ? null : stepId);
  };

  const handleViewMore = () => {
    setVisibleSteps(prev => Math.min(prev + STEPS_PER_LOAD, steps.length));
  };

  const handleHideSteps = () => {
    setVisibleSteps(5);
    // Find the last completed step and expand the next one
    let lastCompletedIndex = -1;
    steps.forEach((step, index) => {
      if (userProgress[step.id] === 'completed') {
        lastCompletedIndex = index;
      }
    });

    if (lastCompletedIndex >= 0 && lastCompletedIndex < steps.length - 1) {
      setExpandedStepId(steps[lastCompletedIndex + 1].id);
    } else if (lastCompletedIndex === -1 && steps.length > 0) {
      setExpandedStepId(steps[0].id);
    }
  };

  const getRemainingSteps = () => {
    return steps.length - visibleSteps;
  };

  if (loading && !steps.length) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6B46FE] mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading roadmap...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-600 mb-2">Failed to load roadmap</div>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  if (!steps.length) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">No lessons have been added to this module yet.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Module Title */}
      <h2 className="text-2xl font-bold text-[#1a1b2e] mb-6">{moduleTitle}</h2>

      {/* Steps List */}
      <div className="space-y-1">
        {steps.slice(0, visibleSteps).map((step, index) => (
          <div key={step.id} id={`step-${step.id}`}>
            <RoadmapStep
              id={step.id}
              title={step.title}
              description={step.description}
              status={userProgress[step.id] || 'not_started'}
              onStatusChange={(newStatus) => handleStatusChange(step.id, newStatus)}
              isExpanded={expandedStepId === step.id}
              onToggle={() => handleToggleStep(step.id)}
              isFirst={index === 0}
              isLast={index === visibleSteps - 1}
              video_links={step.video_links}
              onNext={() => handleNextStep(index)}
              dashboardId={dashboardId}
              profileId={profileId}
              stepNumber={index + 1}
            />
          </div>
        ))}
      </div>

      {/* View More/Less Button */}
      {getRemainingSteps() > 0 ? (
        <button
          onClick={handleViewMore}
          className="mt-4 w-full py-3 px-4 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 4v12m-6-6h12" />
          </svg>
          View more {Math.min(getRemainingSteps(), STEPS_PER_LOAD)} steps
        </button>
      ) : visibleSteps > 5 && (
        <button
          onClick={handleHideSteps}
          className="mt-4 w-full py-3 px-4 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 10h12" />
          </svg>
          Hide steps
        </button>
      )}
    </div>
  );
}