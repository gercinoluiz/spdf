import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    const whereClause = clientId ? { clientId: Number.parseInt(clientId) } : {}

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        client: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Erro ao buscar usuários:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar usuários' },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { name, login, email, clientId, status } = body

    const user = await prisma.user.create({
      data: {
        name,
        login,
        email,
        status: status || 'Ativo',
        clientId: Number.parseInt(clientId),
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar usuário:', error)
    return NextResponse.json(
      { error: 'Erro ao criar usuário' },
      { status: 500 },
    )
  }
}
