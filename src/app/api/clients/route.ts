import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

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

export async function GET() {
  try {
    // Get current user from JWT
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Build where clause based on user role
    let whereClause = {}
    
    if (currentUser.role === 'manager') {
      // Managers can only see their own client
      whereClause = {
        id: currentUser.clientId
      }
    }
    // Admins can see all clients (no where clause needed)
    // Users shouldn't access this endpoint at all
    
    if (currentUser.role === 'user') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const clients = await prisma.client.findMany({
      where: whereClause,
      include: {
        plan: {
          select: {
            name: true,
            limit: true,
          },
        },
        usage: {
          orderBy: {
            date: 'desc',
          },
          take: 1,
          select: {
            value: true,
            date: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Transform data to include plan limit in usage
    const clientsWithUsageLimit = clients.map((client) => ({
      ...client,
      usage: client.usage.map((usage) => ({
        ...usage,
        limit: client.plan?.limit || 0,
      })),
    }))

    return NextResponse.json(clientsWithUsageLimit)
  } catch (error) {
    console.error('Erro ao buscar clientes:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar clientes' },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    // Get current user from JWT
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Only admins can create new clients
    if (currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado. Apenas administradores podem criar clientes.' }, { status: 403 })
    }

    const body = await request.json()

    // Minimal validation
    if (!body.name) {
      return NextResponse.json(
        { error: "Nome do cliente é obrigatório" },
        { status: 400 }
      )
    }

    // Create client with minimal fields
    const newClient = await prisma.client.create({
      data: {
        name: body.name,
        contractNumber: body.contractNumber || `CNT-${Date.now()}`,
        status: body.status || "Ativo",
        email: body.email,
        phone: body.phone,
        planId: parseInt(body.planId) || 1,
      },
    })

    return NextResponse.json(newClient)
  } catch (error) {
    console.error('Erro ao criar cliente:', error)
    return NextResponse.json(
      { error: 'Erro ao criar cliente' },
      { status: 500 },
    )
  }
}
