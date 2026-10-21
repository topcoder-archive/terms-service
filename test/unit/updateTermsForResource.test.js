/**
 * Unit test of TermsForResourceService - update terms for resource.
 */

const _ = require('lodash')
const should = require('should')
const service = require('../../src/services/TermsForResourceService')
const models = require('../../src/models')
const termsOfUseIdsMapping = require('../../src/test-data').termsOfUseIdsMapping

const { user, request } = require('../common/testData')
const { assertError, clearLogs } = require('../common/testHelper')

const TermsForResource = models.TermsForResource

module.exports = describe('update terms for resource', () => {
  beforeEach(() => {
    clearLogs()
  })

  const id1 = 'a41d1974-5823-473e-bacb-7eed17500ad1'
  const id2 = 'a41d1974-5823-473e-bacb-7eed17500ad2'
  const notFoundId = 'b41d1974-5823-473e-bacb-7eed17500ad1'

  it('fully update terms for resource success', async () => {
    const data = _.cloneDeep(request.updateTermsForResource.reqBody)
    await service.fullyUpdateTermsForResource(user.user1, id1, data)
    const record = await TermsForResource.findOne({ where: { id: id1 }, raw: true })
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
  })

  it('fully update terms for resource success using m2m', async () => {
    const data = _.cloneDeep(request.updateTermsForResource.reqBody)
    data.referenceId = '22222'
    data.tag = 'manager'
    await service.fullyUpdateTermsForResource(user.m2mWrite, id1, data)
    const record = await TermsForResource.findOne({ where: { id: id1 }, raw: true })
    should.equal(record.reference, 'new-reference')
    should.equal(record.referenceId, '22222')
    should.equal(record.tag, 'manager')
    should.equal(record.termsOfUseIds.length, 2)
    should.equal(record.termsOfUseIds[0], termsOfUseIdsMapping[21303])
    should.equal(record.termsOfUseIds[1], termsOfUseIdsMapping[21304])
    should.equal(record.createdBy, 'admin')
    should.exist(record.created)
    should.equal(record.updatedBy, user.m2mWrite.sub)
    should.exist(record.updated)
  })

  it('fully update terms for resource, change terms id success', async () => {
    const data = _.cloneDeep(request.updateTermsForResource.reqBody)
    data.termsOfUseIds = [termsOfUseIdsMapping[21305]]
    await service.fullyUpdateTermsForResource(user.user1, id1, data)
    const record = await TermsForResource.findOne({ where: { id: id1 }, raw: true })
    should.equal(record.reference, 'new-reference')
    should.equal(record.referenceId, '11111')
    should.equal(record.tag, 'tester')
    should.equal(record.termsOfUseIds.length, 1)
    should.equal(record.termsOfUseIds[0], termsOfUseIdsMapping[21305])
    should.equal(record.createdBy, 'admin')
    should.exist(record.created)
    should.equal(record.updatedBy, 'TonyJ')
    should.exist(record.updated)
  })

  it('failure - fully update terms for resource not found', async () => {
    const data = _.cloneDeep(request.updateTermsForResource.reqBody)
    try {
      await service.fullyUpdateTermsForResource(user.user1, notFoundId, data)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.name, 'NotFoundError')
      assertError(err, `TermsForResource not found with id: ${notFoundId}`)
    }
  })

  it('failure - fully update terms for resource duplicate', async () => {
    const data = _.cloneDeep(request.updateTermsForResource.reqBody)
    data.reference = 'challenge'
    data.referenceId = '12346'
    data.tag = 'copilot'
    try {
      await service.fullyUpdateTermsForResource(user.user1, id1, data)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.name, 'BadRequestError')
      assertError(err, 'Duplicate terms reference for tuple { reference: \'challenge\', referenceId: \'12346\', tag: \'copilot\' }')
    }
  })

  it('failure - fully update terms for resource invalid terms id', async () => {
    const data = _.cloneDeep(request.updateTermsForResource.reqBody)
    data.termsOfUseIds.push(termsOfUseIdsMapping['not-exist-1'])
    data.termsOfUseIds.push(termsOfUseIdsMapping['not-exist-2'])
    try {
      await service.fullyUpdateTermsForResource(user.user1, id1, data)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.name, 'BadRequestError')
      assertError(err, `The following terms doesn't exist: [ '${termsOfUseIdsMapping['not-exist-1']}', '${termsOfUseIdsMapping['not-exist-2']}' ]`)
    }
  })

  it('partially update terms for resource using m2m success', async () => {
    let data = _.cloneDeep(request.updateTermsForResource.reqBody)
    data = _.omit(data, 'tag', 'termsOfUseIds')
    data.reference = 'test-m2m-reference'
    await service.partiallyUpdateTermsForResource(user.m2mWrite, id2, data)
    const record = await TermsForResource.findOne({ where: { id: id2 }, raw: true })
    should.equal(record.reference, 'test-m2m-reference')
    should.equal(record.referenceId, '11111')
    should.equal(record.tag, 'copilot')
    should.equal(record.termsOfUseIds.length, 1)
    should.equal(record.termsOfUseIds[0], termsOfUseIdsMapping[21307])
    should.equal(record.createdBy, 'admin')
    should.exist(record.created)
    should.equal(record.updatedBy, user.m2mWrite.sub)
    should.exist(record.updated)
  })

  it('partially update terms for resource success', async () => {
    let data = _.cloneDeep(request.updateTermsForResource.reqBody)
    data = _.omit(data, 'tag', 'termsOfUseIds')
    await service.partiallyUpdateTermsForResource(user.user1, id2, data)
    const record = await TermsForResource.findOne({ where: { id: id2 }, raw: true })
    should.equal(record.reference, 'new-reference')
    should.equal(record.referenceId, '11111')
    should.equal(record.tag, 'copilot')
    should.equal(record.termsOfUseIds.length, 1)
    should.equal(record.termsOfUseIds[0], termsOfUseIdsMapping[21307])
    should.equal(record.createdBy, 'admin')
    should.exist(record.created)
    should.equal(record.updatedBy, 'TonyJ')
    should.exist(record.updated)
  })

  it('failure - partially update terms for resource duplicate', async () => {
    try {
      await service.partiallyUpdateTermsForResource(user.user1, id2, {
        reference: 'challenge',
        referenceId: '12346',
        tag: 'copilot'
      })
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.name, 'BadRequestError')
      assertError(err, 'Duplicate terms reference for tuple { reference: \'challenge\', referenceId: \'12346\', tag: \'copilot\' }')
    }
  })

  it('failure - partially update terms for resource invalid terms id', async () => {
    try {
      await service.partiallyUpdateTermsForResource(user.user1, id2, {
        termsOfUseIds: [termsOfUseIdsMapping['not-exist-1'], termsOfUseIdsMapping['not-exist-2']]
      })
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.name, 'BadRequestError')
      assertError(err, `The following terms doesn't exist: [ '${termsOfUseIdsMapping['not-exist-1']}', '${termsOfUseIdsMapping['not-exist-2']}' ]`)
    }
  })

  it('failure - partially update terms for resource not found', async () => {
    const data = _.cloneDeep(request.updateTermsForResource.reqBody)
    try {
      await service.partiallyUpdateTermsForResource(user.user1, notFoundId, data)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.name, 'NotFoundError')
      assertError(err, `TermsForResource not found with id: ${notFoundId}`)
    }
  })
})
