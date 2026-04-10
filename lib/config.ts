export const publicConfig = {
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'LiveCenter Simple',
  assistantName: process.env.NEXT_PUBLIC_ASSISTANT_NAME || 'Xena'
};

export const serverConfig = {
  gatewayUrl: process.env.OPENCLAW_GATEWAY_URL || '',
  gatewayToken: process.env.OPENCLAW_GATEWAY_AUTH_TOKEN || '',
  chatPath: process.env.OPENCLAW_GATEWAY_CHAT_PATH || '/v1/chat/completions',
  model: process.env.OPENCLAW_MODEL || 'openclaw',
  cognitoRegion: process.env.COGNITO_REGION || '',
  cognitoUserPoolId: process.env.COGNITO_USER_POOL_ID || '',
  cognitoClientId: process.env.COGNITO_CLIENT_ID || '',
  cognitoClientSecret: process.env.COGNITO_CLIENT_SECRET || '',
  cognitoDomain: process.env.COGNITO_DOMAIN || '',
  oauthRedirectUri: process.env.OAUTH_REDIRECT_URI || '',
  oauthLogoutUri: process.env.OAUTH_LOGOUT_URI || ''
};
