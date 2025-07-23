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

export async function PATCH(
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

    const body = await request.json()
    const { status, role } = body

    // Validar status
    if (status && status !== 'Ativo' && status !== 'Inativo') {
      return NextResponse.json(
        { error: 'Status inválido. Deve ser "Ativo" ou "Inativo"' },
        { status: 400 }
      )
    }

    // Validar role se fornecido
    if (role && !['user', 'manager', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Role inválido. Deve ser "user", "manager" ou "admin"' },
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

    // Verificar permissões para alterar role
    if (role && role !== existingUser.role) {
      if (currentUser.role === 'manager') {
        // Managers só podem definir users e managers
        if (role === 'admin') {
          return NextResponse.json(
            { error: 'Você não tem permissão para criar administradores' },
            { status: 403 }
          )
        }
        // Managers só podem editar usuários do mesmo cliente
        if (existingUser.clientId !== currentUser.clientId) {
          return NextResponse.json(
            { error: 'Você só pode editar usuários do seu cliente' },
            { status: 403 }
          )
        }
      } else if (currentUser.role === 'user') {
        return NextResponse.json(
          { error: 'Você não tem permissão para alterar roles' },
          { status: 403 }
        )
      }
      // Admins podem alterar qualquer role
    }

    // Preparar dados para atualização
    const updateData: any = {}
    if (status) updateData.status = status
    if (role) updateData.role = role

    // Atualizar o usuário
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar usuário' },
      { status: 500 }
    )
  }
}