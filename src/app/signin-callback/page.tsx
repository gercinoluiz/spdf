'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/store/useUserStore'

export default function SigninCallback() {
  const router = useRouter()
  const { setUser } = useUserStore()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Obter parâmetros da URL (código de autorização, etc.)
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get('code')
        const state = urlParams.get('state')

        if (!code) {
          throw new Error('Código de autorização não encontrado')
        }

        // Enviar código para sua API para trocar por token
        const response = await fetch('/api/auth/oidc-callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code, state }),
        })

        if (!response.ok) {
          throw new Error('Falha na autenticação OIDC')
        }

        const data = await response.json()
        setUser(data.user)

        // Redirecionar para a página principal
        router.push('/')
      } catch (error) {
        console.error('Erro no callback OIDC:', error)
        router.push('/login?error=oidc_callback_failed')
      }
    }

    handleCallback()
  }, [router, setUser])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg">Processando autenticação...</div>
    </div>
  )
}