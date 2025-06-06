export const COLORS = {
  primary: '#1a1b2e',
  secondary: '#6B46FE',
  success: '#10B981',
  // ... other colors
};

export const COMMON_CLASSES = {
  roundedLg: 'rounded-lg',
  // ... other common classes
};

setDashboardProgress(prev => ({
  ...prev,
  [activeDashboard.id]: progress
}));
