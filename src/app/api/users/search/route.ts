import { NextResponse } from 'next/server'

// Esta função simula uma busca no Active Directory
// Em um ambiente real, você conectaria com o serviço LDAP ou API do AD
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get('term')
    
    if (!searchTerm) {
      return NextResponse.json({ error: 'Termo de busca não fornecido' }, { status: 400 })
    }

    // Dados simulados do Active Directory
    // Em produção, substitua por uma chamada real ao AD
    const adUsers = [
      {
        id: '1',
        name: 'João Silva Santos',
        email: 'joao.silva@empresa.com',
        department: 'TI',
        title: 'Desenvolvedor',
      },
      {
        id: '2',
        name: 'Maria Oliveira Costa',
        email: 'maria.oliveira@empresa.com',
        department: 'RH',
        title: 'Analista',
      },
      {
        id: '3',
        name: 'Pedro Souza Lima',
        email: 'pedro.souza@empresa.com',
        department: 'Financeiro',
        title: 'Contador',
      },
      {
        id: '4',
        name: 'Ana Paula Ferreira',
        email: 'ana.ferreira@empresa.com',
        department: 'Marketing',
        title: 'Coordenadora',
      },
      {
        id: '5',
        name: 'Carlos Eduardo Rocha',
        email: 'carlos.rocha@empresa.com',
        department: 'TI',
        title: 'Gerente',
      },
      {
        id: '6',
        name: 'Fernanda Almeida',
        email: 'fernanda.almeida@empresa.com',
        department: 'Vendas',
        title: 'Gerente Regional',
      },
      {
        id: '7',
        name: 'Roberto Gomes',
        email: 'roberto.gomes@empresa.com',
        department: 'Suporte',
        title: 'Técnico',
      },
    ]

    // Filtra os usuários com base no termo de busca
    const filteredUsers = adUsers.filter(
      (user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.department.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Simula um pequeno atraso para parecer uma chamada de API real
    await new Promise((resolve) => setTimeout(resolve, 500))

    return NextResponse.json(filteredUsers)
  } catch (error) {
    console.error('Erro ao buscar usuários do AD:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar usuários do Active Directory' },
      { status: 500 }
    )
  }
}