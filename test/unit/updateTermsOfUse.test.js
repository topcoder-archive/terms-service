/**
 * Unit test of TermsOfUseService - update terms of use.
 */

const _ = require('lodash')
const should = require('should')
const service = require('../../src/services/TermsOfUseService')
const models = require('../../src/models')
const { termsOfUseIdsMapping, agreeabilityTypeIdsMapping } = require('../../src/test-data')
const { AGREE_FOR_DOCUSIGN_TEMPLATE } = require('../../app-constants')

const { user, request } = require('../common/testData')
const { assertError, assertValidationError, clearLogs } = require('../common/testHelper')

const TermsOfUse = models.TermsOfUse
const TermsOfUseDocusignTemplateXref = models.TermsOfUseDocusignTemplateXref

module.exports = describe('update terms of use', () => {
  beforeEach(() => {
    clearLogs()
  })

  const id1 = termsOfUseIdsMapping[30000]
  const id2 = termsOfUseIdsMapping[30001]
  const id3 = termsOfUseIdsMapping[30002]

  it('fully update terms of use using m2m token success', async () => {
    const data = _.cloneDeep(request.updateTermsOfUse.reqBody)
    data.text = 'm2m-text'
    data.title = 'm2m-title'
    await service.fullyUpdateTermsOfUse(user.m2mWrite, id1, data)
    const record = await TermsOfUse.findOne({ where: { id: id1, deletedAt: null }, raw: true })
    should.equal(record.text, 'm2m-text')
    should.equal(record.typeId, 11)
    should.equal(record.title, 'm2m-title')
    should.equal(record.url, 'update-url')
    should.equal(record.agreeabilityTypeId, agreeabilityTypeIdsMapping[4])
    should.equal(record.updatedBy, user.m2mWrite.sub)
    const existed = await TermsOfUseDocusignTemplateXref.findAll({ where: { termsOfUseId: id1 }, raw: true })
    should.equal(existed.length, 1)
    should.equal(existed[0].docusignTemplateId, 'update-test-template-1')
  })

  it('fully update terms of use, adding docusign template success', async () => {
    const data = _.cloneDeep(request.updateTermsOfUse.reqBody)
    await service.fullyUpdateTermsOfUse(user.user1, id1, data)
    const record = await TermsOfUse.findOne({ where: { id: id1, deletedAt: null }, raw: true })
    should.equal(record.text, 'update-text')
    should.equal(record.typeId, 11)
    should.equal(record.title, 'update-title')
    should.equal(record.url, 'update-url')
    should.equal(record.agreeabilityTypeId, agreeabilityTypeIdsMapping[4])
    const existed = await TermsOfUseDocusignTemplateXref.findAll({ where: { termsOfUseId: id1 }, raw: true })
    should.equal(existed.length, 1)
    should.equal(existed[0].docusignTemplateId, 'update-test-template-1')
  })

  it('fully update terms of use, updating docusign template success', async () => {
    const data = _.cloneDeep(request.updateTermsOfUse.reqBody)
    data.docusignTemplateId = 'new-template-id'
    await service.fullyUpdateTermsOfUse(user.user1, id1, data)
    const record = await TermsOfUse.findOne({ where: { id: id1, deletedAt: null }, raw: true })
    should.equal(record.text, 'update-text')
    should.equal(record.typeId, 11)
    should.equal(record.title, 'update-title')
    should.equal(record.url, 'update-url')
    should.equal(record.agreeabilityTypeId, agreeabilityTypeIdsMapping[4])
    const existed = await TermsOfUseDocusignTemplateXref.findAll({ where: { termsOfUseId: id1 }, raw: true })
    should.equal(existed.length, 1)
    should.equal(existed[0].docusignTemplateId, 'new-template-id')
  })

  it('fully update terms of use, removing docusign template success', async () => {
    let data = _.cloneDeep(request.updateTermsOfUse.reqBody)
    data = _.omit(data, 'text', 'url', 'docusignTemplateId')
    data.agreeabilityTypeId = agreeabilityTypeIdsMapping[3]
    await service.fullyUpdateTermsOfUse(user.user1, id1, data)
    const record = await TermsOfUse.findOne({ where: { id: id1, deletedAt: null }, raw: true })
    should.not.exist(record.text)
    should.equal(record.typeId, 11)
    should.equal(record.title, 'update-title')
    should.not.exist(record.url)
    should.equal(record.agreeabilityTypeId, agreeabilityTypeIdsMapping[3])
    const existed = await TermsOfUseDocusignTemplateXref.findAll({ where: { termsOfUseId: id1 }, raw: true })
    should.equal(existed.length, 0)
  })

  it('failure - fully update terms of use, docusign template missing', async () => {
    let data = _.cloneDeep(request.updateTermsOfUse.reqBody)
    data.agreeabilityTypeId = AGREE_FOR_DOCUSIGN_TEMPLATE
    data = _.omit(data, 'docusignTemplateId')
    try {
      await service.fullyUpdateTermsOfUse(user.user1, id1, data)
      throw new Error('should not throw error here')
    } catch (err) {
      assertValidationError(err, '"docusignTemplateId" is required')
    }
  })

  it('failure - fully update terms of use not found', async () => {
    const data = _.cloneDeep(request.updateTermsOfUse.reqBody)
    try {
      await service.fullyUpdateTermsOfUse(user.user1, termsOfUseIdsMapping['not-exist-1'], data)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.name, 'NotFoundError')
      assertError(err, `TermsOfUse not found with id: ${termsOfUseIdsMapping['not-exist-1']}`)
    }
  })

  it('failure - partially update terms of use, docusign template missing', async () => {
    let data = _.cloneDeep(request.updateTermsOfUse.reqBody)
    data.agreeabilityTypeId = AGREE_FOR_DOCUSIGN_TEMPLATE
    data = _.omit(data, 'docusignTemplateId')
    try {
      await service.partiallyUpdateTermsOfUse(user.user1, id1, data)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.name, 'BadRequestError')
      assertError(err, 'Docusign template id is missing.')
    }
  })

  it('failure - partially update terms of use not found', async () => {
    let data = _.cloneDeep(request.updateTermsOfUse.reqBody)
    data = _.omit(data, 'agreeabilityTypeId')
    try {
      await service.partiallyUpdateTermsOfUse(user.user1, termsOfUseIdsMapping['not-exist-1'], data)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.name, 'NotFoundError')
      assertError(err, `TermsOfUse not found with id: ${termsOfUseIdsMapping['not-exist-1']}`)
    }
  })

  it('partially update terms of use using m2m token success', async () => {
    await service.partiallyUpdateTermsOfUse(user.m2mWrite, id1, { url: 'm2m-url' })
    const record = await TermsOfUse.findOne({ where: { id: id1, deletedAt: null }, raw: true })
    should.not.exist(record.text)
    should.equal(record.typeId, 11)
    should.equal(record.title, 'update-title')
    should.equal(record.url, 'm2m-url')
    should.equal(record.agreeabilityTypeId, agreeabilityTypeIdsMapping[3])
    should.equal(record.updatedBy, user.m2mWrite.sub)
    const existed = await TermsOfUseDocusignTemplateXref.findAll({ where: { termsOfUseId: id1 }, raw: true })
    should.equal(existed.length, 0)
  })

  it('partially update terms of use, adding docusign template success', async () => {
    let data = _.cloneDeep(request.updateTermsOfUse.reqBody)
    data = _.pick(data, 'url', 'agreeabilityTypeId', 'docusignTemplateId')
    await service.partiallyUpdateTermsOfUse(user.user1, id1, data)
    const record = await TermsOfUse.findOne({ where: { id: id1, deletedAt: null }, raw: true })
    should.not.exist(record.text)
    should.equal(record.typeId, 11)
    should.equal(record.title, 'update-title')
    should.equal(record.url, 'update-url')
    should.equal(record.agreeabilityTypeId, agreeabilityTypeIdsMapping[4])
    const existed = await TermsOfUseDocusignTemplateXref.findAll({ where: { termsOfUseId: id1 }, raw: true })
    should.equal(existed.length, 1)
    should.equal(existed[0].docusignTemplateId, 'update-test-template-1')
  })

  it('partially update terms of use, changing agreeabilityTypeId into docusign success', async () => {
    await service.partiallyUpdateTermsOfUse(user.user1, id3, { agreeabilityTypeId: agreeabilityTypeIdsMapping[4] })
    const record = await TermsOfUse.findOne({ where: { id: id3, deletedAt: null }, raw: true })
    should.equal(record.agreeabilityTypeId, agreeabilityTypeIdsMapping[4])
    const existed = await TermsOfUseDocusignTemplateXref.findAll({ where: { termsOfUseId: id1 }, raw: true })
    should.equal(existed.length, 1)
  })

  it('partially update terms of use, changing agreeabilityTypeId into electronically success', async () => {
    await service.partiallyUpdateTermsOfUse(user.user1, id2, { agreeabilityTypeId: agreeabilityTypeIdsMapping[3] })
    const record = await TermsOfUse.findOne({ where: { id: id2, deletedAt: null }, raw: true })
    should.equal(record.agreeabilityTypeId, agreeabilityTypeIdsMapping[3])
    // docusign template xref is not deleted under partially update
    const existed = await TermsOfUseDocusignTemplateXref.findAll({ where: { termsOfUseId: id1 }, raw: true })
    should.equal(existed.length, 1)
  })
})
