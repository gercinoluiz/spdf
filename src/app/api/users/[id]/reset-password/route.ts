import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Helper function to get current user from JWT
async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token-spdf')?.value

    if (!token) {
      return null
    }

    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'your-secret-key'
    )
    
    const { payload } = await jwtVerify(token, secret)
    
    return {
      id: payload.id as number,
      role: payload.role as string,
      clientId: payload.clientId as number,
    }
  } catch (error) {
    return null
  }
}

// Função para gerar senha aleatória
function generateRandomPassword(): string {
  const length = 12
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  
  return password
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Aguardar a resolução de params
    const resolvedParams = await params
    const userId = parseInt(resolvedParams.id)
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'ID de usuário inválido' },
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

    // Verificar permissões
    if (currentUser.role === 'user') {
      return NextResponse.json(
        { error: 'Você não tem permissão para resetar senhas' },
        { status: 403 }
      )
    }

    if (currentUser.role === 'manager') {
      // Managers só podem resetar senhas de usuários do mesmo cliente
      if (existingUser.clientId !== currentUser.clientId) {
        return NextResponse.json(
          { error: 'Você só pode resetar senhas de usuários do seu cliente' },
          { status: 403 }
        )
      }
    }

    // Gerar nova senha
    const newPassword = generateRandomPassword()
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds)

    // Atualizar a senha do usuário e marcar como primeiro login
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        firstLogin: true,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      message: 'Senha resetada com sucesso',
      newPassword: newPassword
    })
  } catch (error) {
    console.error('Erro ao resetar senha:', error)
    return NextResponse.json(
      { error: 'Erro ao resetar senha' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}