import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSupabase } from '../hooks/useSupabase';
import { supabase } from '../config/supabase';
import Logo from './Logo';

export default function Navbar() {
  const { session } = useSupabase();
  const navigate = useNavigate();

  const [userRole, setUserRole] = React.useState(null);

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

  return (
    <nav className="flex items-center justify-between p-4 border-b">
      <Logo />
      <div className="flex items-center space-x-8">
        <Link to="/" className="text-gray-700">Home</Link>
        <Link to="#" className="text-gray-700">Product</Link>
        <Link to="#" className="text-gray-700">Pricing</Link>
        <Link to="#" className="text-gray-700">About</Link>
        {session ? (
          <Link 
            to={userRole === 'admin' ? '/adminspace' : '/workspace'} 
            className="bg-primary text-white px-6 py-2 rounded-lg"
          >
            {userRole === 'admin' ? 'Admin Panel' : 'My Workspace'}
          </Link>
        ) : (
          <Link to="/login" className="bg-primary text-white px-6 py-2 rounded-lg">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}