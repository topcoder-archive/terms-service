const { test } = require('node:test')
const assert = require('node:assert/strict')
const { once } = require('node:events')
const { createHmac, generateKeyPairSync, sign } = require('node:crypto')

Object.assign(process.env, {
  AUTH_SECRET: 'a-fixture-secret-with-at-least-32-bytes',
  VALID_ISSUERS: '["https://issuer.test.invalid/"]',
  JWT_AUDIENCE: 'fixture-browser',
  AUTH0_AUDIENCE: 'fixture-machine',
  AUTH0_CLIENT_ID: 'fixture-client',
  AUTH0_CLIENT_SECRET: 'fixture-secret'
})

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
let machineIssuer

function token (claims, secret = process.env.AUTH_SECRET) {
  const header = Buffer.from(JSON.stringify(claims.gty ? { alg: 'RS256', typ: 'JWT', kid: 'fixture' } : { alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({ iss: claims.gty ? machineIssuer : 'https://issuer.test.invalid/', exp: Math.floor(Date.now() / 1000) + 60, ...claims })).toString('base64url')
  const data = `${header}.${payload}`
  const signature = claims.gty ? sign('RSA-SHA256', Buffer.from(data), privateKey).toString('base64url') : createHmac('sha256', secret).update(data).digest('base64url')
  return `${data}.${signature}`
}

test('actual route registration preserves anonymous access, authentication and role/scope gates', async (t) => {
  const app = require('express')()
  const server = app.listen(0, '127.0.0.1')
  await once(server, 'listening')
  t.after(() => new Promise(resolve => server.close(resolve)))
  machineIssuer = `http://127.0.0.1:${server.address().port}/`
  process.env.VALID_ISSUERS = JSON.stringify(['https://issuer.test.invalid/', machineIssuer])
  app.get('/.well-known/jwks.json', (req, res) => res.json({ keys: [{ ...publicKey.export({ format: 'jwk' }), kid: 'fixture', alg: 'RS256', use: 'sig' }] }))
  const routes = require('../../src/routes')
  // Substitute only database-backed controller actions; exercise the real router,
  // authentication middleware and service authorization rules over HTTP.
  for (const verbs of Object.values(routes)) {
    for (const def of Object.values(verbs)) {
      const file = require.resolve(`../../src/controllers/${def.controller}`)
      if (!require.cache[file]) require.cache[file] = { id: file, filename: file, loaded: true, exports: {} }
      require.cache[file].exports[def.method] = (req, res) => res.json({ user: req.authUser || null })
    }
  }
  require('../../app-routes')(app)
  app.use((err, req, res, next) => res.status(err.status || err.httpStatus || 500).json({ message: err.message }))
  async function status (path, claims, secret) {
    const headers = claims === undefined ? {} : { authorization: `Bearer ${token(claims, secret)}` }
    const response = await fetch(`http://127.0.0.1:${server.address().port}/v5${path}`, { headers })
    await response.text()
    return response.status
  }
  assert.equal(await status('/terms'), 200)
  assert.equal(await status('/terms/fixture'), 200)
  assert.equal(await status('/terms/types'), 401)
  assert.equal(await status('/terms/types', { userId: '123', roles: ['Administrator'] }), 200)
  assert.equal(await status('/terms/types', { userId: '123', roles: ['Member'] }), 403)
  assert.equal(await status('/terms/types', { userId: '123', roles: ['Administrator'] }, 'incorrect-secret'), 401)
  assert.equal(await status('/terms/types', { userId: '123', roles: ['Administrator'], iss: 'https://untrusted.invalid/' }), 401)
  assert.equal(await status('/terms/types', { userId: '123', roles: ['Administrator'], exp: 1 }), 401)
  assert.equal(await status('/terms/fixture', { userId: '123', iss: 'https://untrusted.invalid/' }), 401)
  assert.equal(await status('/terms/types', { gty: 'client-credentials', aud: 'fixture-machine', scope: 'read:terms' }), 200)
  assert.equal(await status('/terms/types', { gty: 'client-credentials', aud: 'fixture-machine', scope: 'write:terms' }), 403)
  assert.equal(await status('/terms/types', { gty: 'client-credentials', aud: 'different-api', scope: 'read:terms' }), 401)
})
