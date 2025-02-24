import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSupabase } from './hooks/useSupabase';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AdminLayout from './pages/AdminSpace/AdminLayout';
import AdminDashboard from './pages/AdminSpace/AdminDashboard';
import UsersManagement from './pages/AdminSpace/UsersManagement';
import InterestAreas from './pages/AdminSpace/Settings/InterestAreas';
import Roadmaps from './pages/AdminSpace/Roadmaps';
import './index.css';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { session, loading } = useSupabase();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!session) {
    return <Navigate to="/login" />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route 
          path="/workspace" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Admin Routes */}
        <Route
          path="/adminspace"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UsersManagement />} />
          <Route path="settings/interest-areas" element={<InterestAreas />} />
          <Route path="roadmaps" element={<Roadmaps />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;