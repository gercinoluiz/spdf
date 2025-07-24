export const oidcConfig = {
    authority: `${import.meta.env.OIDC_BASE_URL}`,
    client_id: `${import.meta.env.OIDC_CLIENT_ID}`,
    redirect_uri: `${import.meta.env.SPA_BASE_URL}signin-callback`,
    post_logout_redirect_uri: `${import.meta.env.SPA_BASE_URL}logoffmessage-callback`,
    // response_type: 'code',
    scope: 'openid offline_access cac:dscplcintr cac api-gch',
    silent_redirect_uri: `${import.meta.env.SPA_BASE_URL}silent-callback`,

    clockSkew: 60,
    automaticSilentRenew: false,
    accessTokenExpiringNotificationTime: 0,
    extraQueryParams: {
      codigosistema: `${process.env.OIDC_CLIENT_ID}`,
      codigogrupo: `${process.env.CAC_DEFAULT_GRUPO_ID}`,
      nomegrupoad: `${process.env.OIDC_NOME_GRUPO_AD}`,
      post_logout_redirect_uri: `${process.env.SPA_BASE_URL}logoffmessage-callback`
}

      // nomegrupoad:'G_X_USERSDESCOMPLICA'

  }
