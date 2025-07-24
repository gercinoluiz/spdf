import { NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const { code, state } = await request.json()

    if (!code) {
      return NextResponse.json(
        { error: 'Código de autorização é obrigatório' },
        { status: 400 }
      )
    }

    // 1. Trocar código por token no provedor OIDC
    const tokenResponse = await fetch(`${process.env.OIDC_BASE_URL}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.OIDC_CLIENT_ID!,
        client_secret: process.env.OIDC_CLIENT_SECRET!,
        code,
        redirect_uri: `${process.env.SPA_BASE_URL}signin-callback`,
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error('Falha ao obter token do OIDC')
    }

    const tokenData = await tokenResponse.json()

    // 2. Obter informações do usuário
    const userInfoResponse = await fetch(`${process.env.OIDC_BASE_URL}/userinfo`, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    })

    if (!userInfoResponse.ok) {
      throw new Error('Falha ao obter informações do usuário')
    }

    const userInfo = await userInfoResponse.json()

    // 3. Verificar se o usuário existe no banco de dados
    const user = await prisma.user.findUnique({
      where: { login: userInfo.preferred_username || userInfo.sub },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado no sistema' },
        { status: 404 }
      )
    }

    // 4. Gerar token JWT interno
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

    // 5. Retornar resposta com token em cookie
    const response = NextResponse.json({
      user: {
        id: user.id,
        login: user.login,
        name: user.name,
        status: user.status,
        role: user.role,
        clientId: user.clientId,
      },
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
    console.error('Erro no callback OIDC:', error)
    return NextResponse.json(
      { error: 'Erro no callback OIDC' },
      { status: 500 }
    )
  }
}