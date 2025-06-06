import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient();


export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        plan: true,
        usage: {
          orderBy: {
            date: "desc",
          },
          take: 1,
        },
        // Adicione a relação users de forma simplificada
        users: {
          select: {
            id: true,
            name: true,
            login: true,
            status: true,
            lastAccess: true,
          },
        },
      },
    })

    if (!client) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 })
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error("Erro ao buscar cliente:", error)
    return NextResponse.json({ error: "Erro ao buscar cliente" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)
    const body = await request.json()

    const {
      cliente: name,
      contrato: contractNumber,
      plano,
      status,
      email,
      telefone: phone,
      endereco: address,
      cidade: city,
      cep: zipCode,
      responsavel: responsible,
      observacoes: observations,
      dataContrato,
      dataVencimento,
      configuracoes,
    } = body

    // Buscar o ID do plano pelo nome
    const plan = await prisma.plan.findUnique({
      where: { name: plano },
    })

    if (!plan) {
      return NextResponse.json({ error: "Plano não encontrado" }, { status: 404 })
    }

    // Verificar se o plano mudou para registrar no histórico
    const currentClient = await prisma.client.findUnique({
      where: { id },
      include: { plan: true },
    })

    // Atualizar o cliente
    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        name,
        contractNumber,
        planId: plan.id,
        status,
        email,
        phone,
        address,
        city,
        zipCode,
        responsible,
        observations,
        configuration: {
          update: {
            notifications: configuracoes?.notificacoes,
            reports: configuracoes?.relatorios,
            apiAccess: configuracoes?.apiAccess,
            automaticBackup: configuracoes?.backupAutomatico,
            contractDate: dataContrato ? new Date(dataContrato) : undefined,
            expirationDate: dataVencimento ? new Date(dataVencimento) : undefined,
          },
        },
      },
    })

    // Registrar mudança de plano no histórico se necessário
    if (currentClient && currentClient.planId !== plan.id) {
      await prisma.planHistory.create({
        data: {
          previousPlanId: currentClient.planId,
          reason: "Alteração manual via sistema",
          changedBy: "Admin", // Idealmente, usar o usuário logado
          clientId: id,
        },
      })
    }

    return NextResponse.json(updatedClient)
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error)
    return NextResponse.json({ error: "Erro ao atualizar cliente" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id)

    // Excluir registros relacionados primeiro
    await prisma.planHistory.deleteMany({
      where: { clientId: id },
    })

    await prisma.usage.deleteMany({
      where: { clientId: id },
    })

    await prisma.configuration.delete({
      where: { clientId: id },
    })

    await prisma.user.deleteMany({
      where: { clientId: id },
    })

    // Finalmente excluir o cliente
    await prisma.client.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao excluir cliente:", error)
    return NextResponse.json({ error: "Erro ao excluir cliente" }, { status: 500 })
  }
}


