import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
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

    // Transformar os dados para incluir o limite do plano no uso
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
    const body = await request.json()

    // Validação mínima
    if (!body.name) {
      return NextResponse.json(
        { error: "Nome do cliente é obrigatório" },
        { status: 400 }
      )
    }

    // Criar cliente com campos mínimos
    const newClient = await prisma.client.create({
      data: {
        name: body.name,
        contractNumber: body.contractNumber || `CNT-${Date.now()}`, // Gera um número de contrato se não for fornecido
        status: body.status || "Ativo",
        email: body.email,
        phone: body.phone,
        planId: parseInt(body.planId) || 1, // Assume que existe um plano com ID 1
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
