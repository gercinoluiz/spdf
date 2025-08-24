'use client'

import type React from 'react'

import { useState } from 'react'
import { Plus, Users, Key, Copy, Check, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface AddUsersModalProps {
  clientId: string
  onUsersAdded: () => void
}

export function AddUsersModal({ clientId, onUsersAdded }: AddUsersModalProps) {
  const [open, setOpen] = useState(false)
  const [userName, setUserName] = useState('')
  const [userLogin, setUserLogin] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [passwordCopied, setPasswordCopied] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  // Validação de email
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Validação de campos
  const validateFields = () => {
    const newErrors: {[key: string]: string} = {}

    if (!userName.trim()) {
      newErrors.userName = 'Nome é obrigatório'
    }

    if (!userLogin.trim()) {
      newErrors.userLogin = 'Login é obrigatório'
    } else if (userLogin.trim().length < 3) {
      newErrors.userLogin = 'Login deve ter pelo menos 3 caracteres'
    }

    if (!userEmail.trim()) {
      newErrors.userEmail = 'Email é obrigatório'
    } else if (!validateEmail(userEmail.trim())) {
      newErrors.userEmail = 'Email deve ter um formato válido'
    }

    if (!generatedPassword) {
      newErrors.password = 'É necessário gerar uma senha'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const generatePassword = () => {
    const length = 12
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let password = ''
    
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    
    setGeneratedPassword(password)
    setPasswordCopied(false)
    // Limpar erro de senha se existir
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: '' }))
    }
  }

  const copyPassword = async () => {
    if (!generatedPassword) return
    
    try {
      await navigator.clipboard.writeText(generatedPassword)
      setPasswordCopied(true)
      toast.success('Senha copiada para a área de transferência!')
      setTimeout(() => setPasswordCopied(false), 2000)
    } catch (error) {
      console.error('Erro ao copiar senha:', error)
      toast.error('Erro ao copiar senha para a área de transferência')
    }
  }

  const createUser = async () => {
    // Limpar erros anteriores
    setErrors({})
    
    // Validar campos
    if (!validateFields()) {
      toast.error('Por favor, corrija os erros nos campos')
      return
    }

    setIsCreating(true)

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userName.trim(),
          login: userLogin.trim(),
          email: userEmail.trim(),
          password: generatedPassword,
          clientId: Number.parseInt(clientId),
          newlyGeneratedPassword: true
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        // Tratamento específico de erros do backend
        switch (response.status) {
          case 409:
            toast.error('Usuário com este email ou login já existe')
            break
          case 400:
            toast.error(result.error || 'Dados inválidos fornecidos')
            break
          case 500:
            toast.error('Erro interno do servidor. Tente novamente.')
            break
          default:
            toast.error(result.error || 'Erro ao criar usuário')
        }
        return
      }

      // Sucesso
      toast.success('Usuário criado com sucesso!', {
        description: `${userName} foi adicionado ao sistema`,
        duration: 4000,
      })

      // Reset form
      resetForm()
      setOpen(false)

      // Refresh parent component
      onUsersAdded()
    } catch (error) {
      console.error('Erro ao criar usuário:', error)
      toast.error('Erro de conexão. Verifique sua internet e tente novamente.')
    } finally {
      setIsCreating(false)
    }
  }

  const resetForm = () => {
    setUserName('')
    setUserLogin('')
    setUserEmail('')
    setGeneratedPassword('')
    setPasswordCopied(false)
    setErrors({})
  }

  // Limpar erros quando o usuário digita
  const handleInputChange = (field: string, value: string) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
    
    switch (field) {
      case 'userName':
        setUserName(value)
        break
      case 'userLogin':
        setUserLogin(value)
        break
      case 'userEmail':
        setUserEmail(value)
        break
    }
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen)
      if (!newOpen) {
        resetForm()
      }
    }}>
      <DialogTrigger asChild>
        <Button size='sm'>
          <Plus className='h-4 w-4 mr-2' />
          Novo Usuário
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center space-x-2'>
            <Users className='h-5 w-5' />
            <span>Adicionar Novo Usuário</span>
          </DialogTitle>
          <DialogDescription>
            Crie um novo usuário preenchendo os dados abaixo e gerando uma senha.
          </DialogDescription>
        </DialogHeader>

        <div className='grid gap-4 py-4'>
          {/* User Name Field */}
          <div className='grid gap-2'>
            <Label htmlFor='userName'>Nome do Usuário</Label>
            <Input
              id='userName'
              placeholder='Digite o nome completo do usuário'
              value={userName}
              onChange={(e) => handleInputChange('userName', e.target.value)}
              className={errors.userName ? 'border-red-500 focus:border-red-500' : ''}
            />
            {errors.userName && (
              <p className='text-sm text-red-500 flex items-center gap-1'>
                <AlertCircle className='h-4 w-4' />
                {errors.userName}
              </p>
            )}
          </div>

          {/* Username/Login Field */}
          <div className='grid gap-2'>
            <Label htmlFor='userLogin'>Nome de Usuário (Login)</Label>
            <Input
              id='userLogin'
              placeholder='Digite o nome de usuário para login'
              value={userLogin}
              onChange={(e) => handleInputChange('userLogin', e.target.value)}
              className={errors.userLogin ? 'border-red-500 focus:border-red-500' : ''}
            />
            {errors.userLogin && (
              <p className='text-sm text-red-500 flex items-center gap-1'>
                <AlertCircle className='h-4 w-4' />
                {errors.userLogin}
              </p>
            )}
          </div>

          {/* User Email Field */}
          <div className='grid gap-2'>
            <Label htmlFor='userEmail'>Email do Usuário</Label>
            <Input
              id='userEmail'
              type='email'
              placeholder='Digite o email do usuário'
              value={userEmail}
              onChange={(e) => handleInputChange('userEmail', e.target.value)}
              className={errors.userEmail ? 'border-red-500 focus:border-red-500' : ''}
            />
            {errors.userEmail && (
              <p className='text-sm text-red-500 flex items-center gap-1'>
                <AlertCircle className='h-4 w-4' />
                {errors.userEmail}
              </p>
            )}
          </div>

          {/* Password Generation Section */}
          <div className='grid gap-2'>
            <Label>Senha</Label>
            <div className='flex space-x-2'>
              <Button
                type='button'
                variant='outline'
                onClick={generatePassword}
                className='flex-shrink-0'
              >
                <Key className='h-4 w-4 mr-2' />
                Gerar Senha
              </Button>
              {generatedPassword && (
                <Button
                  type='button'
                  variant='outline'
                  onClick={copyPassword}
                  className='flex-shrink-0'
                >
                  {passwordCopied ? (
                    <>
                      <Check className='h-4 w-4 mr-2' />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className='h-4 w-4 mr-2' />
                      Copiar
                    </>
                  )}
                </Button>
              )}
            </div>
            {generatedPassword && (
              <div className='mt-2 p-3 bg-gray-50 border rounded-md'>
                <div className='text-sm font-mono break-all'>
                  {generatedPassword}
                </div>
              </div>
            )}
            {errors.password && (
              <p className='text-sm text-red-500 flex items-center gap-1'>
                <AlertCircle className='h-4 w-4' />
                {errors.password}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={createUser}
            disabled={isCreating}
          >
            {isCreating ? (
              <>
                <div className='animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent mr-2' />
                Criando...
              </>
            ) : (
              <>
                <Plus className='h-4 w-4 mr-2' />
                Criar Usuário
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
