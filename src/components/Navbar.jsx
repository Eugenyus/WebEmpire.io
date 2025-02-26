import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSupabase } from '../hooks/useSupabase';
import { supabase } from '../config/supabase';
import Logo from './Logo';

export default function Navbar() {
  const { session } = useSupabase();
  const navigate = useNavigate();
  const [userRole, setUserRole] = React.useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  React.useEffect(() => {
    const getUserRole = async () => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();
        
        if (profile) {
          setUserRole(profile.role);
        }
      }
    };

    getUserRole();
  }, [session]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/');
    } catch (err) {
      console.error('Error signing out:', err.message);
    }
  };

  return (
    <nav className="flex flex-col md:flex-row md:items-center justify-between p-4 border-b">
      <div className="flex items-center justify-between">
        <Logo />
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
      </div>

      <div className={`${isMenuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-8 mt-4 md:mt-0`}>
        <Link to="/" className="text-gray-700">Home</Link>
        <Link to="#" className="text-gray-700">Product</Link>
        <Link to="#" className="text-gray-700">Pricing</Link>
        <Link to="#" className="text-gray-700">About</Link>
        {session ? (
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <Link 
              to={userRole === 'admin' ? '/adminspace' : '/workspace'} 
              className="bg-primary text-white px-6 py-2 rounded-lg w-full md:w-auto text-center"
            >
              {userRole === 'admin' ? 'Admin Panel' : 'My Workspace'}
            </Link>
            <button
              onClick={handleSignOut}
              className="text-gray-600 hover:text-gray-900 w-full md:w-auto"
              title="Sign Out"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        ) : (
          <Link to="/login" className="bg-primary text-white px-6 py-2 rounded-lg w-full md:w-auto text-center">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}