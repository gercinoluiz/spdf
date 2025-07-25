'use client'

import { useState, useEffect } from 'react'
import { Search, Edit, ArrowLeft, Plus, Download, Eye } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import MyDataCard from '@/components/my-data-card'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip'
import { Header } from '@/components/header'
import { AddUsersModal } from '@/components/add-users-modal'
import { EditUserStatusModal } from '@/components/edit-user-status-modal'
import { useUserStore } from '@/store/useUserStore'

// Interface do usuário
interface User {
  id: number
  name: string
  login: string
  status: string
  role: string
  usage: number
  lastAccess: string | null
}

const Spin = () => (
  <div className='animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent'></div>
)

export default function UserManagement({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useUserStore()
  
  const [clientId, setClientId] = useState<string | null>(null)
  const [client, setClient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Resolver params de forma assíncrona
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params
      setClientId(resolvedParams.id)
    }
    resolveParams()
  }, [params])

  const fetchClient = async () => {
    if (!clientId) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/clients/${clientId}`)

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Cliente não encontrado')
        }
        throw new Error(`Erro ao buscar cliente: ${response.status}`)
      }
      const data = await response.json()
      console.log('response', data)

      setClient(data)
      setError(null)
    } catch (err) {
      console.error('Erro ao buscar cliente:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (clientId) {
      fetchClient()
    }
  }, [clientId])

  const handleUsersAdded = () => {
    fetchClient()
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

  if (loading || !clientId) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <Spin />
      </div>
    )
  }

  if (error) {
    return (
      <div className='flex flex-col justify-center items-center min-h-screen'>
        <div className='text-red-500 mb-4'>{error}</div>
        <Link href='/clients'>
          <Button>Voltar para a lista de clientes</Button>
        </Link>
      </div>
    )
  }

  if (!client) {
    return (
      <div className='flex flex-col justify-center items-center min-h-screen'>
        <div className='text-gray-500 mb-4'>Cliente não encontrado</div>
        <Link href='/clients'>
          <Button>Voltar para a lista de clientes</Button>
        </Link>
      </div>
    )
  }

  const filteredUsers = client.users
    ? client.users.filter((user: any) => {
        return (
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.login.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })
    : []

  const getStatusBadge = (status: string) => {
    const variant = status === 'Ativo' ? 'default' : 'secondary'
    return <Badge variant={variant}>{status}</Badge>
  }

  const getUsageColor = (uso: string) => {
    if (uso === undefined || uso === null) return 'text-green-600'

    const usage = Number.parseInt(uso)
    if (isNaN(usage)) return 'text-green-600'

    if (usage > 200) return 'text-red-600 font-semibold'
    if (usage > 150) return 'text-yellow-600 font-semibold'
    return 'text-green-600'
  }
  
  const getPlanBadge = (plano: string) => {
    const colors = {
      Ouro: 'bg-yellow-100 text-yellow-800',
      Prata: 'bg-gray-100 text-gray-800',
      Diamante: 'bg-blue-100 text-blue-800',
    }
    return (
      <Badge
        className={
          colors[plano as keyof typeof colors] || 'bg-gray-100 text-gray-800'
        }
      >
        {plano}
      </Badge>
    )
  }

  const formatLastAccess = (lastAccess: string | null) => {
    if (!lastAccess) return 'Nunca acessou'
    return new Date(lastAccess).toLocaleDateString('pt-BR')
  }

  return (
    <TooltipProvider>
      <div className='min-h-screen bg-gray-50 mb-8'>
        <Header />
        <header className='bg-white border-b border-gray-200 px-6 py-4 mt-2'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <Link href='/clients'>
                <Button variant='ghost' size='sm'>
                  <ArrowLeft className='h-4 w-4 mr-2' />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className='text-2xl font-bold text-gray-900'>
                  Gerenciar Usuários
                </h1>
                <p className='text-sm text-gray-500'>Cliente: {client.name}</p>
              </div>
            </div>
            <div className='flex items-center space-x-2'>
              {user?.role === 'admin' && (
                <Link href={`/edit-client/${client.id}`}>
                  <Button size='sm'>
                    <Edit className='h-4 w-4 mr-2' />
                    Editar Cliente
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </header>

        <div className='p-6'>
          {/* Client Info Cards */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
            <Tooltip>
              <TooltipTrigger>
                <MyDataCard
                  title={client.name}
                  desc={getPlanBadge(client.plan?.name || 'N/A')}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Plano</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger>
                <MyDataCard title={client.contractNumber} desc={`Contrato`} />
              </TooltipTrigger>
              <TooltipContent>
                <p>Número do contrato</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger>
                <MyDataCard
                  title={`${client.totalUsage || 0}/${client.plan?.limit || 0}`}
                  desc={
                    <div className='w-full bg-gray-200 rounded-full h-2 mt-2'>
                      <div
                        className='bg-blue-600 h-2 rounded-full'
                        style={{
                          width: `${Math.min(
                            ((client.totalUsage || 0) /
                              (client.plan?.limit || 1)) *
                              100,
                            100,
                          )}%`,
                        }}
                      ></div>
                    </div>
                  }
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Uso total do plano</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Search Section */}
          <Card className='mb-6'>
            <CardHeader>
              <CardTitle className='flex items-center space-x-2'>
                <Search className='h-5 w-5' />
                <span>Buscar Usuários</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex space-x-4'>
                <div className='flex-1'>
                  <Input
                    placeholder='Buscar por nome ou login...'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className='w-full'
                  />
                </div>
                <Button variant='outline'>
                  <Search className='h-4 w-4 mr-2' />
                  Buscar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center justify-between'>
                <span>Usuários ({filteredUsers.length})</span>
                <div className='flex space-x-2'>
                  <Badge variant='outline'>
                    Total: {client.users?.length || 0}
                  </Badge>
                  <Badge variant='outline'>
                    Ativos:{' '}
                    {client.users?.filter((u: any) => u.status === 'Ativo')
                      .length || 0}
                  </Badge>
                  <AddUsersModal
                    clientId={clientId}
                    onUsersAdded={handleUsersAdded}
                  />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Login</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Uso</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Último Acesso</TableHead>
                    <TableHead className='text-right'>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user: User) => (
                    <TableRow key={user.id}>
                      <TableCell className='font-medium'>{user.name}</TableCell>
                      <TableCell className='font-mono text-sm bg-gray-50 rounded px-2 py-1 inline-block'>
                        {user.login}
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        <span className={`font-mono text-sm ${getUsageColor(user.usage?.toString() || '0')}`}>
                          {user.usage || 0}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell className='text-sm text-gray-600'>
                        {formatLastAccess(user.lastAccess)}
                      </TableCell>
                      <TableCell className='text-right'>
                        <div className='flex justify-end space-x-2'>
                          <EditUserStatusModal
                            user={user}
                            onUserUpdated={fetchClient}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredUsers.length === 0 && (
                <div className='text-center py-8 text-gray-500'>
                  <Search className='h-12 w-12 mx-auto mb-4 opacity-50' />
                  <p>Nenhum usuário encontrado</p>
                  <p className='text-sm'>Tente ajustar os termos de busca</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Usage Summary */}
          <div className='mt-6 grid grid-cols-1 md:grid-cols-2 gap-4'>
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>Resumo de Uso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-2'>
                  <div className='flex justify-between'>
                    <span className='text-sm text-gray-600'>
                      Usuários Ativos:
                    </span>
                    <span className='font-semibold'>
                      {client.users?.filter((u: any) => u.status === 'Ativo')
                        .length || 0}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-sm text-gray-600'>Uso Total:</span>
                    <span className='font-semibold'>
                      {client.totalUsage || 0}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-sm text-gray-600'>Uso Médio:</span>
                    <span className='font-semibold'>
                      {client.users?.length && client.users.length > 0
                        ? Math.round((client.totalUsage || 0) / client.users.length)
                        : 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
{/* 
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-2'>
                  <Button variant='outline' className='w-full justify-start'>
                    <Plus className='h-4 w-4 mr-2' />
                    Adicionar Usuário em Lote
                  </Button>
                  <Button variant='outline' className='w-full justify-start'>
                    <Download className='h-4 w-4 mr-2' />
                    Relatório de Uso
                  </Button>
                  <Button variant='outline' className='w-full justify-start'>
                    <Edit className='h-4 w-4 mr-2' />
                    Configurações do Cliente
                  </Button>
                </div>
              </CardContent>
            </Card> */}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
