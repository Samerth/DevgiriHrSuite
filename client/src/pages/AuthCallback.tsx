import { useEffect } from 'react'
import { useLocation } from 'wouter'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export default function AuthCallback() {
  const [, setLocation] = useLocation()
  const { toast } = useToast()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Handling auth callback...');
        
        // Get the session from the URL hash
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth error:', error)
          toast({
            variant: 'destructive',
            title: 'Authentication Error',
            description: error.message
          })
          setLocation('/login')
          return
        }

        if (!session) {
          console.error('No session found')
          toast({
            variant: 'destructive',
            title: 'Authentication Error',
            description: 'No session found'
          })
          setLocation('/login')
          return
        }

        console.log('Session found:', session);
        
        try {
          // Trigger the sync process using our own API endpoint
          const response = await fetch('/api/auth/sync-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            }
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to sync user data');
          }

          const userData = await response.json();
          console.log('User synced successfully:', userData);
          
          toast({
            title: 'Success',
            description: 'Successfully authenticated!'
          })
          
          // Redirect to dashboard after successful sync
          setLocation('/dashboard')
        } catch (syncError) {
          console.error('Sync error:', syncError)
          toast({
            variant: 'destructive',
            title: 'Sync Error',
            description: syncError instanceof Error ? syncError.message : 'Failed to sync user data'
          })
          // Don't redirect on sync error - the user is still authenticated
          setLocation('/dashboard')
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        toast({
          variant: 'destructive',
          title: 'Authentication Error',
          description: error instanceof Error ? error.message : 'An unknown error occurred'
        })
        setLocation('/login')
      }
    }

    handleAuthCallback()
  }, [setLocation, toast])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="p-8 text-center">
        <h2 className="text-2xl font-semibold mb-4">Completing authentication...</h2>
        <p className="text-gray-600">Please wait while we set up your account.</p>
      </div>
    </div>
  )
} 