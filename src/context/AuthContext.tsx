import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Ministry, MinistryMember, Profile } from '../types/database'

type AuthContextValue = {
  loading: boolean
  session: Session | null
  user: User | null
  profile: Profile | null
  memberships: (MinistryMember & { ministry?: Ministry })[]
  isAdmin: boolean
  /** Líder de ministério de fato (admin NÃO conta). */
  isLeader: boolean
  isSalaMember: boolean
  isSalaLeader: boolean
  isHostMember: boolean
  isHostLeader: boolean
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [memberships, setMemberships] = useState<
    (MinistryMember & { ministry?: Ministry })[]
  >([])

  const loadProfile = useCallback(async (userId: string) => {
    const [{ data: profileData }, { data: memberData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
      supabase
        .from('ministry_members')
        .select('*, ministry:ministries(*)')
        .eq('user_id', userId),
    ])

    setProfile((profileData as Profile | null) ?? null)
    setMemberships(
      ((memberData as (MinistryMember & { ministry?: Ministry })[]) ?? []).map(
        (m) => ({
          ...m,
          ministry: Array.isArray(m.ministry) ? m.ministry[0] : m.ministry,
        }),
      ),
    )
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!session?.user?.id) return
    await loadProfile(session.user.id)
  }, [loadProfile, session?.user?.id])

  useEffect(() => {
    let mounted = true

    async function init() {
      const url = new URL(window.location.href)
      if (url.searchParams.has('code')) {
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href)
        if (!error) {
          url.search = ''
          window.history.replaceState({}, '', url.pathname)
        }
      }

      const { data } = await supabase.auth.getSession()
      if (!mounted) return
      setSession(data.session)
      if (data.session?.user?.id) {
        await loadProfile(data.session.user.id)
      }
      if (mounted) setLoading(false)
    }

    void init()

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next)
      if (
        event === 'INITIAL_SESSION' ||
        event === 'SIGNED_IN' ||
        event === 'SIGNED_OUT' ||
        event === 'TOKEN_REFRESHED'
      ) {
        setLoading(false)
      }
      if (next?.user?.id) {
        void loadProfile(next.user.id)
      } else {
        setProfile(null)
        setMemberships([])
      }
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [loadProfile])

  const value = useMemo<AuthContextValue>(() => {
    const isAdmin = Boolean(profile?.is_admin)
    // Admin fica acima dos líderes — não herda perfil de líder de ministério
    const isLeader = memberships.some((m) => m.role === 'leader')
    const sala = memberships.find((m) => m.ministry?.slug === 'sala')
    const host = memberships.find((m) => m.ministry?.slug === 'host')

    return {
      loading,
      session,
      user: session?.user ?? null,
      profile,
      memberships,
      isAdmin,
      isLeader,
      isSalaMember: Boolean(sala),
      isSalaLeader: sala?.role === 'leader',
      isHostMember: Boolean(host),
      isHostLeader: host?.role === 'leader',
      refreshProfile,
      signOut: async () => {
        await supabase.auth.signOut()
      },
    }
  }, [loading, session, profile, memberships, refreshProfile])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
