const assert = require('node:assert/strict')
const { realpathSync } = require('node:fs')
const { join } = require('node:path')
const { test, afterEach } = require('node:test')
const nock = require('nock')

const saved = { ...process.env }
const root = join(__dirname, '..')
const fresh = [join(root, 'config') + '/', join(root, 'src') + '/', join(root, 'node_modules', 'config') + '/',
  realpathSync(join(root, 'node_modules', 'tc-bus-api-wrapper')) + '/']
const keycloakEnv = {
  KEYCLOAK_ISSUER: 'https://keycloak.test/realms/m2m',
  KEYCLOAK_AUDIENCE: 'https://api.test',
  KEYCLOAK_TOKEN_URL: 'https://keycloak.test/m2m/token',
  KEYCLOAK_CLIENT_ID: 'm2m-terms',
  KEYCLOAK_CLIENT_SECRET: 'keycloak-secret'
}
const auth0Env = { AUTH0_CLIENT_ID: 'auth0-terms', AUTH0_CLIENT_SECRET: 'auth0-secret' }
const auth0Body = {
  grant_type: 'client_credentials',
  client_id: 'auth0-terms',
  client_secret: 'auth0-secret',
  auth0_url: 'https://topcoder-dev.auth0.com/oauth/token',
  audience: 'https://m2m.topcoder-dev.com/'
}

/**
 * Load config, src modules and the Bus wrapper afresh with `env` as the only USE_KEYCLOAK,
 * AUTH0_* and KEYCLOAK_* settings. Returns the helper module.
 */
function load (env) {
  process.env = { ...saved }
  for (const name of Object.keys(saved)) {
    if (name === 'USE_KEYCLOAK' || name.startsWith('AUTH0_') || name.startsWith('KEYCLOAK_')) delete process.env[name]
  }
  Object.assign(process.env, env)
  for (const file of Object.keys(require.cache)) {
    if (fresh.some(prefix => file.startsWith(prefix))) delete require.cache[file]
  }
  return require('../src/common/helper')
}

afterEach(() => {
  nock.cleanAll()
  nock.enableNetConnect()
  process.env = { ...saved }
})

for (const [name, flag] of [['unset', {}], ['false', { USE_KEYCLOAK: 'false' }]]) {
  test(`USE_KEYCLOAK ${name} uses the Auth0 settings and defaults for Member and Bus tokens`, async () => {
    const { getM2Mtoken, postEvent } = load({ ...flag, ...auth0Env, ...keycloakEnv })
    nock.disableNetConnect()
    const tokens = nock('https://topcoder-dev.auth0.com').post('/oauth/token', auth0Body).twice()
      .reply(200, { access_token: `auth0-token-${name}` })
    const bus = nock('https://api.topcoder-dev.com', { reqheaders: { authorization: `Bearer auth0-token-${name}` } })
      .post('/v6/bus/events').reply(204)
    assert.equal(await getM2Mtoken(), `auth0-token-${name}`)
    await postEvent('test.topic', {})
    assert.equal(tokens.isDone(), true)
    assert.equal(bus.isDone(), true)
  })
}

test('USE_KEYCLOAK unset starts without any KEYCLOAK_* setting', () => {
  load(auth0Env)
  assert.equal(typeof require('../src/common/auth').authenticate, 'function')
})

test('USE_KEYCLOAK=true uses the Keycloak settings for Member and Bus tokens', async () => {
  const { getM2Mtoken, postEvent } = load({ USE_KEYCLOAK: 'true', ...auth0Env, ...keycloakEnv })
  nock.disableNetConnect()
  const tokens = nock('https://keycloak.test').post('/m2m/token', {
    grant_type: 'client_credentials',
    client_id: 'm2m-terms',
    client_secret: 'keycloak-secret',
    audience: 'https://api.test'
  }).twice().reply(503)
  await assert.rejects(getM2Mtoken(), /^Error: Keycloak M2M token request failed$/)
  await assert.rejects(postEvent('test.topic', {}), /^Error: Keycloak M2M token request failed$/)
  assert.equal(tokens.isDone(), true)
})

test('USE_KEYCLOAK=true still requires the Keycloak settings at startup', () => {
  assert.throws(() => load({ USE_KEYCLOAK: 'true', ...auth0Env }), /KEYCLOAK_/)
})

test('an invalid USE_KEYCLOAK value fails when the helper loads', () => {
  assert.throws(() => load({ USE_KEYCLOAK: 'keycloak', ...auth0Env, ...keycloakEnv }), /USE_KEYCLOAK must be true or false/)
})
