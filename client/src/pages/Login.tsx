import { useEffect } from 'react'
import { useLocation } from 'wouter'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export default function Login() {
  const [, setLocation] = useLocation()
  const { toast } = useToast()

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Session error:', error)
        return
      }
      
      if (session) {
        // Verify the session is not expired
        const now = Math.floor(Date.now() / 1000)
        const expiresAt = session.expires_at || 0
        
        if (expiresAt > now) {
          setLocation('/dashboard')
        } else {
          // Session expired, try to refresh
          supabase.auth.refreshSession().then(({ data: { session: refreshedSession }, error: refreshError }) => {
            if (refreshError) {
              console.error('Session refresh error:', refreshError)
              return
            }
            
            if (refreshedSession) {
              setLocation('/dashboard')
            }
          })
        }
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        // Verify the session is not expired
        const now = Math.floor(Date.now() / 1000)
        const expiresAt = session?.expires_at || 0
        
        if (expiresAt > now) {
          setLocation('/dashboard')
        } else {
          // Session expired, try to refresh
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
          
          if (refreshError) {
            console.error('Session refresh error:', refreshError)
            return
          }
          
          if (refreshedSession) {
            setLocation('/dashboard')
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setLocation('/login')
      } else if (event === 'TOKEN_REFRESHED') {
        setLocation('/dashboard')
      }
    })

    return () => subscription.unsubscribe()
  }, [setLocation])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center font-bold mx-auto">
            DG
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Devgiri HR Suite
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>
        <div className="mt-8">
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            theme="light"
            providers={['google']}
            redirectTo={`${window.location.origin}/auth/callback`}
          />
        </div>
      </div>
    </div>
  )
} 