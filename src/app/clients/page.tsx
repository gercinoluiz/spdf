'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/store/useUserStore'
import { Search, Users, FileText, Eye, Download } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import Spin from '@/components/spin'
import Link from 'next/link'
import { Header } from '@/components/header'

// Interface para o tipo de cliente
interface Client {
  id: number
  name: string
  contractNumber: string
  status: string
  planId: string
  totalUsage: number // Adicionar este campo
  plan?: {
    name: string
    limit: number // Adicionar limit também
  }
  usage?: {
    value: number
    limit?: number
  }[]
}

export default function ClientManagement() {
  const router = useRouter()
  const { user } = useUserStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPlan, setSelectedPlan] = useState('all')
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Authorization check - redirect non-admins immediately
  useEffect(() => {
    if (user) {
      if (user.role === 'manager') {
        router.push(`/clients/${user.clientId}`)
        return
      }
      if (user.role === 'user') {
        router.push('/')
        return
      }
    }
  }, [user, router])

  // Buscar clientes da API quando o componente montar
  useEffect(() => {
    // Only fetch if user is admin
    if (user && user.role === 'admin') {
      const fetchClients = async () => {
        try {
          setLoading(true)
          const response = await fetch('/api/clients')

          if (!response.ok) {
            throw new Error(`Erro ao buscar clientes: ${response.status}`)
          }

          const data = await response.json()
          setClients(data)
          setError(null)
        } catch (err) {
          console.error('Erro ao buscar clientes:', err)
          setError(
            'Não foi possível carregar os clientes. Tente novamente mais tarde.',
          )
        } finally {
          setLoading(false)
        }
      }

      fetchClients()
    }
  }, [user])

  // Only show content to admins
  if (!user || user.role !== 'admin') {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <div>Redirecionando...</div>
      </div>
    )
  }

  // Filtrar clientes com base na busca e no plano selecionado
  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contractNumber.includes(searchTerm)

    const matchesPlan =
      selectedPlan === 'all' ||
      client.plan?.name.toLowerCase() === selectedPlan.toLowerCase()

    return matchesSearch && matchesPlan
  })

  const getStatusBadge = (status: string) => {
    const variant =
      status === 'Ativo'
        ? 'default'
        : status === 'Pendente'
        ? 'secondary'
        : 'destructive'
    return <Badge variant={variant}>{status}</Badge>
  }

  const getPlanBadge = (planName: string) => {
    const colors: Record<string, string> = {
      Ouro: 'bg-yellow-100 text-yellow-800',
      Prata: 'bg-gray-100 text-gray-800',
      Diamante: 'bg-blue-100 text-blue-800',
      Bronze: 'bg-amber-100 text-amber-800',
    }
    return (
      <Badge className={colors[planName] || 'bg-gray-100 text-gray-800'}>
        {planName}
      </Badge>
    )
  }

  // Formatar o uso como "valor/limite"
  const formatUsage = (client: Client) => {
    const limit = client.plan?.limit || 0
    const usage = client.totalUsage || 0
    return `${usage}/${limit}`
  }

  // Calcular a porcentagem de uso
  const calculateUsagePercentage = (client: Client) => {
    const limit = client.plan?.limit || 1 // Evitar divisão por zero
    const usage = client.totalUsage || 0
    return Math.min((usage / limit) * 100, 100)
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <Header/>

      <div className='flex w-full items-center space-x-2 mt-4 mr-4'>
       <div className='ml-auto mr-6 space-x-2'>
         {/* <Button variant='outline' size='sm'>
          <Download className='h-4 w-4 mr-2' />
          Exportar
        </Button> */}
        <Link href='/new-client'>
        <Button size='sm'>
          <Users className='h-4 w-4 mr-2' />
          Novo Cliente
        </Button>
        </Link>
       </div>
      </div>

      <div className='p-6'>
        {/* Search Section */}
        <Card className='mb-6'>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2'>
              <Search className='h-5 w-5' />
              <span>Buscar Clientes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex space-x-4'>
              <div className='flex-1'>
                <Input
                  placeholder='Buscar por nome ou contrato...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='w-full'
                />
              </div>
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger className='w-48'>
                  <SelectValue placeholder='Filtrar por plano' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Todos os planos</SelectItem>
                  <SelectItem value='ouro'>Ouro</SelectItem>
                  <SelectItem value='prata'>Prata</SelectItem>
                  <SelectItem value='diamante'>Diamante</SelectItem>
                  <SelectItem value='bronze'>Bronze</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Clients Table */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center justify-between'>
              <span>Clientes ({filteredClients.length})</span>
              <div className='flex space-x-2'>
                <Badge variant='outline'>Total: {clients.length}</Badge>
                <Badge variant='outline'>
                  Filtrados: {filteredClients.length}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className='flex justify-center items-center py-12'>
                <Spin />
              </div>
            ) : error ? (
              <div className='text-center py-8 text-red-500'>
                <p>{error}</p>
                <Button
                  variant='outline'
                  className='mt-4'
                  onClick={() => window.location.reload()}
                >
                  Tentar novamente
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Contrato</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Uso</TableHead>
                    <TableHead>Status</TableHead>
                    {/* <TableHead>Usuários</TableHead> */}
                    <TableHead className='text-right'>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className='font-medium'>
                        {client.name}
                      </TableCell>
                      <TableCell className='font-mono text-sm'>
                        {client.contractNumber}
                      </TableCell>
                      <TableCell>
                        {getPlanBadge(client.plan?.name || 'N/A')}
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center space-x-2'>
                          <span className='font-mono text-sm'>
                            {formatUsage(client)}
                          </span>
                          <div className='w-16 bg-gray-200 rounded-full h-2'>
                            <div
                              className='bg-blue-600 h-2 rounded-full'
                              style={{
                                width: `${calculateUsagePercentage(client)}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(client.status)}</TableCell>
                      {/* <TableCell>
                        <Button variant='ghost' size='sm'>
                          <Users className='h-4 w-4' />
                        </Button>
                      </TableCell> */}
                      <TableCell className='text-right'>
                        <div className='flex justify-end space-x-2'>
                          <Link href={`/clients/${client.id}`} className='cursor-pointer'>
                            <Button variant='ghost' size='sm' className='cursor-pointer'>
                              <FileText className='h-4 w-4' />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {!loading && !error && filteredClients.length === 0 && (
              <div className='text-center py-8 text-gray-500'>
                <Users className='h-12 w-12 mx-auto mb-4 opacity-50' />
                <p>Nenhum cliente encontrado</p>
                <p className='text-sm'>Tente ajustar os filtros de busca</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer Notes */}
        <div className='mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'></div>
      </div>
    </div>
  )
}
