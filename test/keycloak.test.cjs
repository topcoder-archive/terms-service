const assert = require('node:assert/strict')
const { generateKeyPairSync, sign, createHmac } = require('node:crypto')
const { test } = require('node:test')
const nock = require('nock')
const issuer = 'https://terms.test/realms/m2m'
const audience = 'https://api.test'
Object.assign(process.env, {
  USE_KEYCLOAK: 'true',
  KEYCLOAK_ISSUER: issuer,
  KEYCLOAK_AUDIENCE: audience,
  KEYCLOAK_TOKEN_URL: 'https://terms.test/m2m/token',
  KEYCLOAK_CLIENT_ID: 'terms-test',
  KEYCLOAK_CLIENT_SECRET: 'synthetic-secret',
  KEYCLOAK_SCOPE: 'write:bus_api',
  AUTH_SECRET: 'synthetic-member-secret',
  VALID_ISSUERS: '["https://member.test"]',
  AUTH_USER_AUDIENCES: '["member-api"]'
})
const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
/** Produce signed service/member fixtures with optional changes; no external credentials. */
function token (changes = {}, member = false) {
  const now = Math.floor(Date.now() / 1000)
  const header = Buffer.from(JSON.stringify(member ? { alg: 'HS256' } : { alg: 'RS256', kid: 'terms' })).toString('base64url')
  const claims = member
    ? { iss: 'https://member.test', aud: 'member-api', userId: 123, roles: ['administrator'], handle: 'fixture' }
    : { iss: issuer, aud: audience, sub: 'service-terms', azp: 'terms-test', gty: 'client-credentials', scope: 'read:terms' }
  const payload = Buffer.from(JSON.stringify({ ...claims, iat: now, exp: now + 900, ...changes })).toString('base64url')
  const input = `${header}.${payload}`
  const signature = member ? createHmac('sha256', 'synthetic-member-secret').update(input).digest('base64url') : sign('RSA-SHA256', Buffer.from(input), privateKey).toString('base64url')
  return `${input}.${signature}`
}
nock(issuer).persist().get('/protocol/openid-connect/certs').reply(200, { keys: [{ ...publicKey.export({ format: 'jwk' }), kid: 'terms', alg: 'RS256', use: 'sig' }] })
const { authenticate, hasRequiredScopes } = require('../src/common/auth')
/** Run the actual inbound middleware; resolve its normalized request or reject auth errors. */
async function verify (jwt) {
  const req = { headers: { authorization: `Bearer ${jwt}` } }
  await new Promise((resolve, reject) => authenticate(req, {}, error => error ? reject(error) : resolve())); return req.authUser
}
test('service validation and scope decisions match shared core', async () => {
  const principal = await verify(token()); assert.equal(principal.kind, 'service'); assert.equal(principal.userId, undefined); assert.equal(principal.handle, undefined)
  assert.equal(hasRequiredScopes({ scopes: ['read:terms'] }, principal), true)
  assert.equal(hasRequiredScopes({}, principal), false)
  assert.equal(hasRequiredScopes({ scopes: ['write:terms'] }, principal), false)
  await assert.rejects(verify(token({ aud: 'wrong' })))
  await assert.rejects(verify(token({ roles: ['administrator'] })))
})
test('members retain IDs and roles without gaining machine scopes', async () => {
  const member = await verify(token({ scope: 'read:terms' }, true))
  assert.equal(member.userId, 123); assert.equal(member.kind, 'user')
  assert.equal(hasRequiredScopes({ scopes: ['read:terms'] }, member), false)
})
test('optional auth requires read scope and member signing stays member-only', async () => {
  const routes = require('../src/routes')
  for (const verbs of Object.values(routes)) {
    for (const def of Object.values(verbs)) {
      const path = require.resolve('../src/controllers/' + def.controller)
      const entry = require.cache[path] || { id: path, filename: path, loaded: true, exports: {} }
      entry.exports[def.method] = (req, res) => res.json({ kind: req.authUser?.kind || 'anonymous', userId: req.authUser?.userId }); require.cache[path] = entry
    }
  }
  const express = require('express'); const app = express(); require('../app-routes')(app)
  app.use((error, req, res, next) => res.status(error.httpStatus || 500).json({ message: error.message }))
  const server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve))
  const base = `http://127.0.0.1:${server.address().port}/v5/terms`
  try {
    let result = await fetch(base + '/fixture'); assert.equal(result.status, 200); assert.equal((await result.json()).kind, 'anonymous')
    result = await fetch(base + '/fixture', { headers: { authorization: 'Bearer ' + token() } }); assert.equal(result.status, 200)
    result = await fetch(base + '/fixture', { headers: { authorization: 'Bearer ' + token({ scope: 'write:terms' }) } }); assert.equal(result.status, 403)
    result = await fetch(base + '/fixture', { headers: { authorization: 'Bearer invalid' } }); assert.equal(result.status, 401)
    result = await fetch(base + '/fixture/agree', { method: 'POST', headers: { authorization: 'Bearer ' + token({ scope: 'write:terms' }) } }); assert.equal(result.status, 403)
    result = await fetch(base + '/fixture/agree', { method: 'POST', headers: { authorization: 'Bearer ' + token({}, true) } }); assert.equal(result.status, 200)
    result = await fetch(base, { method: 'POST', headers: { authorization: 'Bearer ' + token() } }); assert.equal(result.status, 403)
    result = await fetch(base, { method: 'POST', headers: { authorization: 'Bearer ' + token({ scope: 'write:terms' }) } }); assert.equal(result.status, 200)
  } finally { await new Promise(resolve => server.close(resolve)) }
})
test('outbound provider validates responses and reuses verified credentials', async () => {
  const { getM2Mtoken } = require('../src/common/helper')
  const bad = nock('https://terms.test').post('/m2m/token').reply(200, { access_token: token({ azp: 'other', scope: 'write:bus_api' }), expires_in: 900 })
  await assert.rejects(getM2Mtoken(), /^Error: Keycloak M2M token request failed$/); assert.equal(bad.isDone(), true)
  const jwt = token({ scope: 'write:bus_api' }); const endpoint = nock('https://terms.test').post('/m2m/token').reply(200, { access_token: jwt, expires_in: 900 })
  assert.equal(await getM2Mtoken(), jwt); assert.equal(await getM2Mtoken(), jwt); assert.equal(endpoint.isDone(), true)
})
test('Bus wrapper uses the same pinned verifier and Keycloak credentials', async () => {
  const { createRequire } = require('node:module')
  const wrapperRequire = createRequire(require.resolve('tc-bus-api-wrapper'))
  assert.equal(wrapperRequire('tc-core-library-js/package.json').version, '4.0.0-keycloak.1')
  const { postEvent } = require('../src/common/helper')
  const bad = nock('https://terms.test').post('/m2m/token').reply(200, { access_token: token({ aud: 'wrong' }), expires_in: 900 })
  await assert.rejects(postEvent('test.topic', {}), /^Error: Keycloak M2M token request failed$/); assert.equal(bad.isDone(), true)
  const jwt = token({ scope: 'write:bus_api' }); const endpoint = nock('https://terms.test').post('/m2m/token').reply(200, { access_token: jwt, expires_in: 900 })
  const bus = nock('https://api.topcoder-dev.com', { reqheaders: { authorization: `Bearer ${jwt}` } }).post('/v6/bus/events').twice().reply(204)
  await postEvent('test.topic', {}); await postEvent('test.topic', {})
  assert.equal(bus.isDone(), true); assert.equal(endpoint.isDone(), true)
})
