/**
 * E2E test of the create terms for resource endpoint.
 */

const _ = require('lodash')
const config = require('config')
const should = require('should')
const models = require('../../src/models')
const termsOfUseIdsMapping = require('../../src/test-data').termsOfUseIdsMapping

const { user, token, request } = require('../common/testData')
const { postRequest, clearLogs, assertInfoMessage } = require('../common/testHelper')

const TermsForResource = models.TermsForResource

const url = `http://localhost:${config.PORT}/terms/reference`

module.exports = describe('create terms for resource endpoint', () => {
  beforeEach(() => {
    clearLogs()
  })

  it('create terms for resource success', async () => {
    const data = _.cloneDeep(request.createTermsForResource.reqBody)
    const res = await postRequest(url, data, token.user1)
    const record = await TermsForResource.findOne({ where: { id: res.body.id }, raw: true })
    should.equal(record.reference, 'challenge')
    should.equal(record.referenceId, '12346')
    should.equal(record.tag, 'copilot')
    should.equal(record.termsOfUseIds.length, 1)
    should.equal(record.termsOfUseIds[0], termsOfUseIdsMapping[21307])
    should.equal(record.createdBy, 'TonyJ')
    should.exist(record.created)
    should.equal(res.body.reference, 'challenge')
    should.equal(res.body.referenceId, '12346')
    should.equal(res.body.tag, 'copilot')
    should.equal(res.body.termsOfUseIds.length, 1)
    should.equal(res.body.termsOfUseIds[0], termsOfUseIdsMapping[21307])
    should.equal(res.body.createdBy, 'TonyJ')
    should.exist(res.body.created)
    assertInfoMessage(`Publish event to Kafka topic ${config.RESOURCE_TERMS_CREATE_TOPIC}`)
  })

  it('create terms for resource using m2m token success', async () => {
    const data = _.cloneDeep(request.createTermsForResource.reqBody)
    data.tag = 'manager'
    const res = await postRequest(url, data, token.m2mWrite)
    const record = await TermsForResource.findOne({ where: { id: res.body.id }, raw: true })
    should.equal(record.reference, 'challenge')
    should.equal(record.referenceId, '12346')
    should.equal(record.tag, 'manager')
    should.equal(record.termsOfUseIds.length, 1)
    should.equal(record.termsOfUseIds[0], termsOfUseIdsMapping[21307])
    should.equal(record.createdBy, user.m2mWrite.sub)
    should.exist(record.created)
    should.equal(res.body.reference, 'challenge')
    should.equal(res.body.referenceId, '12346')
    should.equal(res.body.tag, 'manager')
    should.equal(res.body.termsOfUseIds.length, 1)
    should.equal(res.body.termsOfUseIds[0], termsOfUseIdsMapping[21307])
    should.equal(res.body.createdBy, user.m2mWrite.sub)
    should.exist(res.body.created)
    assertInfoMessage(`Publish event to Kafka topic ${config.RESOURCE_TERMS_CREATE_TOPIC}`)
  })

  it('failure - create terms for resource again, duplicate', async () => {
    const data = _.cloneDeep(request.createTermsForResource.reqBody)
    try {
      await postRequest(url, data, token.user1)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 400)
      should.equal(_.get(err, 'response.body.message'), 'Duplicate terms reference for tuple { reference: \'challenge\', referenceId: \'12346\', tag: \'copilot\' }')
    }
  })

  it('failure - create terms for resource again, invalid terms id', async () => {
    const data = _.cloneDeep(request.createTermsForResource.reqBody)
    data.referenceId = '10000'
    data.termsOfUseIds.push(termsOfUseIdsMapping['not-exist-1'])
    data.termsOfUseIds.push(termsOfUseIdsMapping['not-exist-2'])
    try {
      await postRequest(url, data, token.user1)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 400)
      should.equal(_.get(err, 'response.body.message'),
        `The following terms doesn't exist: [ '${termsOfUseIdsMapping['not-exist-1']}', '${termsOfUseIdsMapping['not-exist-2']}' ]`)
    }
  })

  for (const requiredField of request.createTermsForResource.requiredFields) {
    it(`test invalid parameters, required field ${requiredField} is missing`, async () => {
      let data = _.cloneDeep(request.createTermsForResource.reqBody)
      data = _.omit(data, requiredField)
      try {
        await postRequest(url, data, token.user1)
        throw new Error('should not throw error here')
      } catch (err) {
        should.equal(err.status, 400)
        should.equal(_.get(err, 'response.body.message'), `"${requiredField}" is required`)
      }
    })
  }

  it('failure - create terms for resource no token', async () => {
    const data = _.cloneDeep(request.createTermsForResource.reqBody)
    try {
      await postRequest(url, data)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 401)
      should.equal(_.get(err, 'response.body.message'), 'No token provided.')
    }
  })

  it('failure - create terms for resource invalid token', async () => {
    const data = _.cloneDeep(request.createTermsForResource.reqBody)
    try {
      await postRequest(url, data, 'invalid')
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 401)
      should.equal(_.get(err, 'response.body.message'), 'Invalid Token.')
    }
  })

  it('failure - create terms for resource forbidden', async () => {
    const data = _.cloneDeep(request.createTermsForResource.reqBody)
    try {
      await postRequest(url, data, token.user2)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 403)
      should.equal(_.get(err, 'response.body.message'), 'You are not allowed to perform this action!')
    }
  })

  it('failure - create terms for resource using forbidden m2m token', async () => {
    const data = _.cloneDeep(request.createTermsForResource.reqBody)
    try {
      await postRequest(url, data, token.m2mRead)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 403)
      should.equal(_.get(err, 'response.body.message'), 'You are not allowed to perform this action!')
    }
  })
})
