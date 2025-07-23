'use client'

import { useState } from 'react'
import { Edit, User, Check, X, Shield, Users, Crown } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { Toggle } from '@/components/ui/toggle'
import { useUserStore } from '@/store/useUserStore'
import { toast } from 'sonner'

interface EditUserStatusModalProps {
  user: {
    id: number
    name: string
    login: string
    status: string
    role: string
  }
  onUserUpdated: () => void
}

export function EditUserStatusModal({ user, onUserUpdated }: EditUserStatusModalProps) {
  const { user: currentUser, setUser } = useUserStore()
  const [open, setOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [newStatus, setNewStatus] = useState(user.status)
  const [newRole, setNewRole] = useState(user.role)

  // Determinar quais roles o usuário atual pode atribuir
  const getAvailableRoles = () => {
    if (currentUser?.role === 'admin') {
      return [
        { value: 'user', label: 'Usuário', icon: User, description: 'Acesso básico ao sistema' },
        { value: 'manager', label: 'Gerente', icon: Users, description: 'Gerencia usuários do cliente' },
        { value: 'admin', label: 'Administrador', icon: Crown, description: 'Acesso total ao sistema' }
      ]
    } else if (currentUser?.role === 'manager') {
      return [
        { value: 'user', label: 'Usuário', icon: User, description: 'Acesso básico ao sistema' },
        { value: 'manager', label: 'Gerente', icon: Users, description: 'Gerencia usuários do cliente' }
      ]
    }
    return []
  }

  const availableRoles = getAvailableRoles()

  const updateUser = async () => {
    if (newStatus === user.status && newRole === user.role) {
      setOpen(false)
      return
    }

    setIsUpdating(true)

    try {
      const response = await fetch(`/api/users/${user.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          role: newRole,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao atualizar usuário')
      }

      const updatedUser = await response.json()

      // Se o usuário editou seu próprio perfil, atualizar o store
      if (currentUser && currentUser.id === user.id) {
        setUser({
          ...currentUser,
          role: newRole,
          status: newStatus
        })
      }

      // Reset modal state
      setOpen(false)

      // Refresh parent component
      onUserUpdated()

      // Mostrar mensagem de sucesso
      toast.success('Usuário atualizado com sucesso!')

    } catch (error) {
      console.error('Erro ao atualizar usuário:', error)
      toast.error('Ocorreu um erro ao tentar atualizar o usuário. Tente novamente.')
    } finally {
      setIsUpdating(false)
    }
  }

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { label: 'Admin', variant: 'destructive' as const },
      manager: { label: 'Gerente', variant: 'default' as const },
      user: { label: 'Usuário', variant: 'secondary' as const }
    }
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.user
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen)
      if (newOpen) {
        // Reset to current values when opening
        setNewStatus(user.status)
        setNewRole(user.role)
      }
    }}>
      <DialogTrigger asChild>
        <Button variant='ghost' size='sm' title='Editar usuário' className='cursor-pointer'>
          <Edit className='h-4 w-4' />
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center space-x-2'>
            <User className='h-5 w-5' />
            <span>Editar Usuário</span>
          </DialogTitle>
          <DialogDescription>
            Altere o status e o nível de acesso do usuário.
          </DialogDescription>
        </DialogHeader>

        <div className='py-6'>
          <div className='space-y-6'>
            <div className='space-y-2'>
              <h4 className='text-sm font-medium'>Informações do Usuário</h4>
              <div className='bg-gray-50 p-3 rounded-md'>
                <div className='font-medium'>{user.name}</div>
                <div className='text-sm text-gray-500 font-mono'>{user.login}</div>
                <div className='flex items-center space-x-2 mt-2'>
                  <span className='text-xs text-gray-500'>Status atual:</span>
                  <Badge variant={user.status === 'Ativo' ? 'default' : 'secondary'}>
                    {user.status}
                  </Badge>
                  <span className='text-xs text-gray-500'>Role atual:</span>
                  {getRoleBadge(user.role)}
                </div>
              </div>
            </div>

            <div className='space-y-2'>
              <h4 className='text-sm font-medium'>Status</h4>
              <div className='flex space-x-2'>
                <Toggle 
                  pressed={newStatus === 'Ativo'}
                  onPressedChange={(pressed) => setNewStatus(pressed ? 'Ativo' : 'Inativo')}
                  variant={newStatus === 'Ativo' ? 'default' : 'outline'}
                  className='flex-1'
                >
                  <Check className='h-4 w-4 mr-2' />
                  Ativo
                </Toggle>
                <Toggle 
                  pressed={newStatus === 'Inativo'}
                  onPressedChange={(pressed) => setNewStatus(pressed ? 'Inativo' : 'Ativo')}
                  variant={newStatus === 'Inativo' ? 'default' : 'outline'}
                  className='flex-1'
                >
                  <X className='h-4 w-4 mr-2' />
                  Inativo
                </Toggle>
              </div>
            </div>

            {availableRoles.length > 0 && (
              <div className='space-y-3'>
                <h4 className='text-sm font-medium'>Nível de Acesso</h4>
                <div className='grid grid-cols-1 gap-2'>
                  {availableRoles.map((role) => {
                    const IconComponent = role.icon
                    const isSelected = newRole === role.value
                    return (
                      <Toggle
                        key={role.value}
                        pressed={isSelected}
                        onPressedChange={(pressed) => {
                          if (pressed) {
                            setNewRole(role.value)
                          }
                        }}
                        variant={isSelected ? 'default' : 'outline'}
                        className='w-full justify-start h-auto p-4'
                      >
                        <div className='flex items-center space-x-3 w-full'>
                          <IconComponent className='h-4 w-4' />
                          <div className='text-left flex-1'>
                            <div className='font-medium'>{role.label}</div>
                            <p className='text-xs text-gray-500 mt-1'>{role.description}</p>
                          </div>
                        </div>
                      </Toggle>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={updateUser}
            disabled={isUpdating || (newStatus === user.status && newRole === user.role)}
          >
            {isUpdating ? (
              <>
                <div className='animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent mr-2' />
                Atualizando...
              </>
            ) : (
              'Salvar Alterações'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}