/**
 * E2E test of the update terms for resource endpoint.
 */

const _ = require('lodash')
const config = require('config')
const should = require('should')
const models = require('../../src/models')
const termsOfUseIdsMapping = require('../../src/test-data').termsOfUseIdsMapping

const { user, token, request } = require('../common/testData')
const { putRequest, patchRequest, clearLogs } = require('../common/testHelper')

const TermsForResource = models.TermsForResource

const url = `http://localhost:${config.PORT}/terms/reference`

module.exports = describe('update terms for resource endpoint', () => {
  beforeEach(() => {
    clearLogs()
  })

  const id1 = 'a41d1974-5823-473e-bacb-7eed17500ad1'
  const id2 = 'a41d1974-5823-473e-bacb-7eed17500ad2'
  const notFoundId = 'b41d1974-5823-473e-bacb-7eed17500ad1'

  it('fully update terms for resource using m2m token success', async () => {
    const data = _.cloneDeep(request.updateTermsForResource.reqBody)
    data.tag = 'm2m-test'
    const res = await putRequest(`${url}/${id1}`, data, token.m2mWrite)
    const record = await TermsForResource.findOne({ where: { id: res.body.id }, raw: true })
    should.equal(record.reference, 'new-reference')
    should.equal(record.referenceId, '11111')
    should.equal(record.tag, 'm2m-test')
    should.equal(record.termsOfUseIds.length, 2)
    should.equal(record.termsOfUseIds[0], termsOfUseIdsMapping[21303])
    should.equal(record.termsOfUseIds[1], termsOfUseIdsMapping[21304])
    should.equal(record.createdBy, 'admin')
    should.exist(record.created)
    should.equal(record.updatedBy, user.m2mWrite.sub)
    should.exist(record.updated)
    should.equal(res.body.reference, 'new-reference')
    should.equal(res.body.referenceId, '11111')
    should.equal(res.body.tag, 'm2m-test')
    should.equal(res.body.termsOfUseIds.length, 2)
    should.equal(res.body.termsOfUseIds[0], termsOfUseIdsMapping[21303])
    should.equal(res.body.termsOfUseIds[1], termsOfUseIdsMapping[21304])
    should.equal(res.body.createdBy, 'admin')
    should.exist(res.body.created)
    should.equal(res.body.updatedBy, user.m2mWrite.sub)
    should.exist(res.body.updated)
  })

  it('fully update terms for resource success', async () => {
    const data = _.cloneDeep(request.updateTermsForResource.reqBody)
    const res = await putRequest(`${url}/${id1}`, data, token.user1)
    const record = await TermsForResource.findOne({ where: { id: res.body.id }, raw: true })
    should.equal(record.reference, 'new-reference')
    should.equal(record.referenceId, '11111')
    should.equal(record.tag, 'tester')
    should.equal(record.termsOfUseIds.length, 2)
    should.equal(record.termsOfUseIds[0], termsOfUseIdsMapping[21303])
    should.equal(record.termsOfUseIds[1], termsOfUseIdsMapping[21304])
    should.equal(record.createdBy, 'admin')
    should.exist(record.created)
    should.equal(record.updatedBy, 'TonyJ')
    should.exist(record.updated)
    should.equal(res.body.reference, 'new-reference')
    should.equal(res.body.referenceId, '11111')
    should.equal(res.body.tag, 'tester')
    should.equal(res.body.termsOfUseIds.length, 2)
    should.equal(res.body.termsOfUseIds[0], termsOfUseIdsMapping[21303])
    should.equal(res.body.termsOfUseIds[1], termsOfUseIdsMapping[21304])
    should.equal(res.body.createdBy, 'admin')
    should.exist(res.body.created)
    should.equal(res.body.updatedBy, 'TonyJ')
    should.exist(res.body.updated)
  })

  it('fully update terms for resource, change terms id success', async () => {
    const data = _.cloneDeep(request.updateTermsForResource.reqBody)
    data.termsOfUseIds = [termsOfUseIdsMapping[21305]]
    const res = await putRequest(`${url}/${id1}`, data, token.user1)
    const record = await TermsForResource.findOne({ where: { id: res.body.id }, raw: true })
    should.equal(record.reference, 'new-reference')
    should.equal(record.referenceId, '11111')
    should.equal(record.tag, 'tester')
    should.equal(record.termsOfUseIds.length, 1)
    should.equal(record.termsOfUseIds[0], termsOfUseIdsMapping[21305])
    should.equal(record.createdBy, 'admin')
    should.exist(record.created)
    should.equal(record.updatedBy, 'TonyJ')
    should.exist(record.updated)
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

  it('failure - fully update terms for resource no token', async () => {
    const data = _.cloneDeep(request.updateTermsForResource.reqBody)
    try {
      await putRequest(`${url}/${id1}`, data)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 401)
      should.equal(_.get(err, 'response.body.message'), 'No token provided.')
    }
  })

  it('failure - fully update terms for resource invalid token', async () => {
    const data = _.cloneDeep(request.updateTermsForResource.reqBody)
    try {
      await putRequest(`${url}/${id1}`, data, 'invalid')
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 401)
      should.equal(_.get(err, 'response.body.message'), 'Invalid Token.')
    }
  })

  it('failure - fully update terms for resource forbidden', async () => {
    const data = _.cloneDeep(request.updateTermsForResource.reqBody)
    try {
      await putRequest(`${url}/${id1}`, data, token.user2)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 403)
      should.equal(_.get(err, 'response.body.message'), 'You are not allowed to perform this action!')
    }
  })

  it('failure - fully update terms for resource using forbidden m2m token', async () => {
    const data = _.cloneDeep(request.updateTermsForResource.reqBody)
    try {
      await putRequest(`${url}/${id1}`, data, token.m2mRead)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 403)
      should.equal(_.get(err, 'response.body.message'), 'You are not allowed to perform this action!')
    }
  })

  it('failure - fully update terms for resource not found', async () => {
    const data = _.cloneDeep(request.updateTermsForResource.reqBody)
    try {
      await putRequest(`${url}/${notFoundId}`, data, token.user1)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 404)
      should.equal(_.get(err, 'response.body.message'), `TermsForResource not found with id: ${notFoundId}`)
    }
  })

  it('failure - fully update terms for resource duplicate', async () => {
    const data = _.cloneDeep(request.updateTermsForResource.reqBody)
    data.reference = 'challenge'
    data.referenceId = '12346'
    data.tag = 'copilot'
    try {
      await putRequest(`${url}/${id1}`, data, token.user1)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 400)
      should.equal(_.get(err, 'response.body.message'), 'Duplicate terms reference for tuple { reference: \'challenge\', referenceId: \'12346\', tag: \'copilot\' }')
    }
  })

  it('failure - fully update terms for resource invalid terms id', async () => {
    const data = _.cloneDeep(request.updateTermsForResource.reqBody)
    data.termsOfUseIds.push(termsOfUseIdsMapping['not-exist-1'])
    data.termsOfUseIds.push(termsOfUseIdsMapping['not-exist-2'])
    try {
      await putRequest(`${url}/${id1}`, data, token.user1)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 400)
      should.equal(_.get(err, 'response.body.message'),
        `The following terms doesn't exist: [ '${termsOfUseIdsMapping['not-exist-1']}', '${termsOfUseIdsMapping['not-exist-2']}' ]`)
    }
  })

  for (const requiredField of request.updateTermsForResource.requiredFields) {
    it(`test invalid parameters, required field ${requiredField} is missing`, async () => {
      let data = _.cloneDeep(request.createTermsForResource.reqBody)
      data = _.omit(data, requiredField)
      try {
        await putRequest(`${url}/${id1}`, data, token.user1)
        throw new Error('should not throw error here')
      } catch (err) {
        should.equal(err.status, 400)
        should.equal(_.get(err, 'response.body.message'), `"${requiredField}" is required`)
      }
    })
  }

  it('partially update terms for resource using m2m token success', async () => {
    let data = _.cloneDeep(request.updateTermsForResource.reqBody)
    data = _.omit(data, 'tag', 'termsOfUseIds')
    data.reference = 'm2m-reference'
    const res = await patchRequest(`${url}/${id2}`, data, token.m2mWrite)
    const record = await TermsForResource.findOne({ where: { id: res.body.id }, raw: true })
    should.equal(record.reference, 'm2m-reference')
    should.equal(record.referenceId, '11111')
    should.equal(record.tag, 'copilot')
    should.equal(record.termsOfUseIds.length, 1)
    should.equal(record.termsOfUseIds[0], termsOfUseIdsMapping[21307])
    should.equal(record.createdBy, 'admin')
    should.exist(record.created)
    should.equal(record.updatedBy, user.m2mWrite.sub)
    should.exist(record.updated)
    should.equal(res.body.reference, 'm2m-reference')
    should.equal(res.body.referenceId, '11111')
    should.equal(res.body.tag, 'copilot')
    should.equal(res.body.termsOfUseIds.length, 1)
    should.equal(res.body.termsOfUseIds[0], termsOfUseIdsMapping[21307])
    should.equal(res.body.createdBy, 'admin')
    should.exist(res.body.created)
    should.equal(res.body.updatedBy, user.m2mWrite.sub)
    should.exist(res.body.updated)
  })

  it('partially update terms for resource success', async () => {
    let data = _.cloneDeep(request.updateTermsForResource.reqBody)
    data = _.omit(data, 'tag', 'termsOfUseIds')
    const res = await patchRequest(`${url}/${id2}`, data, token.user1)
    const record = await TermsForResource.findOne({ where: { id: res.body.id }, raw: true })
    should.equal(record.reference, 'new-reference')
    should.equal(record.referenceId, '11111')
    should.equal(record.tag, 'copilot')
    should.equal(record.termsOfUseIds.length, 1)
    should.equal(record.termsOfUseIds[0], termsOfUseIdsMapping[21307])
    should.equal(record.createdBy, 'admin')
    should.exist(record.created)
    should.equal(record.updatedBy, 'TonyJ')
    should.exist(record.updated)
    should.equal(res.body.reference, 'new-reference')
    should.equal(res.body.referenceId, '11111')
    should.equal(res.body.tag, 'copilot')
    should.equal(res.body.termsOfUseIds.length, 1)
    should.equal(res.body.termsOfUseIds[0], termsOfUseIdsMapping[21307])
    should.equal(res.body.createdBy, 'admin')
    should.exist(res.body.created)
    should.equal(res.body.updatedBy, 'TonyJ')
    should.exist(res.body.updated)
  })

  it('failure - partially update terms for resource no token', async () => {
    const data = _.cloneDeep(request.updateTermsForResource.reqBody)
    try {
      await patchRequest(`${url}/${id1}`, data)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 401)
      should.equal(_.get(err, 'response.body.message'), 'No token provided.')
    }
  })

  it('failure - partially update terms for resource invalid token', async () => {
    const data = _.cloneDeep(request.updateTermsForResource.reqBody)
    try {
      await patchRequest(`${url}/${id1}`, data, 'invalid')
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 401)
      should.equal(_.get(err, 'response.body.message'), 'Invalid Token.')
    }
  })

  it('failure - partially update terms for resource forbidden', async () => {
    const data = _.cloneDeep(request.updateTermsForResource.reqBody)
    try {
      await patchRequest(`${url}/${id1}`, data, token.user2)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 403)
      should.equal(_.get(err, 'response.body.message'), 'You are not allowed to perform this action!')
    }
  })

  it('failure - partially update terms for resource using forbidden m2m token', async () => {
    const data = _.cloneDeep(request.updateTermsForResource.reqBody)
    try {
      await patchRequest(`${url}/${id1}`, data, token.m2mRead)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 403)
      should.equal(_.get(err, 'response.body.message'), 'You are not allowed to perform this action!')
    }
  })

  it('failure - partially update terms for resource duplicate', async () => {
    try {
      await patchRequest(`${url}/${id2}`,
        { reference: 'challenge', referenceId: '12346', tag: 'copilot' }, token.user1)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 400)
      should.equal(_.get(err, 'response.body.message'), 'Duplicate terms reference for tuple { reference: \'challenge\', referenceId: \'12346\', tag: \'copilot\' }')
    }
  })

  it('failure - partially update terms for resource invalid terms id', async () => {
    try {
      await patchRequest(`${url}/${id2}`,
        { termsOfUseIds: [termsOfUseIdsMapping['not-exist-1'], termsOfUseIdsMapping['not-exist-2']] }, token.user1)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 400)
      should.equal(_.get(err, 'response.body.message'),
        `The following terms doesn't exist: [ '${termsOfUseIdsMapping['not-exist-1']}', '${termsOfUseIdsMapping['not-exist-2']}' ]`)
    }
  })

  it('failure - partially update terms for resource not found', async () => {
    const data = _.cloneDeep(request.updateTermsForResource.reqBody)
    try {
      await patchRequest(`${url}/${notFoundId}`, data, token.user1)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 404)
      should.equal(_.get(err, 'response.body.message'), `TermsForResource not found with id: ${notFoundId}`)
    }
  })
})
