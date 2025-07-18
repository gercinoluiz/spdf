import { User } from '@/store/useUserStore'

// Definir permissões por role
export const PERMISSIONS = {
  user: {
    canAccessHome: true,
    canAccessClients: false,
    canManageUsers: false,
    canAccessConfig: false,
  },
  manager: {
    canAccessHome: true,
    canAccessClients: true, // Apenas do próprio cliente
    canManageUsers: true,   // Apenas usuários do próprio cliente
    canAccessConfig: false,
  },
  admin: {
    canAccessHome: true,
    canAccessClients: true, // Todos os clientes
    canManageUsers: true,   // Todos os usuários
    canAccessConfig: true,
  },
} as const

// Função para verificar permissões
export const hasPermission = (
  user: User | null,
  permission: keyof typeof PERMISSIONS.admin
): boolean => {
  if (!user || !user.role) return false
  return PERMISSIONS[user.role as keyof typeof PERMISSIONS]?.[permission] || false
}

// Função para verificar se o usuário pode acessar dados de um cliente específico
export const canAccessClient = (user: User | null, clientId: number): boolean => {
  if (!user) return false
  
  // Admin pode acessar qualquer cliente
  if (user.role === 'admin') return true
  
  // Manager e user só podem acessar seu próprio cliente
  return user.clientId === clientId
}