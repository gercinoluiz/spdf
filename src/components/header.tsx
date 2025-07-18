'use client'

import Image from 'next/image'
import logo from '../../assets/logo.png'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useUserStore } from '@/store/useUserStore'
import { LogOut, Settings2Icon, User as UserIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export const Header = () => {
  const { user, clearUser } = useUserStore()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      // Fazer requisição para a API de logout
      await fetch('/api/auth/logout', {
        method: 'POST',
      })

      // Limpar o usuário do store
      clearUser()

      // Mostrar toast de sucesso
      toast.success('Logout realizado com sucesso!')

      // Redirecionar para a página de login
      router.push('/login')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      toast.error('Erro ao fazer logout')
    }
  }

  // Obter as iniciais do nome do usuário para o avatar
  const getInitials = (name: string) => {
    if (!name) return 'U'
    const names = name.split(' ')
    if (names.length === 1) return names[0].charAt(0).toUpperCase()
    return (
      names[0].charAt(0) + names[names.length - 1].charAt(0)
    ).toUpperCase()
  }

  // Função para verificar se o usuário é manager ou admin
  const isManagerOrAdmin = () =>
    user?.role === 'manager' || user?.role === 'admin'

  console.log('HEADER', user)

  return (
    <header className='bg-white border-b border-gray-200 px-6 py-4'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-4'>
          <div className='flex items-center space-x-2'>
            <div>
              <Link href={'/'}>
                <Image src={logo} alt='logo' className='w-20 h-10' />
              </Link>
            </div>
          </div>
        </div>

        {/* Área do usuário */}
        {user && (
          <div className='flex items-center space-x-4'>
            <span className='text-sm text-gray-600 hidden md:inline'>
              Olá, {user.name.split(' ')[0]}
            </span>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  className='relative h-8 w-8 rounded-full'
                >
                  <Avatar className='h-8 w-8'>
                    <AvatarFallback className='bg-blue-100 text-blue-800'>
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className='flex items-center'>
                  <UserIcon className='mr-2 h-4 w-4' />
                  <span>{user.name}</span>
                </DropdownMenuItem>
                <DropdownMenuItem className='text-gray-500 text-sm'>
                  {user.login} ({user.role})
                </DropdownMenuItem>
                <DropdownMenuSeparator />

                {/* Mostrar configurações para admin e manager */}
                {isManagerOrAdmin() && (
                  <>
                    <Link href={user?.role === 'admin' ? '/clients' : `/clients/${user?.clientId}`}>
                      <DropdownMenuItem className='text-gray-500 text-sm'>
                        <Settings2Icon className='mr-2 h-4 w-4' />
                        Configurações
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuSeparator />
                  </>
                )}

                <DropdownMenuItem
                  onClick={handleLogout}
                  className='text-red-600'
                >
                  <LogOut className='mr-2 h-4 w-4' />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  )
}
