const { test } = require('node:test')
const assert = require('node:assert/strict')
const http = require('node:http')
const { once } = require('node:events')

test('service helper caches M2M tokens and preserves BUS envelopes and errors', async (t) => {
  const requests = []
  let failBus = false
  const server = http.createServer(async (req, res) => {
    let body = ''
    for await (const part of req) body += part
    requests.push({ path: req.url, authorization: req.headers.authorization, body: JSON.parse(body) })
    res.setHeader('Content-Type', 'application/json')
    if (req.url === '/oauth/token') res.end(JSON.stringify({ access_token: 'test-access-token', token_type: 'Bearer', expires_in: 3600 }))
    else if (failBus) { res.statusCode = 503; res.end(JSON.stringify({ secret: 'private-upstream-detail' })) } else res.end('{}')
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  t.after(() => new Promise(resolve => server.close(resolve)))
  const base = `http://127.0.0.1:${server.address().port}`
  Object.assign(process.env, {
    AUTH0_URL: `${base}/oauth/token`,
    AUTH0_PROXY_SERVER_URL: `${base}/oauth/token`,
    AUTH0_AUDIENCE: 'https://test.invalid/',
    AUTH0_CLIENT_ID: 'test-client',
    AUTH0_CLIENT_SECRET: 'test-secret',
    BUSAPI_URL: `${base}/v6`,
    LOG_LEVEL: 'error'
  })
  require('../../app-bootstrap')
  const helper = require('../../src/common/helper')
  assert.equal(await helper.getM2Mtoken(), 'test-access-token')
  assert.equal(await helper.getM2Mtoken(), 'test-access-token')
  assert.equal(requests.filter(r => r.path === '/oauth/token').length, 1)
  await helper.postEvent('terms.test', { id: 'fixture', nested: { accepted: true } })
  const event = requests.find(r => r.path === '/v6/bus/events')
  assert.equal(event.authorization, 'Bearer test-access-token')
  assert.equal(event.body.topic, 'terms.test')
  assert.equal(event.body['mime-type'], 'application/json')
  assert.equal(event.body.originator, 'terms-api')
  assert.ok(Number.isFinite(Date.parse(event.body.timestamp)))
  assert.deepEqual(event.body.payload, { id: 'fixture', nested: { accepted: true } })
  failBus = true
  await assert.rejects(helper.postEvent('terms.test', {}), error => {
    assert.equal(error.status, 503)
    assert.doesNotMatch(error.message, /private-upstream-detail|test-secret|test-access-token/)
    return true
  })
  assert.equal(requests.filter(r => r.path === '/v6/bus/events').length, 2)
})
