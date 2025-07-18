import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: number
  name: string
  login: string
  role: 'user' | 'manager' | 'admin'
  clientId?: number
  status?: string
}

interface UserState {
  user: User | null
  isLoading: boolean
  error: string | null
  setUser: (user: User | null) => void
  clearUser: () => void
  fetchUser: () => Promise<void>
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,
      
      setUser: (user) => set({ user }),
      
      clearUser: () => set({ user: null }),
      
      fetchUser: async () => {
        try {
          set({ isLoading: true, error: null })
          
          const response = await fetch('/api/auth/me')
          
          if (!response.ok) {
            throw new Error('Falha ao buscar usuário')
          }
          
          const userData = await response.json()
          set({ user: userData, isLoading: false })
          
          return userData
        } catch (error) {
          console.error('Erro ao buscar usuário:', error)
          set({ 
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            isLoading: false 
          })
        }
      },
    }),
    {
      name: 'user-storage', // nome para o armazenamento no localStorage
      partialize: (state) => ({ user: state.user }), // armazena apenas o usuário
    }
  )
)