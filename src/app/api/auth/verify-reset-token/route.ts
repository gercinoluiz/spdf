import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Token é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar o token no banco
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true }
    })

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 400 }
      )
    }

    // Verificar se o token não expirou
    if (resetToken.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Token expirado' },
        { status: 400 }
      )
    }

    // Verificar se o token não foi usado
    if (resetToken.used) {
      return NextResponse.json(
        { error: 'Token já foi utilizado' },
        { status: 400 }
      )
    }

    return NextResponse.json({ valid: true })

  } catch (error) {
    console.error('Erro ao verificar token:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}