import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: {
        price: 'asc',
      },
    })

    return NextResponse.json(plans)
  } catch (error) {
    console.error('Erro ao buscar planos:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar planos' },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { name, description, limit, price } = body

    const plan = await prisma.plan.create({
      data: {
        name,
        description,
        limit: Number.parseInt(limit),
        price: Number.parseFloat(price),
      },
    })

    return NextResponse.json(plan, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar plano:', error)
    return NextResponse.json({ error: 'Erro ao criar plano' }, { status: 500 })
  }
}
