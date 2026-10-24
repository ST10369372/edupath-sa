
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore guest access after refreshing the browser.
  const [isGuest, setIsGuest] = useState(
    () => localStorage.getItem('edupath_guest') === 'true'
  )

  function enterGuestMode() {
    localStorage.setItem('edupath_guest', 'true')
    setIsGuest(true)
  }

  function exitGuestMode() {
    localStorage.removeItem('edupath_guest')
    setIsGuest(false)
  }

  useEffect(() => {
    let active = true

    async function initialiseAuth() {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) throw error
        if (!active) return

        setUser(session?.user ?? null)

        if (session?.user) {
          exitGuestMode()
          await fetchProfile(session.user.id)
        } else {
          setLoading(false)
        }
      } catch (error) {
        console.error('Authentication initialisation failed:', error)
        if (active) setLoading(false)
      }
    }

    initialiseAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)

        if (session?.user) {
          exitGuestMode()

          // Run profile loading after the auth callback finishes.
          Promise.resolve().then(() => {
            if (active) {
              fetchProfile(session.user.id)
            }
          })
        } else {
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  async function fetchProfile(userId) {
    if (!userId) {
      setProfile(null)
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error

      setProfile(data)
    } catch (error) {
      console.error('Could not load profile:', error.message)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  async function signUp({ email, password, fullName }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    return { data, error }
  }

  async function signIn({ email, password }) {
    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      })

    if (!error) {
      exitGuestMode()
    }

    return { data, error }
  }

  async function signOut() {
    exitGuestMode()

    if (user) {
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('Sign-out failed:', error.message)
      }
    }

    setUser(null)
    setProfile(null)
  }

  async function updateProfile(updates) {
    if (!user) {
      return {
        data: null,
        error: new Error(
          'You must sign in to update your profile.'
        ),
      }
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single()

    if (!error) {
      setProfile(data)
    }

    return { data, error }
  }

  const value = {
    user,
    profile,
    loading,
    isGuest,
    enterGuestMode,
    signUp,
    signIn,
    signOut,
    updateProfile,
    fetchProfile: () => fetchProfile(user?.id),
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
