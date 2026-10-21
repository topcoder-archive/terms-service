/**
 * E2E test of the search/check terms for resource endpoint.
 */

const _ = require('lodash')
const config = require('config')
const should = require('should')
const { token, request } = require('../common/testData')
const { getRequest, clearLogs } = require('../common/testHelper')

const searchUrl = `http://localhost:${config.PORT}/terms/reference`
const checkUrl = `http://localhost:${config.PORT}/terms/user`

module.exports = describe('search and check terms for resource endpoint', () => {
  beforeEach(() => {
    clearLogs()
  })

  it('search terms for resource success', async () => {
    const res = await getRequest(`${searchUrl}?page=1&perPage=3`, token.user1)
    should.deepEqual(_.omit(res.body.result[0], 'created'), request.searchTermsForResource.response.result[0])
    should.deepEqual(_.omit(res.body.result[1], 'created'), request.searchTermsForResource.response.result[1])
    should.deepEqual(_.omit(res.body.result[2], 'created'), request.searchTermsForResource.response.result[2])
    should.equal(res.headers['x-page'], 1)
    should.equal(res.headers['x-per-page'], 3)
    should.equal(res.headers['x-total'], 3)
    should.equal(res.headers['x-total-pages'], 1)
  })

  it('search terms for resource using valid m2m token success', async () => {
    const res = await getRequest(`${searchUrl}?page=1&perPage=3`, token.m2mRead)
    should.deepEqual(_.omit(res.body.result[0], 'created'), request.searchTermsForResource.response.result[0])
    should.deepEqual(_.omit(res.body.result[1], 'created'), request.searchTermsForResource.response.result[1])
    should.deepEqual(_.omit(res.body.result[2], 'created'), request.searchTermsForResource.response.result[2])
    should.equal(res.headers['x-page'], 1)
    should.equal(res.headers['x-per-page'], 3)
    should.equal(res.headers['x-total'], 3)
    should.equal(res.headers['x-total-pages'], 1)
  })

  it('failure - search terms for resource invalid parameter', async () => {
    try {
      await getRequest(`${searchUrl}?page=1&perPage=2&invalid=test`, token.user1)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 400)
      should.equal(_.get(err, 'response.body.message'), '"invalid" is not allowed')
    }
  })

  it('failure - search terms for resource no token', async () => {
    try {
      await getRequest(`${searchUrl}?page=1&perPage=2&invalid=test`)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 401)
      should.equal(_.get(err, 'response.body.message'), 'No token provided.')
    }
  })

  it('failure - search terms for resource invalid token', async () => {
    try {
      await getRequest(`${searchUrl}?page=1&perPage=2`, 'invalid')
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 401)
      should.equal(_.get(err, 'response.body.message'), 'Invalid Token.')
    }
  })

  it('failure - search terms for resource forbidden', async () => {
    try {
      await getRequest(`${searchUrl}?page=1&perPage=2`, token.user2)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 403)
      should.equal(_.get(err, 'response.body.message'), 'You are not allowed to perform this action!')
    }
  })

  it('failure - search terms for resource forbidden m2m token', async () => {
    try {
      await getRequest(`${searchUrl}?page=1&perPage=2&invalid=test`, token.m2mWrite)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 403)
      should.equal(_.get(err, 'response.body.message'), 'You are not allowed to perform this action!')
    }
  })

  it('check terms for resource success, single tag', async () => {
    const res = await getRequest(`${checkUrl}/8547899/reference?reference=challenge&referenceId=12345&tags=submitter`, token.user1)
    should.deepEqual(res.body, request.checkTermsForResource.singleTag.response)
  })

  it('check terms for resource using m2m token success, single tag', async () => {
    const res = await getRequest(`${checkUrl}/8547899/reference?reference=challenge&referenceId=12345&tags=submitter`, token.m2mRead)
    should.deepEqual(res.body, request.checkTermsForResource.singleTag.response)
  })

  it('check terms for resource success, multiple tags', async () => {
    const res = await getRequest(`${checkUrl}/151743/reference?reference=challenge&referenceId=12345&tags=submitter&tags=copilot`, token.user1)
    should.deepEqual(res.body, request.checkTermsForResource.multipleTags.response)
  })

  it('failure - check terms for resource with incorrect criteria', async () => {
    try {
      await getRequest(`${checkUrl}/151743/reference?reference=challenge&referenceId=12345&tags=submitter&tags=copilot&tags=invalid1&tags=invalid2`, token.user1)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 400)
      should.equal(_.get(err, 'response.body.message'), 'No terms for resouce exist with Reference(challenge) and ReferenceId(12345) for the following tags: [ \'invalid1\', \'invalid2\' ]')
    }
  })

  it('failure - check terms for resource no token', async () => {
    try {
      await getRequest(`${checkUrl}/151743/reference?reference=challenge&referenceId=12345&tags=submitter&tags=copilot`)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 401)
      should.equal(_.get(err, 'response.body.message'), 'No token provided.')
    }
  })

  it('failure - check terms for resource invalid token', async () => {
    try {
      await getRequest(`${checkUrl}/151743/reference?reference=challenge&referenceId=12345&tags=submitter&tags=copilot`, 'invalid')
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 401)
      should.equal(_.get(err, 'response.body.message'), 'Invalid Token.')
    }
  })

  it('failure - check terms for resource forbidden', async () => {
    try {
      await getRequest(`${checkUrl}/151743/reference?reference=challenge&referenceId=12345&tags=submitter&tags=copilot`, token.user2)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 403)
      should.equal(_.get(err, 'response.body.message'), 'You are not allowed to perform this action!')
    }
  })

  it('failure - check terms for resource using forbidden m2m token', async () => {
    try {
      await getRequest(`${checkUrl}/151743/reference?reference=challenge&referenceId=12345&tags=submitter&tags=copilot`, token.m2mWrite)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 403)
      should.equal(_.get(err, 'response.body.message'), 'You are not allowed to perform this action!')
    }
  })
})
