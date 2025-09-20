import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { SignJWT } from 'jose'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const { login, password } = await request.json()

    // Validação básica
    if (!login || !password) {
      return NextResponse.json(
        { error: 'Login e senha são obrigatórios' },
        { status: 400 },
      )
    }

    // Verificar se o usuário existe no banco de dados (case insensitive para login)
    const user = await prisma.user.findFirst({
      where: { 
        login: {
          equals: login,
          mode: 'insensitive'
        }
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado no sistema' },
        { status: 404 },
      )
    }

    // Verificar senha usando bcrypt
    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 },
      )
    }

    // Gerar token JWT
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'your-secret-key',
    )

    const token = await new SignJWT({
      id: user.id,
      name: user.name,
      login: user.login,
      role: user.role,
      clientId: user.clientId,
      firstLogin: user.firstLogin, // Include firstLogin in JWT
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(secret)

    // Retornar resposta com token em cookie
    const response = NextResponse.json({
      user: {
        id: user.id,
        login: user.login,
        name: user.name,
        status: user.status,
        role: user.role,
        clientId: user.clientId,
        firstLogin: user.firstLogin, // Include firstLogin in response
      },
      requiresPasswordChange: user.firstLogin, // Flag to indicate password change is required
    })

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
    console.error('Erro ao fazer login:', error)
    return NextResponse.json({ error: 'Erro ao fazer login' }, { status: 500 })
  }
}
