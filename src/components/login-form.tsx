'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Eye, EyeOff, User, Lock, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useUserStore } from '@/store/useUserStore'
import { signIn } from 'next-auth/react'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setUser } = useUserStore()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isOidcLoading, setIsOidcLoading] = useState(false)
  
  // Adicionar estados para os campos do formulário
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  // Verificar se há erro na URL
  const error = searchParams.get('error')

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
      setTimeout(() => {
        window.location.href = '/'
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

  const handleOIDCLogin = async () => {
    setIsOidcLoading(true)
    try {
      await signIn('customOidc', { 
        callbackUrl: '/',
        redirect: true 
      })
    } catch (error) {
      console.error('Erro no login OIDC:', error)
      toast.error('Erro no login OIDC')
      setIsOidcLoading(false)
    }
  }

  const getErrorMessage = (error: string) => {
    switch (error) {
      case 'user_not_found':
        return 'Usuário não encontrado no sistema'
      case 'verification_failed':
        return 'Falha na verificação do usuário'
      default:
        return 'Erro na autenticação'
    }
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

      {/* Error Message */}
      {error && (
        <div className='flex items-center space-x-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md'>
          <AlertCircle className='h-4 w-4' />
          <span>{getErrorMessage(error)}</span>
        </div>
      )}

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
            
            <div className='relative w-full'>
              <div className='absolute inset-0 flex items-center'>
                <span className='w-full border-t' />
              </div>
              <div className='relative flex justify-center text-xs uppercase'>
                <span className='bg-background px-2 text-muted-foreground'>
                  Ou
                </span>
              </div>
            </div>
            
            <Button
              type='button'
              variant='outline'
              className='w-full'
              onClick={handleOIDCLogin}
              disabled={isOidcLoading}
            >
              {isOidcLoading ? 'Conectando...' : 'Entrar com OIDC'}
            </Button>
            
            <p className='text-center text-sm text-muted-foreground'>
              {'Não tem uma conta? '}
              <Link href='/signup' className='text-primary hover:underline'>
                Fale com seu gestor e solicite uma!
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
