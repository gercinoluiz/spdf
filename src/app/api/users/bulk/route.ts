import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { users, clientId } = body

    if (!users || !Array.isArray(users) || users.length === 0) {
      return NextResponse.json(
        { error: 'Lista de usuários inválida' },
        { status: 400 }
      )
    }

    if (!clientId) {
      return NextResponse.json(
        { error: 'ID do cliente não fornecido' },
        { status: 400 }
      )
    }

    // Verifica se o cliente existe
    const client = await prisma.client.findUnique({
      where: { id: Number(clientId) },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      )
    }

    // Cria todos os usuários em uma única transação
    const createdUsers = await prisma.$transaction(
      users.map((user) =>
        prisma.user.create({
          data: {
            name: user.name,
            login: user.login,
            email: user.email,
            status: 'Ativo',
            clientId: Number(clientId),
          },
        })
      )
    )

    return NextResponse.json(
      { message: `${createdUsers.length} usuários adicionados com sucesso`, users: createdUsers },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erro ao adicionar usuários em massa:', error)
    return NextResponse.json(
      { error: 'Erro ao adicionar usuários' },
      { status: 500 }
    )
  }
}