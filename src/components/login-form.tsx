'use client'

import type React from 'react'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Eye, EyeOff, User, Lock } from 'lucide-react'

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsLoading(false)
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
                <Checkbox id='remember' />
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
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
            <p className='text-center text-sm text-muted-foreground'>
              {"Don't have an account? "}
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
