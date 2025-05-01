import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
    storageKey: 'supabase.auth.token',
    storage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'devgiri-hr-suite-server'
    }
  }
})

// Helper function to check if a user has admin role
export async function isUserAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('roles')
    .select('role')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error checking user role:', error)
    return false
  }

  return data?.role === 'admin'
} 