'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/store/useUserStore'
import { User, Mail, Lock, Save, Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/header'
import { Label } from '@/components/ui/label'

interface UserProfile {
  id: number
  name: string
  email: string
}

export default function ProfilePage() {
  const router = useRouter()
  const { user } = useUserStore()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Load user data on mount
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || ''
      }))
    }
  }, [user])

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  // Password validation function from change-password page
  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return 'A senha deve ter pelo menos 8 caracteres'
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'A senha deve conter pelo menos uma letra minúscula'
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'A senha deve conter pelo menos uma letra maiúscula'
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'A senha deve conter pelo menos um número'
    }
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      return 'A senha deve conter pelo menos um caractere especial (@$!%*?&)'
    }
    return null
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear messages when user starts typing
    if (error) setError(null)
    if (success) setSuccess(null)
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      // Validate required fields
      if (!formData.name.trim() || !formData.email.trim()) {
        setError('Nome e email são obrigatórios')
        return
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        setError('Por favor, insira um email válido')
        return
      }

      // If changing password, validate password fields with robust validation
      if (formData.newPassword || formData.confirmPassword || formData.currentPassword) {
        if (!formData.currentPassword) {
          setError('Senha atual é obrigatória para alterar a senha')
          return
        }
        if (!formData.newPassword) {
          setError('Nova senha é obrigatória')
          return
        }
        if (formData.newPassword !== formData.confirmPassword) {
          setError('Nova senha e confirmação não coincidem')
          return
        }
        
        // Use robust password validation
        const passwordError = validatePassword(formData.newPassword)
        if (passwordError) {
          setError(passwordError)
          return
        }
        
        if (formData.currentPassword === formData.newPassword) {
          setError('A nova senha deve ser diferente da senha atual')
          return
        }
      }

      const updateData: any = {
        name: formData.name.trim(),
        email: formData.email.trim()
      }

      // Only include password fields if user is changing password
      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword
        updateData.newPassword = formData.newPassword
      }

      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(errorData || 'Erro ao atualizar perfil')
      }

      setSuccess('Perfil atualizado com sucesso!')
      
      // Clear password fields after successful update
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }))

      // Update user store if name or email changed
      if (user) {
        useUserStore.getState().setUser({
          ...user,
          name: formData.name.trim(),
          email: formData.email.trim()
        })
      }

    } catch (err) {
      console.error('Erro ao atualizar perfil:', err)
      setError(err instanceof Error ? err.message : 'Erro ao atualizar perfil')
    } finally {
      setSaving(false)
    }
  }

  if (!user) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <Header />

      <div className='p-6 max-w-4xl mx-auto mb-6'>
        {/* Page Title */}
        <div className='mb-6'>
          <h1 className='text-2xl font-bold text-gray-900 flex items-center space-x-2'>
            <User className='h-6 w-6' />
            <span>Meu Perfil</span>
          </h1>
          <p className='text-gray-600 mt-1'>Gerencie suas informações pessoais e senha</p>
        </div>

        {/* Profile Information Card */}
        <Card className='mb-6'>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2'>
              <User className='h-5 w-5' />
              <span>Informações Pessoais</span>
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='name'>Nome Completo</Label>
                <Input
                  id='name'
                  type='text'
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder='Seu nome completo'
                  className='w-full'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='email'>Email</Label>
                <Input
                  id='email'
                  type='email'
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder='seu@email.com'
                  className='w-full'
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Password Change Card */}
        <Card className='mb-6'>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2'>
              <Lock className='h-5 w-5' />
              <span>Alterar Senha</span>
            </CardTitle>
            <p className='text-sm text-gray-600 mt-1'>
              Deixe em branco se não quiser alterar a senha
            </p>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='currentPassword'>Senha Atual</Label>
              <div className='relative'>
                <Input
                  id='currentPassword'
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={formData.currentPassword}
                  onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                  placeholder='Digite sua senha atual'
                  className='w-full pr-10'
                />
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className='h-4 w-4' />
                  ) : (
                    <Eye className='h-4 w-4' />
                  )}
                </Button>
              </div>
            </div>
            
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='newPassword'>Nova Senha</Label>
                <div className='relative'>
                  <Input
                    id='newPassword'
                    type={showNewPassword ? 'text' : 'password'}
                    value={formData.newPassword}
                    onChange={(e) => handleInputChange('newPassword', e.target.value)}
                    placeholder='Digite a nova senha'
                    className='w-full pr-10'
                  />
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className='h-4 w-4' />
                    ) : (
                      <Eye className='h-4 w-4' />
                    )}
                  </Button>
                </div>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='confirmPassword'>Confirmar Nova Senha</Label>
                <div className='relative'>
                  <Input
                    id='confirmPassword'
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder='Confirme a nova senha'
                    className='w-full pr-10'
                  />
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className='h-4 w-4' />
                    ) : (
                      <Eye className='h-4 w-4' />
                    )}
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Password Requirements */}
            <div className='text-xs text-gray-600 bg-gray-50 p-3 rounded-md'>
              <p className='font-medium mb-2'>Requisitos da senha:</p>
              <ul className='list-disc list-inside space-y-1'>
                <li>Pelo menos 8 caracteres</li>
                <li>Contém letras maiúsculas e minúsculas</li>
                <li>Contém pelo menos um número</li>
                <li>Contém pelo menos um caractere especial (@$!%*?&)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        {error && (
          <Card className='mb-6 border-red-200 bg-red-50'>
            <CardContent className='pt-6'>
              <p className='text-red-600 text-sm'>{error}</p>
            </CardContent>
          </Card>
        )}

        {success && (
          <Card className='mb-6 border-green-200 bg-green-50'>
            <CardContent className='pt-6'>
              <p className='text-green-600 text-sm'>{success}</p>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className='flex justify-end space-x-4'>
          <Button
            variant='outline'
            onClick={() => router.back()}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveProfile}
            disabled={saving}
            className='bg-black hover:bg-gray-800 text-white'
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvando...
              </>
            ) : (
              <>
                <Save className='mr-2 h-4 w-4' />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}