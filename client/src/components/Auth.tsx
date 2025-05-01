import { Auth as SupabaseAuth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '../lib/supabase'
import { useToast } from '@/hooks/use-toast'

export function Auth() {
  const { toast } = useToast();

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <SupabaseAuth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        theme="dark"
        providers={['google']}
        redirectTo={`${window.location.origin}/auth/callback`}
        view="sign_in"
        showLinks={true}
        localization={{
          variables: {
            sign_in: {
              email_label: 'Email address',
              password_label: 'Password',
              button_label: 'Sign in',
              loading_button_label: 'Signing in ...',
              social_provider_text: 'Sign in with {{provider}}',
              link_text: "Don't have an account? Sign up"
            }
          }
        }}
      />
    </div>
  );
} 