import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  // Criar planos
  const planBronze = await prisma.plan.create({
    data: {
      name: "Bronze",
      description: "Plano básico com recursos limitados",
      limit: 1000,
      price: 99.9,
    },
  })

  const planPrata = await prisma.plan.create({
    data: {
      name: "Prata",
      description: "Plano intermediário com mais recursos",
      limit: 1500,
      price: 199.9,
    },
  })

  const planOuro = await prisma.plan.create({
    data: {
      name: "Ouro",
      description: "Plano premium com recursos avançados",
      limit: 1800,
      price: 299.9,
    },
  })

  const planDiamante = await prisma.plan.create({
    data: {
      name: "Diamante",
      description: "Plano empresarial com recursos ilimitados",
      limit: 2500,
      price: 499.9,
    },
  })

  // Criar clientes com configurações
  const client1 = await prisma.client.create({
    data: {
      name: "Smith Corporation",
      contractNumber: "198200098",
      status: "Ativo",
      email: "contato@smith.com",
      phone: "(11) 99999-9999",
      address: "Rua das Flores, 123",
      city: "São Paulo",
      zipCode: "01234-567",
      responsible: "João Silva",
      observations: "Cliente premium com suporte prioritário",
      planId: planOuro.id,
      configuration: {
        create: {
          notifications: true,
          reports: true,
          apiAccess: false,
          automaticBackup: true,
          contractDate: new Date("2023-01-15"),
          expirationDate: new Date("2024-01-15"),
        },
      },
      usage: {
        create: {
          value: 130,
          date: new Date(),
        },
      },
    },
  })

  const client2 = await prisma.client.create({
    data: {
      name: "Pam Enterprises",
      contractNumber: "123456789",
      status: "Ativo",
      email: "contato@pam.com",
      phone: "(11) 88888-8888",
      address: "Av. Paulista, 1000",
      city: "São Paulo",
      zipCode: "01310-100",
      responsible: "Maria Santos",
      planId: planPrata.id,
      configuration: {
        create: {
          notifications: true,
          reports: false,
          apiAccess: true,
          automaticBackup: true,
          contractDate: new Date("2023-02-20"),
          expirationDate: new Date("2024-02-20"),
        },
      },
      usage: {
        create: {
          value: 1450,
          date: new Date(),
        },
      },
    },
  })

  const client3 = await prisma.client.create({
    data: {
      name: "Pedro Solutions",
      contractNumber: "910111213",
      status: "Pendente",
      email: "contato@pedro.com",
      phone: "(11) 77777-7777",
      address: "Rua Augusta, 500",
      city: "São Paulo",
      zipCode: "01305-000",
      responsible: "Pedro Oliveira",
      planId: planDiamante.id,
      configuration: {
        create: {
          notifications: false,
          reports: true,
          apiAccess: true,
          automaticBackup: false,
          contractDate: new Date("2023-03-10"),
          expirationDate: new Date("2024-03-10"),
        },
      },
      usage: {
        create: {
          value: 1803,
          date: new Date(),
        },
      },
    },
  })

  // Criar usuários para o cliente 1
  await prisma.user.create({
    data: {
      name: "CARLOS SILVA",
      login: "X9482",
      email: "carlos@smith.com",
      status: "Ativo",
      usage: 192,
      lastAccess: new Date("2024-01-15"),
      clientId: client1.id,
    },
  })

  // Criar histórico de planos
  await prisma.planHistory.create({
    data: {
      previousPlanId: planPrata.id,
      reason: "Upgrade solicitado pelo cliente",
      changedBy: "Admin",
      clientId: client1.id,
      createdAt: new Date("2024-01-15"),
    },
  })

  await prisma.planHistory.create({
    data: {
      previousPlanId: planBronze.id,
      reason: "Migração automática por uso",
      changedBy: "Sistema",
      clientId: client1.id,
      createdAt: new Date("2023-12-10"),
    },
  })

  // Adicionar usuários com diferentes roles
  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin User',
      login: 'admin',
      role: 'admin',
      email: 'admin@example.com',
      clientId: 1,
    },
  })
  
  const managerUser = await prisma.user.create({
    data: {
      name: 'Manager User',
      login: 'manager',
      role: 'manager',
      email: 'manager@example.com',
      clientId: 1,
    },
  })
  
  const regularUser = await prisma.user.create({
    data: {
      name: 'Regular User',
      login: 'user',
      role: 'user',
      email: 'user@example.com',
      clientId: 1,
    },
  })

  console.log("Seed concluído com sucesso!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
