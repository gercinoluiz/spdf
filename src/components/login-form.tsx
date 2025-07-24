'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Eye, EyeOff, User, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { useUserStore } from '@/store/useUserStore'

export function LoginForm() {
  const router = useRouter()
  const { setUser } = useUserStore()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Adicionar estados para os campos do formulário
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      // Fazer requisição para a API de login
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ login, password }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao fazer login')
      }
      
      // Atualizar o store com os dados do usuário
      setUser(data.user)
      
      // Login bem-sucedido, mostrar toast de sucesso
      toast.success('Login realizado com sucesso!', {
        description: 'Redirecionando para a página inicial...',
      })
      
      // Redirecionar para a página inicial
      // Usar setTimeout para garantir que o toast seja exibido antes do redirecionamento
      setTimeout(() => {
        // Usar window.location para um redirecionamento completo que recarrega a página
        window.location.href = '/clients'
      }, 1000)
    } catch (err) {
      console.error('Erro ao fazer login:', err)
      
      // Mostrar toast de erro
      toast.error('Falha no login', {
        description: err instanceof Error ? err.message : 'Erro ao fazer login',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOIDCLogin = () => {
    const oidcUrl = new URL(`${process.env.NEXT_PUBLIC_OIDC_BASE_URL}/auth`)
    oidcUrl.searchParams.set('client_id', process.env.NEXT_PUBLIC_OIDC_CLIENT_ID!)
    oidcUrl.searchParams.set('redirect_uri', `${process.env.NEXT_PUBLIC_SPA_BASE_URL}signin-callback`)
    oidcUrl.searchParams.set('response_type', 'code')
    oidcUrl.searchParams.set('scope', 'openid offline_access cac:dscplcintr cac api-gch')
    oidcUrl.searchParams.set('codigosistema', process.env.NEXT_PUBLIC_OIDC_CLIENT_ID!)
    oidcUrl.searchParams.set('codigogrupo', process.env.NEXT_PUBLIC_CAC_DEFAULT_GRUPO_ID!)
    oidcUrl.searchParams.set('nomegrupoad', process.env.NEXT_PUBLIC_OIDC_NOME_GRUPO_AD!)
    
    window.location.href = oidcUrl.toString()
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='text-center space-y-2'>
        <h1 className='text-3xl font-bold tracking-tight'>Entrar</h1>
        <p className='text-muted-foreground'>
          Entre com seu nome de usuário e senha
        </p>
      </div>

      {/* Login Form */}
      <Card className='border-0 shadow-none'>
        <form onSubmit={handleSubmit}>
          <CardContent className='space-y-4 p-0'>
            <div className='space-y-2'>
              <Label htmlFor='username'>Usuário</Label>
              <div className='relative'>
                <User className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                <Input
                  id='username'
                  type='text'
                  placeholder='Insira seu usuário'
                  className='pl-10'
                  required
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                />
              </div>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='password'>Senha</Label>
              <div className='relative'>
                <Lock className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                <Input
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  placeholder='Insira sua senha'
                  className='pl-10 pr-10'
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className='h-4 w-4 text-muted-foreground' />
                  ) : (
                    <Eye className='h-4 w-4 text-muted-foreground' />
                  )}
                </Button>
              </div>
            </div>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <Checkbox 
                  id='remember' 
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                />
                <Label
                  htmlFor='remember'
                  className='text-sm font-normal cursor-pointer'
                >
                Continuar conectado
                </Label>
              </div>
              <Link
                href='/forgot-password'
                className='text-sm text-primary hover:underline'
              >
                Esqueceu a senha?
              </Link>
            </div>
          </CardContent>
          <CardFooter className='flex flex-col space-y-4 p-0 pt-4'>
            <Button
              type='submit'
              className='w-full bg-blue-500 hover:bg-blue-800'
              size='lg'
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
            <p className='text-center text-sm text-muted-foreground'>
              {"Não tem uma conta? "}
              <Link href='/signup' className='text-primary hover:underline'>
                Fale com seu gestor e solicite uma!
              </Link>
            </p>
            <Button 
              type="button" 
              variant="outline" 
              className="w-full" 
              onClick={handleOIDCLogin}
            >
              Entrar com OIDC
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
