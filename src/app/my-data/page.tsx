'use client'

import { useState } from 'react'
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
import MyDataCard from '../../components/my-data-card'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// Dados de exemplo baseados no wireframe
const clientInfo = {
  name: 'Gold',
  contrato: '172.000.000/0001-00',
  totalUsage: '1720/1800',
  plan: 'Ouro',
}

const usersData = [
  {
    id: 1,
    nome: 'CARLOS SILVA',
    login: 'X9482',
    uso: '192',
    status: 'Ativo',
    lastAccess: '2024-01-15',
  },
  {
    id: 2,
    nome: 'MARIA SANTOS',
    login: 'Y7531',
    uso: '156',
    status: 'Ativo',
    lastAccess: '2024-01-14',
  },
  {
    id: 3,
    nome: 'JOÃO OLIVEIRA',
    login: 'Z8642',
    uso: '89',
    status: 'Inativo',
    lastAccess: '2024-01-10',
  },
  {
    id: 4,
    nome: 'ANA COSTA',
    login: 'W9753',
    uso: '234',
    status: 'Ativo',
    lastAccess: '2024-01-15',
  },
]

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredUsers = usersData.filter((user) => {
    return (
      user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.login.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const getStatusBadge = (status: string) => {
    const variant = status === 'Ativo' ? 'default' : 'secondary'
    return <Badge variant={variant}>{status}</Badge>
  }

  const getUsageColor = (uso: string) => {
    const usage = Number.parseInt(uso)
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

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <header className='bg-white border-b border-gray-200 px-6 py-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <Link href='/'>
              <Button variant='ghost' size='sm'>
                <ArrowLeft className='h-4 w-4 mr-2' />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className='text-2xl font-bold text-gray-900'>
                Gerenciar Usuários
              </h1>
              <p className='text-sm text-gray-500'>
                Cliente: {clientInfo.name}
              </p>
            </div>
          </div>
          <div className='flex items-center space-x-2'>
            <Button variant='outline' size='sm'>
              <Download className='h-4 w-4 mr-2' />
              Exportar
            </Button>
            <Button size='sm'>
              <Plus className='h-4 w-4 mr-2' />
              Novo Usuário
            </Button>
          </div>
        </div>
      </header>

      <div className='p-6'>
        {/* Client Info Cards */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
          <Tooltip>
            <TooltipTrigger>
              <MyDataCard
                title={clientInfo.name}
                desc={getPlanBadge(clientInfo.plan)}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>Plano</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>
              <MyDataCard title={clientInfo.contrato} desc={`Contrato`} />
            </TooltipTrigger>
            <TooltipContent>
              <p>Número do contrato</p>
            </TooltipContent>
          </Tooltip>          <Tooltip>
            <TooltipTrigger>
              <MyDataCard
                title={clientInfo.totalUsage}
                desc={
                  <div className='w-full bg-gray-200 rounded-full h-2 mt-2'>
                    <div
                      className='bg-blue-600 h-2 rounded-full'
                      style={{
                        width: `${Math.min(
                          (Number.parseInt(
                            clientInfo.totalUsage.split('/')[0],
                          ) /
                            Number.parseInt(
                              clientInfo.totalUsage.split('/')[1],
                            )) *
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
              <p>Uso total de licenças</p>
            </TooltipContent>
          </Tooltip>{' '}
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
                <Badge variant='outline'>Total: {usersData.length}</Badge>
                <Badge variant='outline'>
                  Ativos: {usersData.filter((u) => u.status === 'Ativo').length}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Login</TableHead>
                  <TableHead>Uso</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Último Acesso</TableHead>
                  <TableHead className='text-right'>Editar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className='font-medium'>{user.nome}</TableCell>
                    <TableCell className='font-mono text-sm bg-gray-50 rounded px-2 py-1 inline-block'>
                      {user.login}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`font-mono text-sm ${getUsageColor(
                          user.uso,
                        )}`}
                      >
                        {user.uso}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell className='text-sm text-gray-600'>
                      {new Date(user.lastAccess).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className='text-right'>
                      <div className='flex justify-end space-x-2'>
                        <Button
                          variant='ghost'
                          size='sm'
                          title='Visualizar usuário'
                        >
                          <Eye className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          title='Editar usuário'
                        >
                          <Edit className='h-4 w-4' />
                        </Button>
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
                    {usersData.filter((u) => u.status === 'Ativo').length}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-sm text-gray-600'>Uso Total:</span>
                  <span className='font-semibold'>
                    {usersData.reduce(
                      (acc, user) => acc + Number.parseInt(user.uso),
                      0,
                    )}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-sm text-gray-600'>Uso Médio:</span>
                  <span className='font-semibold'>
                    {Math.round(
                      usersData.reduce(
                        (acc, user) => acc + Number.parseInt(user.uso),
                        0,
                      ) / usersData.length,
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

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
          </Card>
        </div>
      </div>
    </div>
  )
}
