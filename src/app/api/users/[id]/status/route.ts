import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id)
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'ID de usuário inválido' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { status } = body

    if (!status || (status !== 'Ativo' && status !== 'Inativo')) {
      return NextResponse.json(
        { error: 'Status inválido. Deve ser "Ativo" ou "Inativo"' },
        { status: 400 }
      )
    }

    // Verificar se o usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Atualizar o status do usuário
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Erro ao atualizar status do usuário:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar status do usuário' },
      { status: 500 }
    )
  }
}