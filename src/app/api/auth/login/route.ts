import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { SignJWT } from 'jose' // Instale com: npm install jose

const prisma = new PrismaClient()

// Função mock para simular autenticação no Active Directory
async function mockActiveDirectoryAuth(
  login: string,
  password: string,
): Promise<boolean> {
  // Credenciais de teste para desenvolvimento
  const validCredentials = [
    { login: 'p017579', password: '1234' },
    { login: 'user1', password: 'user123' },
    { login: 'user2', password: 'pass123' },
  ]

  // Simular um pequeno delay como se estivesse fazendo uma chamada externa
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Verificar se as credenciais são válidas
  return validCredentials.some(
    (cred) => cred.login === login && cred.password === password,
  )
}

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

    // 1. Verificar credenciais no Active Directory (mock)
    const isValidADCredentials = await mockActiveDirectoryAuth(login, password)

    console.log('Credenciais do AD:', isValidADCredentials)

    if (!isValidADCredentials) {
      return NextResponse.json(
        { error: 'Credenciais inválidas no Active Directory' },
        { status: 401 },
      )
    }

    // 2. Verificar se o usuário existe no banco de dados
    const user = await prisma.user.findUnique({
      where: { login },
    })

    // Se o usuário não existir no banco mas foi autenticado no AD, podemos criar um registro básico
    if (!user) {
      // Opção 1: Retornar erro
      return NextResponse.json(
        { error: 'Usuário não encontrado no sistema' },
        { status: 404 },
      )
    }

    // 3. Gerar token JWT usando jose (compatível com Edge Runtime)
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'your-secret-key',
    )

    // No momento de gerar o token, incluir o role
    const token = await new SignJWT({
      id: user.id,
      name: user.name,
      login: user.login,
      role: user.role, // Adicionar role
      clientId: user.clientId,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(secret)

    // 4. Retornar resposta com token em cookie

    const response = NextResponse.json({
      user: {
        id: user.id,
        login: user.login,
        name: user.name,
        status: user.status,
        role: user.role,
        clientId: user.clientId, // Add this line
      },
    })

    console.log(user)

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
