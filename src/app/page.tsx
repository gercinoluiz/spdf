'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import dynamic from 'next/dynamic'
import { useUserStore } from '@/store/useUserStore'

const PDFManager = dynamic(() => import('../components/PDFManager'), {
  ssr: false,
})

export default function Page() {
  const router = useRouter()
  const { user, isLoading, error, fetchUser } = useUserStore()

  useEffect(() => {
    // Buscar informações do usuário ao carregar a página
    const loadUser = async () => {
      try {
        await fetchUser()
      } catch (error) {
        // Se houver erro na busca do usuário, redirecionar para login
        router.push('/login')
      }
    }

    loadUser()
  }, [fetchUser, router])

  // Mostrar estado de carregamento
  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Carregando...</div>
  }

  // Se houver erro ou não houver usuário, redirecionar para login
  if (error || !user) {
    router.push('/login')
    return null
  }

  return (
    <div>
      <Header />
      {/* Renderizar o componente PDFManager */}
      <PDFManager />
    </div>
  )
}
