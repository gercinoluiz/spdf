'use client'

import type React from 'react'

import { useState } from 'react'
import { Search, Plus, X, Users, Check } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

interface ADUser {
  id: string
  name: string
  email: string
  department: string
  title: string
}

interface AddUsersModalProps {
  clientId: string
  onUsersAdded: () => void
}

export function AddUsersModal({ clientId, onUsersAdded }: AddUsersModalProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<ADUser[]>([])
  const [selectedUsers, setSelectedUsers] = useState<ADUser[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isAdding, setIsAdding] = useState(false)

  const searchActiveDirectory = async () => {
    if (!searchTerm.trim()) return

    setIsSearching(true)

    try {
      // Chama a API de busca de usuários
      const response = await fetch(`/api/users/search?term=${encodeURIComponent(searchTerm)}`)
      
      if (!response.ok) {
        throw new Error('Erro ao buscar usuários')
      }
      
      const data = await response.json()
      setSearchResults(data)
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
      alert('Ocorreu um erro ao buscar usuários. Tente novamente.')
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const addUserToSelection = (user: ADUser) => {
    if (!selectedUsers.find((u) => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user])
    }
  }

  const removeUserFromSelection = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== userId))
  }

  const addAllUsers = async () => {
    if (selectedUsers.length === 0) {
      alert('Selecione pelo menos um usuário para adicionar.')
      return
    }

    setIsAdding(true)

    try {
      // Prepare user data for backend
      const usersToAdd = selectedUsers.map((user) => ({
        name: user.name,
        email: user.email,
        login: user.email.split('@')[0], // Generate login from email
        department: user.department,
        title: user.title,
        clientId: Number.parseInt(clientId),
      }))

      // Send to backend usando a nova API bulk
      const response = await fetch('/api/users/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          users: usersToAdd,
          clientId: Number.parseInt(clientId),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao adicionar usuários')
      }

      const result = await response.json()
      console.log(result.message)
      alert(`${selectedUsers.length} usuário(s) foram adicionados com sucesso!`)

      // Reset modal state
      setSelectedUsers([])
      setSearchResults([])
      setSearchTerm('')
      setOpen(false)

      // Refresh parent component
      onUsersAdded()
    } catch (error) {
      console.error('Erro ao adicionar usuários:', error)
      alert('Ocorreu um erro ao tentar adicionar os usuários. Tente novamente.')
    } finally {
      setIsAdding(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchActiveDirectory()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size='sm'>
          <Plus className='h-4 w-4 mr-2' />
          Novo Usuário
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[700px] max-h-[95vh]'>
        <DialogHeader>
          <DialogTitle className='flex items-center space-x-2'>
            <Users className='h-5 w-5' />
            <span>Adicionar Usuários do Active Directory</span>
          </DialogTitle>
          <DialogDescription>
            Busque usuários no Active Directory e adicione-os ao cliente.
          </DialogDescription>
        </DialogHeader>

        <div className='grid gap-4 py-4'>
          {/* Search Section */}
          <div className='space-y-4'>
            <div className='flex space-x-2'>
              <Input
                placeholder='Buscar por nome, email ou departamento...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className='flex-1'
              />
              <Button
                onClick={searchActiveDirectory}
                disabled={isSearching || !searchTerm.trim()}
              >
                {isSearching ? (
                  <div className='animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent' />
                ) : (
                  <Search className='h-4 w-4' />
                )}
              </Button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className='space-y-2'>
                <h4 className='text-sm font-medium'>
                  Resultados da Busca ({searchResults.length})
                </h4>
                <ScrollArea className='h-48 border rounded-md p-2'>
                  <div className='space-y-2'>
                    {searchResults.map((user) => {
                      const isSelected = selectedUsers.find(
                        (u) => u.id === user.id,
                      )
                      return (
                        <div
                          key={user.id}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-blue-50 border-blue-200'
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => addUserToSelection(user)}
                        >
                          <div className='flex items-center justify-between'>
                            <div className='flex-1'>
                              <div className='flex items-center space-x-2'>
                                <span className='font-medium'>{user.name}</span>
                                {isSelected && (
                                  <Check className='h-4 w-4 text-blue-600' />
                                )}
                              </div>
                              <div className='text-sm text-gray-500'>
                                {user.email}
                              </div>
                              <div className='flex space-x-2 mt-1'>
                                <Badge variant='outline' className='text-xs'>
                                  {user.department}
                                </Badge>
                                <Badge variant='outline' className='text-xs'>
                                  {user.title}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Selected Users */}
            {selectedUsers.length > 0 && (
              <>
                <Separator />
                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <h4 className='text-sm font-medium'>
                      Usuários Selecionados ({selectedUsers.length})
                    </h4>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setSelectedUsers([])}
                    >
                      Limpar Todos
                    </Button>
                  </div>
                  <ScrollArea className='h-32 border rounded-md p-2'>
                    <div className='space-y-2'>
                      {selectedUsers.map((user) => (
                        <div
                          key={user.id}
                          className='flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded'
                        >
                          <div className='flex-1'>
                            <div className='font-medium text-sm'>
                              {user.name}
                            </div>
                            <div className='text-xs text-gray-500'>
                              {user.email}
                            </div>
                          </div>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => removeUserFromSelection(user.id)}
                          >
                            <X className='h-4 w-4' />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={addAllUsers}
            disabled={selectedUsers.length === 0 || isAdding}
          >
            {isAdding ? (
              <>
                <div className='animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent mr-2' />
                Adicionando...
              </>
            ) : (
              <>
                <Plus className='h-4 w-4 mr-2' />
                Adicionar Todos ({selectedUsers.length})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
