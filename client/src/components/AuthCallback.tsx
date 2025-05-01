import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const handleAuthCallback = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Error getting session:', sessionError);
        toast.error('Failed to get session: ' + sessionError.message);
        return;
      }

      if (!session) {
        console.error('No session found');
        toast.error('No active session found');
        return;
      }

      console.log('Session obtained:', session);

      try {
        const response = await fetch('/api/auth/sync-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify(session.user)
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Sync error response:', errorData);
          
          // Handle specific error cases
          if (response.status === 409) {
            toast.error('User already exists in the system');
          } else if (response.status === 400) {
            toast.error('Invalid user data: ' + (errorData.details || errorData.message));
          } else {
            toast.error('Failed to sync user: ' + (errorData.message || 'Unknown error'));
          }
          
          // Log detailed error information
          console.error('Sync error details:', {
            status: response.status,
            statusText: response.statusText,
            errorData
          });
          
          return;
        }

        const userData = await response.json();
        console.log('User synced successfully:', userData);
        
        // Update local state with synced user data
        setUser(userData);
        toast.success('Successfully logged in');
        
        // Navigate to dashboard
        navigate('/dashboard');
      } catch (syncError) {
        console.error('Error during sync:', syncError);
        toast.error('Failed to sync user data: ' + (syncError instanceof Error ? syncError.message : 'Unknown error'));
      }
    } catch (error) {
      console.error('Error in auth callback:', error);
      toast.error('Authentication failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  useEffect(() => {
    handleAuthCallback();
  }, [navigate]);

  return (
    <div>
      {/* Render your component content here */}
    </div>
  );
};

export default AuthCallback; 