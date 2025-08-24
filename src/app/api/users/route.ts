import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

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

    const { name, login, email, password, clientId, status, newlyGeneratedPassword } = body

    // Validate required fields
    if (!name || !email || !password || !clientId) {
      return NextResponse.json(
        { error: 'Nome, email, senha e clientId são obrigatórios' },
        { status: 400 }
      )
    }

    // Check if user with this email or login already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { login: login }
        ]
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Usuário com este email ou login já existe' },
        { status: 409 }
      )
    }

    // Hash the password using bcrypt
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create user with hashed password and firstLogin flag
    const user = await prisma.user.create({
      data: {
        name,
        login: login || email.split('@')[0], // Use email prefix as login if not provided
        email,
        password: hashedPassword,
        status: status || 'Ativo',
        clientId: Number.parseInt(clientId),
        firstLogin: true, // Set firstLogin to true for new users
      },
    })

    // Log the creation with the flag for tracking
    console.log(`User created: ${user.email}, newlyGeneratedPassword: ${newlyGeneratedPassword}, firstLogin: true`)

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user
    
    return NextResponse.json({
      ...userWithoutPassword,
      message: 'Usuário criado com sucesso',
      newlyGeneratedPassword: newlyGeneratedPassword || false
    }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar usuário:', error)
    return NextResponse.json(
      { error: 'Erro ao criar usuário' },
      { status: 500 },
    )
  }
}
