/**
 * E2E test of the get/delete terms for resource endpoint.
 */

const _ = require('lodash')
const config = require('config')
const should = require('should')
const models = require('../../src/models')
const termsOfUseIdsMapping = require('../../src/test-data').termsOfUseIdsMapping

const { token } = require('../common/testData')
const { getRequest, deleteRequest, clearLogs } = require('../common/testHelper')

const TermsForResource = models.TermsForResource

const url = `http://localhost:${config.PORT}/terms/reference`

module.exports = describe('get and delete terms for resource endpoint', () => {
  beforeEach(() => {
    clearLogs()
  })

  const id = 'a41d1974-5823-473e-bacb-7eed17500ad1'
  const id2 = 'a41d1974-5823-473e-bacb-7eed17500ad2'
  const notFoundId = 'b41d1974-5823-473e-bacb-7eed17500ad1'

  it('Get terms for resource success', async () => {
    const res = await getRequest(`${url}/${id}`, token.user1)
    should.equal(res.body.reference, 'new-reference')
    should.equal(res.body.referenceId, '11111')
    should.equal(res.body.tag, 'tester')
    should.equal(res.body.termsOfUseIds.length, 1)
    should.equal(res.body.termsOfUseIds[0], termsOfUseIdsMapping[21305])
    should.equal(res.body.createdBy, 'admin')
    should.exist(res.body.created)
    should.equal(res.body.updatedBy, 'TonyJ')
    should.exist(res.body.updated)
  })

  it('Get terms for resource using m2m token success', async () => {
    const res = await getRequest(`${url}/${id}`, token.m2mRead)
    should.equal(res.body.reference, 'new-reference')
    should.equal(res.body.referenceId, '11111')
    should.equal(res.body.tag, 'tester')
    should.equal(res.body.termsOfUseIds.length, 1)
    should.equal(res.body.termsOfUseIds[0], termsOfUseIdsMapping[21305])
    should.equal(res.body.createdBy, 'admin')
    should.exist(res.body.created)
    should.equal(res.body.updatedBy, 'TonyJ')
    should.exist(res.body.updated)
  })

  it('Failure - get terms for resource no token', async () => {
    try {
      await getRequest(`${url}/invalid`)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 401)
      should.equal(_.get(err, 'response.body.message'), 'No token provided.')
    }
  })

  it('Failure - get terms for resource invalid token', async () => {
    try {
      await getRequest(`${url}/invalid`, 'invalid')
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 401)
      should.equal(_.get(err, 'response.body.message'), 'Invalid Token.')
    }
  })

  it('Failure - get terms for resource forbidden', async () => {
    try {
      await getRequest(`${url}/invalid`, token.user2)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 403)
      should.equal(_.get(err, 'response.body.message'), 'You are not allowed to perform this action!')
    }
  })

  it('Failure - get terms for resource using forbidden m2m token', async () => {
    try {
      await getRequest(`${url}/invalid`, token.m2mWrite)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 403)
      should.equal(_.get(err, 'response.body.message'), 'You are not allowed to perform this action!')
    }
  })

  it('Failure - get terms for resource with invalid id', async () => {
    try {
      await getRequest(`${url}/invalid`, token.user1)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 400)
      should.equal(_.get(err, 'response.body.message'), '"termsForResourceId" must be a valid GUID')
    }
  })

  it('Failure - get terms for resource not found', async () => {
    try {
      await getRequest(`${url}/${notFoundId}`, token.user1)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 404)
      should.equal(_.get(err, 'response.body.message'), `TermsForResource not found with id: ${notFoundId}`)
    }
  })

  it('Delete terms for resource success', async () => {
    const res = await deleteRequest(`${url}/${id}`, token.user1)
    should.equal(res.status, 204)
    const record = await TermsForResource.findOne({ where: { id }, raw: true })
    should.not.exist(record)
  })

  it('Delete terms for resource using m2m token success', async () => {
    const res = await deleteRequest(`${url}/${id2}`, token.m2mWrite)
    should.equal(res.status, 204)
    const record = await TermsForResource.findOne({ where: { id: id2 }, raw: true })
    should.not.exist(record)
  })

  it('Failure - delete terms for resource with invalid id', async () => {
    try {
      await deleteRequest(`${url}/invalid`, token.user1)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 400)
      should.equal(_.get(err, 'response.body.message'), '"termsForResourceId" must be a valid GUID')
    }
  })

  it('Failure - delete terms for resource not found', async () => {
    try {
      await deleteRequest(`${url}/${notFoundId}`, token.user1)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 404)
      should.equal(_.get(err, 'response.body.message'), `TermsForResource not found with id: ${notFoundId}`)
    }
  })

  it('Failure - delete terms for resource no token', async () => {
    try {
      await deleteRequest(`${url}/invalid`)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 401)
      should.equal(_.get(err, 'response.body.message'), 'No token provided.')
    }
  })

  it('Failure - delete terms for resource invalid token', async () => {
    try {
      await deleteRequest(`${url}/invalid`, 'invalid')
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 401)
      should.equal(_.get(err, 'response.body.message'), 'Invalid Token.')
    }
  })

  it('Failure - delete terms for resource forbidden', async () => {
    try {
      await deleteRequest(`${url}/invalid`, token.user2)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 403)
      should.equal(_.get(err, 'response.body.message'), 'You are not allowed to perform this action!')
    }
  })

  it('Failure - delete terms for resource using forbidden m2m token', async () => {
    try {
      await deleteRequest(`${url}/invalid`, token.m2mRead)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 403)
      should.equal(_.get(err, 'response.body.message'), 'You are not allowed to perform this action!')
    }
  })
})
