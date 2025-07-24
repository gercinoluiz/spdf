import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { SignJWT } from 'jose'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const { login, profile } = await request.json()

    // Verificar se o usuário existe no banco de dados
    const user = await prisma.user.findUnique({
      where: { login },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado no sistema' },
        { status: 404 }
      )
    }

    // Gerar token JWT interno
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'your-secret-key'
    )

    const token = await new SignJWT({
      id: user.id,
      name: user.name,
      login: user.login,
      role: user.role,
      clientId: user.clientId,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(secret)

    // Retornar dados do usuário
    const response = NextResponse.json({
      id: user.id,
      login: user.login,
      name: user.name,
      status: user.status,
      role: user.role,
      clientId: user.clientId,
    })

    // Definir cookie com token JWT
    response.cookies.set({
      name: 'token-spdf',
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 dia
      sameSite: 'lax',
    })

    return response
  } catch (error) {
    console.error('Erro ao verificar usuário:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar usuário' },
      { status: 500 }
    )
  }
}