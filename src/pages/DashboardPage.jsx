import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProfileData } from '../hooks/useProfileData';
import { useCalendarSubscription } from '../hooks/useCalendarSubscription';
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
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    label: 'Home',
    active: true
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    label: 'Challenges & Rewards'
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    label: 'Webinars'
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    label: 'Community'
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    label: 'Support'
  }
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const {
    isLoading,
    error,
    fullName,
    isConfirmed,
    dashboards,
    activeDashboard,
    modules,
    notifications,
    profileId,
    setActiveDashboard,
    setModules,
    setNotifications,
    setIsConfirmed,
  } = useProfileData();

  useCalendarSubscription(profileId, setNotifications);

  const [isExpanded, setIsExpanded] = useState(true);
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [selectedNewInterest, setSelectedNewInterest] = useState(null);
  const [isAddingStream, setIsAddingStream] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [isDeletingDashboard, setIsDeletingDashboard] = useState(false);
  const [dashboardProgress, setDashboardProgress] = useState({});
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [activeModule, setActiveModule] = useState(null);

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

  const handleDashboardChange = async (dashboard) => {
    setActiveDashboard(dashboard);
    setIsExpanded(true);
    setShowMobileMenu(false);
    
    try {
      const { data: modulesData } = await supabase
        .from('roadmap_modules')
        .select('*')
        .eq('interest_area_id', dashboard.interest_area)
        .order('order_index');

      setModules(modulesData || []);
      if (modulesData?.length > 0) {
        setActiveModule(modulesData[0].id);
      }
    } catch (err) {
      console.error('Error fetching modules:', err);
      setError(err.message);
    }
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

      <div className={`min-h-screen flex flex-col lg:flex-row ${!isConfirmed ? 'blur-sm' : ''}`}>
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b p-4 sticky top-0 z-50">
          <div className="flex justify-between items-center">
            <Logo />
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Left Sidebar */}
        <div className={`
          ${showMobileMenu ? 'block' : 'hidden'} 
          lg:block lg:w-[350px] bg-white border-r
          fixed lg:relative inset-0 z-40
          overflow-y-auto pt-[60px] lg:pt-0
        `}>
          {/* Logo and Action Icons */}
          <div className="p-6 flex justify-between items-center">
            <Logo />
            <div className="flex items-center gap-2">
              <Link
                to="/"
                className="p-2 hover:bg-gray-100 rounded-full border border-gray-200 w-[50px] h-[50px] flex items-center justify-center"
                title="Home"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </Link>
              <button 
                className="p-2 hover:bg-gray-100 rounded-full border border-gray-200 w-[50px] h-[50px] flex items-center justify-center"
                title="Notifications"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              <button 
                onClick={handleSignOut}
                className="p-2 hover:bg-gray-100 rounded-full border border-gray-200 w-[50px] h-[50px] flex items-center justify-center"
                title="Sign Out"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 11-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
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
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
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
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                      <button 
                        onClick={() => activeDashboard?.id === dashboard.id && setIsExpanded(!isExpanded)}
                        className="transform transition-transform duration-200"
                      >
                        <svg 
                          className={`w-6 h-6 transform transition-transform duration-200 ${
                            activeDashboard?.id === dashboard.id && isExpanded ? '' : 'rotate-180'
                          }`}
                          fill="none"
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
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
                      <div className="bg-white rounded-[10px] p-[10px] space-y-1 hidden">
                        {navigationItems.map((item, index) => (
                          <button
                            key={index}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors rounded-lg
                              ${item.active ? 'bg-[#1a1b2e] text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                          >
                            <span className={`${item.active ? 'text-white' : 'text-gray-500'}`}>
                              {item.icon}
                            </span>
                            <span className="font-medium">{item.label}</span>
                          </button>
                        ))}
                      </div>

                      {/* Modules List */}
                      <div className="mt-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-2 px-2">Modules</h3>
                        <div className="bg-white rounded-[10px] p-[10px] space-y-1">
                          {modules.map((module) => (
                            <button
                              key={module.id}
                              onClick={() => setActiveModule(module.id)}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors rounded-lg ${
                                activeModule === module.id
                                  ? 'bg-[#1a1b2e] text-white'
                                  : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <span className="font-medium">{module.title}</span>
                            </button>
                          ))}
                        </div>
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
              <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 4v8m-4-4h8" />
              </svg>
              <span className="font-medium">Add An Income Stream</span>
            </button>


          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-white p-4 lg:p-8">
          <div className="max-w-4xl mx-auto">
            {/* Welcome Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 lg:p-6 mb-8">
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
                  Welcome back{fullName ? ` ${fullName}` : ''}!
                </h1>
                <p className="text-gray-600">Here's what's happening with your projects today.</p>
              </div>
            </div>

            {/* Roadmap Section */}
            <div className="mt-8 border border-gray-200 rounded-lg p-4 lg:p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg lg:text-xl font-semibold">The Roadmap to your success</h2>
              </div>
              {activeDashboard && (
                <Roadmap 
                  interestArea={activeDashboard.interest_area}
                  activeModule={activeModule}
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
        <div className="w-full lg:w-[400px] bg-white p-4 lg:p-5 border-t lg:border-t-0 lg:border-l">
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
              <div className="bg-[#2a3350] rounded-xl p-1 hidden">
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
          <div className="mt-6 bg-white p-4 lg:p-6 rounded-[10px] border border-gray-200">
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