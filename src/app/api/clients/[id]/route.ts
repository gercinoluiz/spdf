import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient();


export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    // Await params before accessing its properties
    const { id: paramId } = await params
    const id = Number.parseInt(paramId)

    const client = await prisma.client.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        contractNumber: true,
        totalUsage: true, // ✅ This is the key field we need!
        status: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        zipCode: true,
        responsible: true,
        observations: true,
        planId: true,
        plan: {
          select: {
            id: true,
            name: true,
            limit: true,
            price: true,
          },
        },
        users: {
          select: {
            id: true,
            name: true,
            login: true,
            status: true,
            lastAccess: true,
            usage: true,
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
    // Await params before accessing its properties
    const { id: paramId } = await params
    const id = Number.parseInt(paramId)
    const body = await request.json()
    
    console.log(body)

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
    // Check if configuration exists for this client
    const existingConfig = await prisma.configuration.findUnique({
      where: { clientId: id },
    })
    
    // Prepare the client update data
    const clientUpdateData = {
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
    }
    
    // If configuration exists, update it; otherwise, create it
    if (existingConfig) {
      // Update existing configuration
      const updatedClient = await prisma.client.update({
        where: { id },
        data: {
          ...clientUpdateData,
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
        include: {
          plan: true,
          configuration: true,
        },
      })
      return NextResponse.json(updatedClient)
    } else {
      // Create new configuration
      const updatedClient = await prisma.client.update({
        where: { id },
        data: {
          ...clientUpdateData,
          configuration: {
            create: {
              notifications: configuracoes?.notificacoes,
              reports: configuracoes?.relatorios,
              apiAccess: configuracoes?.apiAccess,
              automaticBackup: configuracoes?.backupAutomatico,
              contractDate: dataContrato ? new Date(dataContrato) : undefined,
              expirationDate: dataVencimento ? new Date(dataVencimento) : undefined,
            },
          },
        },
        include: {
          plan: true,
          configuration: true,
        },
      })
      return NextResponse.json(updatedClient)
    }

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
    // Await params before accessing its properties
    const { id: paramId } = await params
    const id = Number.parseInt(paramId)

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


