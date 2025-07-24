'use client'

import { useSession } from 'next-auth/react'
import { useEffect } from 'react'
import { useUserStore } from '@/store/useUserStore'

export function useAuth() {
  const { data: session, status } = useSession()
  const { setUser, clearUser } = useUserStore()
  
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // Set user data from session
      setUser(session.user as any)
    } else if (status === 'unauthenticated') {
      clearUser()
    }
  }, [session, status, setUser, clearUser])
  
  return {
    user: session?.user,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated'
  }
}