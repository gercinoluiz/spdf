import NextAuth from 'next-auth'
import Providers from 'next-auth/providers'

export default NextAuth({
  providers: [
    {
      id: 'customOidc',
      name: 'Custom OIDC',
      type: 'oidc',
      wellKnown:
        'https://pp9881.dapp.prodam/oauth/.well-known/openid-configuration',
      clientId: process.env.NEXT_PUBLIC_OIDC_CLIENT_ID,
      clientSecret: process.env.NEXT_PUBLIC_OIDC_CLIENT_SECRET ?? '',
      authorization: {
        params: {
          scope: 'openid offline_access cac:sdpf',
          codigosistema: process.env.NEXT_PUBLIC_OIDC_CLIENT_ID,
          codigogrupo: process.env.NEXT_PUBLIC_CAC_DEFAULT_GRUPO_ID,
          response_mode: 'query',
          post_logout_redirect_uri: `${process.env.NEXT_PUBLIC_SPA_BASE_URL}logoffmessage-callback`,
        },
      },
      idToken: true,
      checks: ['pkce', 'state'],
    },
  ],
  // ... rest of the configuration
})
