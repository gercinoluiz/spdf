import NextAuth from 'next-auth'
import type { NextAuthOptions } from 'next-auth'

const authOptions: NextAuthOptions = {
  providers: [
    {
      id: 'customOidc',
      name: 'Custom OIDC',
      type: 'oauth',
      wellKnown: `${process.env.OIDC_BASE_URL}/.well-known/openid-configuration`,
      clientId: process.env.OIDC_CLIENT_ID!,
      clientSecret: process.env.OIDC_CLIENT_SECRET!,
      authorization: {
        url: `${process.env.OIDC_BASE_URL}/connect/authorize`,
        params: {
          scope: 'openid offline_access cac:sdpf',
          response_type: 'code',
          response_mode: 'query',
          codigosistema: process.env.OIDC_CLIENT_ID,
          codigogrupo: process.env.NEXT_PUBLIC_CAC_DEFAULT_GRUPO_ID,
          post_logout_redirect_uri: `${process.env.NEXTAUTH_URL}/logoffmessage-callback`,
        },
      },
      token: `${process.env.OIDC_BASE_URL}/connect/token`,
      userinfo: `${process.env.OIDC_BASE_URL}/connect/userinfo`,
      checks: ['pkce', 'state'],
      idToken: true,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          login: profile.preferred_username || profile.sub,
        }
      },
    },
  ],
  callbacks: {
    async jwt({ token, account, profile, user }) {
      if (account) {
        token.accessToken = account.access_token
        token.idToken = account.id_token
      }
      if (profile) {
        token.profile = profile
        token.login = profile.preferred_username || profile.sub
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      session.idToken = token.idToken as string
      session.user.login = token.login as string
      return session
    },
    async signIn({ user, account, profile }) {
      try {
        // Verificar se o usuário existe no banco de dados
        const response = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/verify-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            login: profile?.preferred_username || profile?.sub,
            profile: profile,
          }),
        })
        
        if (!response.ok) {
          console.error('Usuário não encontrado no sistema')
          return false
        }
        
        return true
      } catch (error) {
        console.error('Erro ao verificar usuário:', error)
        return false
      }
    },
    async redirect({ url, baseUrl }) {
      // Redirecionar para a página inicial após login bem-sucedido
      if (url.startsWith('/')) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  debug: process.env.NODE_ENV === 'development',
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
