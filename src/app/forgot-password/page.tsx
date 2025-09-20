'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle, ArrowLeft, Mail } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import logo from '../../../assets/logo.png'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setMessage('')

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Por favor, digite um email válido')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Se o email existir em nosso sistema, você receberá instruções para redefinir sua senha.')
      } else {
        setError(data.error || 'Erro ao processar solicitação')
      }
    } catch (error) {
      setError('Erro ao conectar com o servidor')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='min-h-screen flex max-h-80'>
      {/* Left side - Image */}
      <div className='hidden lg:flex lg:w-3/7 relative justify-center items-center flex-col'>
        <Image src={logo} alt='logo' className='' />
      </div>

      {/* Right side - Form */}
      <div className='flex-1 flex items-center justify-center p-8 bg-background'>
        <div className='w-full max-w-md'>
          <div className='space-y-6'>
            {/* Header */}
            <div className='text-center space-y-2'>
              <h1 className='text-3xl font-bold tracking-tight'>Esqueci minha senha</h1>
              <p className='text-muted-foreground'>
                Digite seu email para receber instruções de redefinição
              </p>
            </div>

            {/* Success Message */}
            {message && (
              <div className='flex items-center space-x-2 p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md'>
                <Mail className='h-4 w-4' />
                <span>{message}</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className='flex items-center space-x-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md'>
                <AlertCircle className='h-4 w-4' />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <Card className='border-0 shadow-none'>
              <form onSubmit={handleSubmit}>
                <CardContent className='space-y-4 p-0'>
                  <div className='space-y-2'>
                    <Label htmlFor='email'>Email</Label>
                    <Input
                      id='email'
                      type='email'
                      placeholder='Digite seu email'
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </CardContent>
                
                <div className='flex flex-col space-y-4 pt-4'>
                  <Button
                    type='submit'
                    className='w-full bg-blue-500 hover:bg-blue-800'
                    size='lg'
                    disabled={isLoading}
                  >
                    {isLoading ? 'Enviando...' : 'Enviar instruções'}
                  </Button>
                  
                  <Link href='/login'>
                    <Button
                      type='button'
                      variant='outline'
                      className='w-full'
                    >
                      <ArrowLeft className='h-4 w-4 mr-2' />
                      Voltar ao login
                    </Button>
                  </Link>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}