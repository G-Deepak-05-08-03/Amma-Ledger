import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (client) return client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Only create during actual browser runtime, not build-time prerender
  if (!url || !key) {
    // Return a no-op proxy during build — actual auth won't work but build won't fail
    return {
      auth: {
        signInWithPassword: async () => ({ error: null }),
        signUp: async () => ({ data: { user: null }, error: null }),
        signOut: async () => ({}),
        getUser: async () => ({ data: { user: null } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      from: () => ({
        select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }),
        upsert: async () => ({ error: null }),
        update: () => ({ eq: async () => ({ error: null }) }),
        insert: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }), then: async () => ({ error: null }) }),
        delete: () => ({ eq: async () => ({ error: null }) }),
      }),
    } as unknown as ReturnType<typeof createBrowserClient>
  }

  client = createBrowserClient(url, key)
  return client
}
