import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { format, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import Logo from '../components/Logo';
import ConfirmationModal from '../components/ConfirmationModal';
import Roadmap from '../components/Roadmap/Roadmap';
import Calendar from '../components/Calendar/Calendar';

// Interest areas constant
const INTEREST_AREAS = [
  {
    id: 'affiliate',
    title: 'Affiliate Marketing',
    description: 'Learn how to earn commissions by promoting products you love.'
  },
  {
    id: 'digital',
    title: 'Digital Products',
    description: 'Turn your ideas into income by crafting and selling digital products that inspire.'
  },
  {
    id: 'dropshipping',
    title: 'Dropshipping',
    description: 'Build a hassle-free online store—no inventory needed'
  },
  {
    id: 'nocode',
    title: 'No-Code Development',
    description: 'Build apps and websites effortlessly without writing a single line of code.'
  },
  {
    id: 'trading',
    title: 'Trading',
    description: 'Learn how to grow your income through smart investments tailored to your risk level.'
  }
];

// Navigation items constant
const navigationItems = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    label: 'Home',
    active: true
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
        <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    label: 'Challenges & Rewards'
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
        <path d="M8 12h8M8 8h8M8 16h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    label: 'Webinars'
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
        <path d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    label: 'Community'
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
        <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    label: 'Support'
  }
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedItem, setExpandedItem] = useState(1);
  const [fullName, setFullName] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(true);
  const [dashboards, setDashboards] = useState([]);
  const [activeDashboard, setActiveDashboard] = useState(null);
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [selectedNewInterest, setSelectedNewInterest] = useState(null);
  const [isAddingStream, setIsAddingStream] = useState(false);
  const [error, setError] = useState(null);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingDashboard, setIsDeletingDashboard] = useState(false);
  const [dashboardProgress, setDashboardProgress] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [profileId, setProfileId] = useState(null);

  useEffect(() => {
    const getProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        
        if (!user) {
          navigate('/login');
          return;
        }

        if (user.user_metadata?.full_name) {
          setFullName(user.user_metadata.full_name);
        }
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, selected_interest, confirmation')
          .eq('user_id', user.id)
          .single();
        
        if (profileError) throw profileError;
        
        if (profile) {
          setProfileId(profile.id);
          setIsConfirmed(profile.confirmation === 1);

          const { data: dashboardsData, error: dashboardsError } = await supabase
            .from('dashboards')
            .select('*')
            .eq('profile_id', profile.id);

          if (dashboardsError) throw dashboardsError;

          if (dashboardsData && dashboardsData.length > 0) {
            // Fetch progress for each dashboard
            const progressPromises = dashboardsData.map(async (dashboard) => {
              const { data: tasks } = await supabase
                .from('roadmap_to_user')
                .select('status')
                .eq('dashboard_id', dashboard.id);

              const totalTasks = tasks?.length || 0;
              const completedTasks = tasks?.filter(t => 
                t.status === 'completed' || t.status === 'skipped'
              ).length || 0;
              
              return {
                dashboardId: dashboard.id,
                percentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
              };
            });

            const progressResults = await Promise.all(progressPromises);
            const progressMap = progressResults.reduce((acc, curr) => {
              acc[curr.dashboardId] = curr.percentage;
              return acc;
            }, {});

            setDashboardProgress(progressMap);
            setDashboards(dashboardsData);
            setActiveDashboard(dashboardsData[0]);

            // Fetch calendar notifications (overdue and today's tasks)
            const today = startOfDay(new Date());
            const { data: calendarItems, error: calendarError } = await supabase
              .from('user_calendar')
              .select('*')
              .eq('profile_id', profile.id)
              .lte('date', endOfDay(today).toISOString())
              .order('date');

            if (calendarError) throw calendarError;

            // Filter and sort notifications
            const sortedNotifications = (calendarItems || [])
              .map(item => ({
                ...item,
                isOverdue: isBefore(new Date(item.date), today)
              }))
              .sort((a, b) => {
                // Sort overdue items first, then by date
                if (a.isOverdue && !b.isOverdue) return -1;
                if (!a.isOverdue && b.isOverdue) return 1;
                return new Date(a.date) - new Date(b.date);
              });

            setNotifications(sortedNotifications);
          }
        }
      } catch (err) {
        console.error('Error loading profile:', err.message);
        setError('Failed to load profile data. Please try refreshing the page.');
      } finally {
        setIsLoading(false);
      }
    };

    getProfile();
  }, [navigate]);

  useEffect(() => {
    if (!profileId) return;

    // Subscribe to calendar changes
    const channel = supabase
      .channel('calendar_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_calendar',
          filter: `profile_id=eq.${profileId}`
        },
        handleCalendarChange
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId]);

  const handleCalendarChange = (payload) => {
    const today = startOfDay(new Date());

    switch (payload.eventType) {
      case 'INSERT': {
        const newItem = {
          ...payload.new,
          isOverdue: isBefore(new Date(payload.new.date), today)
        };
        
        if (!isAfter(new Date(newItem.date), today)) {
          setNotifications(prev => {
            const newNotifications = [...prev, newItem].sort((a, b) => {
              if (a.isOverdue && !b.isOverdue) return -1;
              if (!a.isOverdue && b.isOverdue) return 1;
              return new Date(a.date) - new Date(b.date);
            });
            return newNotifications;
          });
        }
        break;
      }
      case 'DELETE':
        setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
        break;
      case 'UPDATE': {
        const updatedItem = {
          ...payload.new,
          isOverdue: isBefore(new Date(payload.new.date), today)
        };
        
        setNotifications(prev => {
          const filtered = prev.filter(n => n.id !== payload.new.id);
          if (!isAfter(new Date(updatedItem.date), today)) {
            filtered.push(updatedItem);
          }
          return filtered.sort((a, b) => {
            if (a.isOverdue && !b.isOverdue) return -1;
            if (!a.isOverdue && b.isOverdue) return 1;
            return new Date(a.date) - new Date(b.date);
          });
        });
        break;
      }
    }
  };

  const handleAddNewStream = async () => {
    if (!selectedNewInterest) return;

    setIsAddingStream(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error('No profile found');

      const { data: existingDashboards } = await supabase
        .from('dashboards')
        .select('id')
        .eq('profile_id', profile.id)
        .eq('interest_area', selectedNewInterest);

      if (existingDashboards && existingDashboards.length > 0) {
        throw new Error('You already have a dashboard for this interest area');
      }

      const { data: newDashboard, error: insertError } = await supabase
        .from('dashboards')
        .insert({
          profile_id: profile.id,
          interest_area: selectedNewInterest
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setDashboards(prev => [...prev, newDashboard]);
      setActiveDashboard(newDashboard);
      setShowInterestModal(false);
      setSelectedNewInterest(null);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAddingStream(false);
    }
  };

  const handleRemoveDashboard = async () => {
    if (!activeDashboard) return;

    // Prevent deleting if this is the last dashboard
    if (dashboards.length <= 1) {
      setError('You cannot delete your last dashboard. Please create another dashboard first.');
      setShowRemoveModal(false);
      return;
    }

    try {
      setIsDeletingDashboard(true);
      setError(null);
      
      const { error: deleteError } = await supabase
        .from('dashboards')
        .delete()
        .eq('id', activeDashboard.id);

      if (deleteError) throw deleteError;

      const updatedDashboards = dashboards.filter(d => d.id !== activeDashboard.id);
      setDashboards(updatedDashboards);
      setActiveDashboard(updatedDashboards[0] || null);
      setShowRemoveModal(false);
    } catch (err) {
      console.error('Error removing dashboard:', err.message);
      setError(err.message);
    } finally {
      setIsDeletingDashboard(false);
    }
  };

  const handleDashboardChange = (dashboard) => {
    setActiveDashboard(dashboard);
    setIsExpanded(true);
  };

  const handleConfirmation = () => {
    setIsConfirmed(true);
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/');
    } catch (err) {
      console.error('Error signing out:', err.message);
      setError('Failed to sign out. Please try again.');
    }
  };

  const getInterestTitle = (interestId) => {
    const interest = INTEREST_AREAS.find(i => i.id === interestId);
    return interest ? interest.title : interestId;
  };

  const formatDisplayName = (fullName) => {
    if (!fullName) return '';
    const names = fullName.trim().split(' ');
    if (names.length < 2) return fullName;
    const firstName = names[0];
    const lastInitial = names[names.length - 1][0];
    return `${firstName} ${lastInitial}.`;
  };

  const getInitials = (fullName) => {
    if (!fullName) return '';
    return fullName
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <button 
            onClick={() => window.location.reload()}
            className="bg-primary text-white px-6 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {!isConfirmed && <ConfirmationModal onConfirm={handleConfirmation} />}
      
      {/* Remove Dashboard Modal */}
      {showRemoveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Remove Dashboard</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to remove the {getInterestTitle(activeDashboard?.interest_area)} dashboard? This action cannot be undone.
            </p>
            
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowRemoveModal(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={isDeletingDashboard}
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveDashboard}
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                disabled={isDeletingDashboard || dashboards.length <= 1}
              >
                {isDeletingDashboard ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Interest Modal */}
      {showInterestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
            <h2 className="text-2xl font-bold mb-6">Select a New Income Stream</h2>
            
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              {INTEREST_AREAS.filter(interest => 
                !dashboards.some(d => d.interest_area === interest.id)
              ).map((interest) => (
                <div
                  key={interest.id}
                  onClick={() => setSelectedNewInterest(interest.id)}
                  className={`p-6 rounded-lg border cursor-pointer transition-all hover:border-gray-300 ${
                    selectedNewInterest === interest.id ? 'border-[#1a1b2e] bg-[#1a1b2e] text-white' : 'border-gray-200'
                  }`}
                >
                  <h3 className="font-semibold text-lg">{interest.title}</h3>
                  <p className={`text-sm ${selectedNewInterest === interest.id ? 'text-gray-200' : 'text-gray-600'}`}>
                    {interest.description}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex justify-between items-center">
              <button
                onClick={handleAddNewStream}
                disabled={!selectedNewInterest || isAddingStream}
                className={`px-6 py-2 rounded-lg font-medium ${
                  !selectedNewInterest || isAddingStream
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-[#10B981] text-white hover:bg-opacity-90'
                }`}
              >
                {isAddingStream ? 'Adding...' : 'Add New Income Stream'}
              </button>
              <button
                onClick={() => {
                  setShowInterestModal(false);
                  setSelectedNewInterest(null);
                  setError(null);
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg"
                disabled={isAddingStream}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`min-h-screen flex ${!isConfirmed ? 'blur-sm' : ''}`}>
        {/* Left Sidebar */}
        <div className="w-[350px] bg-white border-r">
          {/* Logo and Action Icons */}
          <div className="p-6 flex justify-between items-center">
            <Logo />
            <div className="flex items-center gap-2">
              <Link
                to="/"
                className="p-2 hover:bg-gray-100 rounded-full border border-gray-200 w-[50px] h-[50px] flex items-center justify-center"
                title="Home"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z" fill="currentColor"/>
                </svg>
              </Link>
              <button 
                className="p-2 hover:bg-gray-100 rounded-full border border-gray-200 w-[50px] h-[50px] flex items-center justify-center"
                title="Notifications"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.37 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.64 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16ZM16 17H8V11C8 8.52 9.51 6.5 12 6.5C14.49 6.5 16 8.52 16 11V17Z" fill="currentColor"/>
                </svg>
              </button>
              <button 
                onClick={handleSignOut}
                className="p-2 hover:bg-gray-100 rounded-full border border-gray-200 w-[50px] h-[50px] flex items-center justify-center"
                title="Sign Out"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" fill="currentColor"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Section Title */}
          <div className="px-6 pt-[30px]">
            <h2 className="text-base font-semibold text-gray-900 tracking-wider uppercase">
              YOUR PASSIVE INCOME STREAMS
            </h2>
          </div>

          {/* Navigation Area */}
          <div className="px-6 pt-6">
            {/* Dashboard Panels */}
            <div className="space-y-4">
              {dashboards.map((dashboard) => (
                <div 
                  key={dashboard.id}
                  className={`bg-[#f0f1f3] rounded-[10px] p-4 ${
                    activeDashboard?.id === dashboard.id ? 'ring-2 ring-[#1a1b2e]' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div 
                      className="flex items-center gap-2 cursor-pointer"
                      onClick={() => handleDashboardChange(dashboard)}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 3H5C3.89 3 3 3.9 3 5V19C3 20.1 3.89 21 5 21H19C20.11 21 21 20.1 21 19V5C21 3.9 20.11 3 19 3ZM19 19H5V5H19V19Z" fill="#1A1B2E"/>
                        <path d="M17 7H7V9H17V7ZM17 11H7V13H17V11ZM14 15H7V17H14V15Z" fill="#1A1B2E"/>
                      </svg>
                      <span className="font-medium">
                        {getInterestTitle(dashboard.interest_area)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {activeDashboard?.id === dashboard.id && dashboards.length > 1 && (
                        <button
                          onClick={() => setShowRemoveModal(true)}
                          className="p-1 hover:bg-gray-200 rounded-full"
                          title="Remove Dashboard"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                      <button 
                        onClick={() => activeDashboard?.id === dashboard.id && setIsExpanded(!isExpanded)}
                        className="transform transition-transform duration-200"
                      >
                        <svg 
                          width="24" 
                          height="24" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          xmlns="http://www.w3.org/2000/svg"
                          className={`transform transition-transform duration-200 ${
                            activeDashboard?.id === dashboard.id && isExpanded ? '' : 'rotate-180'
                          }`}
                        >
                          <path d="M7 10L12 15L17 10" stroke="#1A1B2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                  {activeDashboard?.id === dashboard.id && isExpanded && (
                    <>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex-1 bg-white rounded-full h-2">
                          <div 
                            className="bg-[#6B46FE] h-2 rounded-full" 
                            style={{ width: `${dashboardProgress[dashboard.id] || 0}%` }}
                          />
                        </div>
                        <span className="text-sm text-[#6B46FE] font-medium">
                          {dashboardProgress[dashboard.id] || 0}%
                        </span>
                      </div>

                      {/* Navigation Menu */}
                      <div className="bg-white rounded-[10px] p-[10px]">
                        {navigationItems.map((item, index) => (
                          <button
                            key={index}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                              ${item.active ? 'bg-[#1a1b2e] text-white rounded-[10px]' : 'text-gray-700 hover:bg-gray-50'}`}
                          >
                            <span className={`${item.active ? 'text-white' : 'text-gray-500'}`}>
                              {item.icon}
                            </span>
                            <span className="font-medium">{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Add Income Streams Button */}
            <button 
              onClick={() => setShowInterestModal(true)}
              className="flex items-center gap-2 text-[#10B981] mt-4 px-2"
              disabled={dashboards.length >= INTEREST_AREAS.length}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 3.33334V12.6667" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3.33334 8H12.6667" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="font-medium">Add An Income Stream</span>
            </button>

            {/* Go Pro Section */}
            <div className="mt-4 bg-[#1a1b2e] rounded-[10px] p-6 text-center h-[270px] flex flex-col justify-between">
              {/* Cloud Icon */}
              <div className="flex-1 flex items-center justify-center">
                <svg width="96" height="96" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
                  <path d="M36 28C39.3137 28 42 25.3137 42 22C42 18.6863 39.3137 16 36 16C35.8098 16 35.6215 16.0096 35.4355 16.0284C34.4779 12.5331 31.2793 10 27.5 10C24.7829 10 22. 3577 11.4013 21 13.5C19.6423 11.4013 17.2171 10 14.5 10C9.80558 10 6 13.8056 6 18.5C6 23.1944 9.80558 27 14.5 27H16" stroke="#10B981" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <h3 className="text-white text-xl font-semibold mb-1">Go Pro</h3>
                <p className="text-gray-400 text-sm mb-4">Check our pricing plans</p>
                <button className="w-full bg-[#7C3AED] text-white py-2 rounded-lg hover:bg-opacity-90 transition-colors">
                  View Pricing
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Middle content */}
        <div className=" flex-1 bg-white p-8">
          <div className="max-w-4xl mx-auto">
            {/* Welcome Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome back{fullName ? ` ${fullName}` : ''}!
                </h1>
                <p className="text-gray-600">Here's what's happening with your projects today.</p>
              </div>
            </div>

            {/* Roadmap Section */}
            <div className="mt-8 border border-gray-200 rounded-lg p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">The Roadmap to your success</h2>
              </div>
              {activeDashboard && (
                <Roadmap 
                  interestArea={activeDashboard.interest_area}
                  onProgressUpdate={(progress) => {
                    setDashboardProgress(prev => ({
                      ...prev,
                      [activeDashboard.id]: progress
                    }));
                  }}
                />
              )}
            </div>

            {/* Calendar Section */}
            <div className="mt-8">
              <Calendar activeDashboardId={activeDashboard?.id} />
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-[400px] bg-white p-5">
          <div className="bg-[#1a1b2e] p-6 rounded-[10px]">
            <div className="bg-[#20273f] rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <img 
                  src={`https://ui-avatars.com/api/?name=${getInitials(fullName)}&background=6B46FE&color=fff&bold=true`}
                  alt="Profile" 
                  className="w-10 h-10 rounded-full" 
                />
                <div>
                  <div className="font-semibold text-white">{formatDisplayName(fullName)}</div>
                  <div className="text-sm text-gray-400">
                    {activeDashboard ? getInterestTitle(activeDashboard.interest_area) : ''}
                  </div>
                </div>
                <button className="ml-auto">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none">
                    <path d="M19 9l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              <div className="bg-[#2a3350] rounded-xl p-1">
                <div className="flex justify-center gap-4">
                  {['🏆', '🌍', '🤝', '🎯'].map((emoji, index) => (
                    <div key={index} className="w-16 h-16 flex items-center justify-center text-2xl">
                      {emoji}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-white">Completed / Remaining tasks</h3>
              
              {/* Progress Circle */}
              <div className="relative w-32 h-32 mx-auto mb-4">
                <svg className="w-full h-full transform -rotate-90">
                  {/* Background circle */}
                  <circle
                    cx="64"
                    cy="64"
                    r="60"
                    fill="none"
                    stroke="#2a3350"
                    strokeWidth="8"
                  />
                  {/* Progress circle */}
                  {activeDashboard && (
                    <circle
                      cx="64"
                      cy="64"
                      r="60"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 60}`}
                      strokeDashoffset={`${2 * Math.PI * 60 * (1 - (dashboardProgress[activeDashboard.id] || 0) / 100)}`}
                      strokeLinecap="round"
                    />
                  )}
                  {/* Percentage text */}
                  <text
                    x="64"
                    y="64"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize="24"
                    fontWeight="bold"
                    className="font-bold"
                    transform="rotate(90 64 64)"
                  >
                    {activeDashboard ? `${dashboardProgress[activeDashboard.id] || 0}%` : '0%'}
                  </text>
                </svg>
              </div>

              <div className="flex justify-between text-sm mt-4 text-white">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Total Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#2a3350] rounded-full"></div>
                  <span>Remaining Tasks</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="mt-6 bg-white p-6 rounded-[10px] border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Notifications</h3>
            
            <div className="space-y-4">
              {notifications.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No notifications</p>
              ) : (
                notifications.map((notification) => (
                  <div 
                    key={notification.id}
                    className={`flex items-start gap-4 p-4 rounded-lg ${
                      notification.isOverdue ? 'bg-red-50' : 'bg-gray-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      notification.isOverdue ? 'bg-red-500' : 'bg-[#1a1b2e]'
                    } text-white`}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-medium ${notification.isOverdue ? 'text-red-800' : 'text-gray-900'}`}>
                        {notification.title}
                      </h4>
                      {notification.description && (
                        <p className={`text-sm mt-1 ${notification.isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
                          {notification.description}
                        </p>
                      )}
                      <p className={`text-sm mt-2 ${notification.isOverdue ? 'text-red-600 font-medium' : 'text-[#6B46FE]'}`}>
                        {notification.isOverdue ? 'Overdue: ' : 'Due: '}
                        {format(new Date(notification.date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}