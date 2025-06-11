import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    // Obter o token do cookie
    const cookieStore = cookies()
    const token = cookieStore.get('token-spdf')?.value

    if (!token) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Verificar e decodificar o token
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'your-secret-key'
    )
    
    const { payload } = await jwtVerify(token, secret)
    
    // Obter o ID do usuário e do cliente
    const userId = payload.id as number
    const clientId = payload.clientId as number

    if (!userId || !clientId) {
      return NextResponse.json(
        { error: 'Informações de usuário incompletas' },
        { status: 400 }
      )
    }

    // Incrementar o uso do usuário
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        usage: {
          increment: 1
        }
      }
    })

    // Verificar se já existe um registro de uso para o cliente hoje
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const existingUsage = await prisma.usage.findFirst({
      where: {
        clientId,
        date: {
          gte: today
        }
      }
    })

    if (existingUsage) {
      // Atualizar o registro existente
      await prisma.usage.update({
        where: { id: existingUsage.id },
        data: {
          value: {
            increment: 1
          }
        }
      })
    } else {
      // Criar um novo registro de uso
      await prisma.usage.create({
        data: {
          value: 1,
          clientId
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao incrementar uso:', error)
    return NextResponse.json(
      { error: 'Falha ao incrementar uso' },
      { status: 500 }
    )
  }
}