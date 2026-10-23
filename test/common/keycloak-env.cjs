Object.assign(process.env, {
  USE_KEYCLOAK: 'true',
  KEYCLOAK_ISSUER: 'https://terms.test/realms/m2m',
  KEYCLOAK_AUDIENCE: 'https://api.test',
  KEYCLOAK_TOKEN_URL: 'https://terms.test/m2m/token',
  KEYCLOAK_CLIENT_ID: 'terms-test',
  KEYCLOAK_CLIENT_SECRET: 'synthetic-secret',
  AUTH_SECRET: 'synthetic-member-secret',
  VALID_ISSUERS: '["https://member.test"]',
  AUTH_USER_AUDIENCES: '["member-api"]'
})
