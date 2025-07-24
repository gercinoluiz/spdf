'use client'

import { Header } from '@/components/header'
import dynamic from 'next/dynamic'
import { useUserStore } from '@/store/useUserStore'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const PDFManager = dynamic(() => import('../components/PDFManager'), {
  ssr: false,
})

export default function Page() {
  const { user, fetchUser, isLoading } = useUserStore()
  const router = useRouter()
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const initializeUser = async () => {
      try {
        await fetchUser()
      } catch (error) {
        console.error('Erro ao buscar usuário:', error)
        router.push('/login')
      } finally {
        setIsInitialized(true)
      }
    }

    if (!isInitialized) {
      initializeUser()
    }
  }, [fetchUser, router, isInitialized])

  // Show loading while initializing or fetching user data
  if (!isInitialized || isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando...</div>
      </div>
    )
  }

  return (
    <div>
      <Header />
      <PDFManager />
    </div>
  )
}
