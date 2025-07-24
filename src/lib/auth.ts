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

import NextAuth from "next-auth"
import type { NextAuthConfig } from "next-auth"

export const authConfig: NextAuthConfig = {
  providers: [
    {
      id: "oidc",
      name: "OIDC Provider",
      type: "oidc",
      issuer: process.env.OIDC_BASE_URL,
      clientId: process.env.OIDC_CLIENT_ID,
      clientSecret: process.env.OIDC_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "openid offline_access cac:dscplcintr cac api-gch",
          codigosistema: process.env.OIDC_CLIENT_ID,
          codigogrupo: process.env.CAC_DEFAULT_GRUPO_ID,
          nomegrupoad: process.env.OIDC_NOME_GRUPO_AD,
        },
      },
    },
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnLoginPage = nextUrl.pathname.startsWith('/login')
      
      if (isOnLoginPage) {
        if (isLoggedIn) return Response.redirect(new URL('/', nextUrl))
        return true
      } else if (!isLoggedIn) {
        return false
      }
      
      return true
    },
  },
  pages: {
    signIn: '/login',
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)