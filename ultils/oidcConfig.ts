export const oidcConfig = {
  authority: `${process.env.NEXT_PUBLIC_OIDC_BASE_URL}`,
  client_id: `${process.env.NEXT_PUBLIC_OIDC_CLIENT_ID}`,
  redirect_uri: `${process.env.NEXT_PUBLIC_SPA_BASE_URL}signin-callback`,
  post_logout_redirect_uri: `${process.env.NEXT_PUBLIC_SPA_BASE_URL}signout-callback`,
  // response_type: 'code',
  scope: 'openid offline_access cac:sdpf',
  silent_redirect_uri: `${process.env.NEXT_PUBLIC_SPA_BASE_URL}silent-callback`,

  clockSkew: 60,
  automaticSilentRenew: false,
  accessTokenExpiringNotificationTime: 0,
  extraQueryParams: {
    codigosistema: `${process.env.NEXT_PUBLIC_OIDC_CLIENT_ID}`,
    codigogrupo: `${process.env.NEXT_PUBLIC_CAC_DEFAULT_GRUPO_ID}`,

    post_logout_redirect_uri: `${process.env.NEXT_PUBLIC_SPA_BASE_URL}signout-callback`,
  },
}
