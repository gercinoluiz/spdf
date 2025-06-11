'use client'

import { useState } from 'react'
import { Edit, User, Check, X } from 'lucide-react'
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

interface EditUserStatusModalProps {
  user: {
    id: number
    name: string
    login: string
    status: string
  }
  onUserUpdated: () => void
}

export function EditUserStatusModal({ user, onUserUpdated }: EditUserStatusModalProps) {
  const [open, setOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [newStatus, setNewStatus] = useState(user.status)

  const toggleStatus = () => {
    setNewStatus(newStatus === 'Ativo' ? 'Inativo' : 'Ativo')
  }

  const updateUserStatus = async () => {
    if (newStatus === user.status) {
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
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao atualizar status do usuário')
      }

      // Reset modal state
      setOpen(false)

      // Refresh parent component
      onUserUpdated()
    } catch (error) {
      console.error('Erro ao atualizar status do usuário:', error)
      alert('Ocorreu um erro ao tentar atualizar o status do usuário. Tente novamente.')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen)
      if (newOpen) {
        // Reset to current status when opening
        setNewStatus(user.status)
      }
    }}>
      <DialogTrigger asChild>
        <Button variant='ghost' size='sm' title='Editar usuário'>
          <Edit className='h-4 w-4' />
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center space-x-2'>
            <User className='h-5 w-5' />
            <span>Alterar Status do Usuário</span>
          </DialogTitle>
          <DialogDescription>
            Ative ou inative o acesso do usuário ao sistema.
          </DialogDescription>
        </DialogHeader>

        <div className='py-6'>
          <div className='space-y-6'>
            <div className='space-y-2'>
              <h4 className='text-sm font-medium'>Informações do Usuário</h4>
              <div className='bg-gray-50 p-3 rounded-md'>
                <div className='font-medium'>{user.name}</div>
                <div className='text-sm text-gray-500 font-mono'>{user.login}</div>
              </div>
            </div>

            <div className='space-y-2'>
              <h4 className='text-sm font-medium'>Status Atual</h4>
              <Badge variant={user.status === 'Ativo' ? 'default' : 'secondary'}>
                {user.status}
              </Badge>
            </div>

            <div className='space-y-2'>
              <h4 className='text-sm font-medium'>Novo Status</h4>
              <div className='flex space-x-2'>
                <Button 
                  variant={newStatus === 'Ativo' ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => setNewStatus('Ativo')}
                  className='flex-1'
                >
                  <Check className='h-4 w-4 mr-2' />
                  Ativo
                </Button>
                <Button 
                  variant={newStatus === 'Inativo' ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => setNewStatus('Inativo')}
                  className='flex-1'
                >
                  <X className='h-4 w-4 mr-2' />
                  Inativo
                </Button>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={updateUserStatus}
            disabled={isUpdating || newStatus === user.status}
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