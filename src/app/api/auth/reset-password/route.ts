import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar força da senha
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 8 caracteres' },
        { status: 400 }
      )
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return NextResponse.json(
        { error: 'A senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número' },
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

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(password, 12)

    // Atualizar a senha do usuário e marcar o token como usado
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { 
          password: hashedPassword,
          firstLogin: false // Reset first login flag
        }
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true }
      })
    ])

    return NextResponse.json({ 
      message: 'Senha redefinida com sucesso' 
    })

  } catch (error) {
    console.error('Erro ao redefinir senha:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}