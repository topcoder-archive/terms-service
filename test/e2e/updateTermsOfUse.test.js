/**
 * E2E test of the update terms of use endpoint.
 */

const _ = require('lodash')
const config = require('config')
const should = require('should')
const models = require('../../src/models')
const { termsOfUseIdsMapping, agreeabilityTypeIdsMapping } = require('../../src/test-data')
const { AGREE_FOR_DOCUSIGN_TEMPLATE } = require('../../app-constants')

const { user, token, request } = require('../common/testData')
const { putRequest, patchRequest, clearLogs } = require('../common/testHelper')

const TermsOfUse = models.TermsOfUse
const TermsOfUseDocusignTemplateXref = models.TermsOfUseDocusignTemplateXref

const url = `http://localhost:${config.PORT}/terms`

module.exports = describe('update terms of use endpoint', () => {
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
    const res = await putRequest(`${url}/${id1}`, data, token.m2mWrite)
    const record = await TermsOfUse.findOne({ where: { id: id1, deletedAt: null }, raw: true })
    should.equal(record.text, 'm2m-text')
    should.equal(record.typeId, 11)
    should.equal(record.title, 'm2m-title')
    should.equal(record.url, 'update-url')
    should.equal(record.updatedBy, user.m2mWrite.sub)
    should.equal(record.agreeabilityTypeId, agreeabilityTypeIdsMapping[4])
    const existed = await TermsOfUseDocusignTemplateXref.findAll({ where: { termsOfUseId: id1 }, raw: true })
    should.equal(existed.length, 1)
    should.equal(existed[0].docusignTemplateId, 'update-test-template-1')
    should.equal(res.body.text, 'm2m-text')
    should.equal(res.body.typeId, 11)
    should.equal(res.body.title, 'm2m-title')
    should.equal(res.body.url, 'update-url')
    should.equal(res.body.agreeabilityTypeId, agreeabilityTypeIdsMapping[4])
    should.equal(res.body.updatedBy, user.m2mWrite.sub)
    should.exist(res.body.updated)
  })

  it('fully update terms of use, adding docusign template success', async () => {
    const data = _.cloneDeep(request.updateTermsOfUse.reqBody)
    const res = await putRequest(`${url}/${id1}`, data, token.user1)
    const record = await TermsOfUse.findOne({ where: { id: id1, deletedAt: null }, raw: true })
    should.equal(record.text, 'update-text')
    should.equal(record.typeId, 11)
    should.equal(record.title, 'update-title')
    should.equal(record.url, 'update-url')
    should.equal(record.agreeabilityTypeId, agreeabilityTypeIdsMapping[4])
    const existed = await TermsOfUseDocusignTemplateXref.findAll({ where: { termsOfUseId: id1 }, raw: true })
    should.equal(existed.length, 1)
    should.equal(existed[0].docusignTemplateId, 'update-test-template-1')
    should.equal(res.body.text, 'update-text')
    should.equal(res.body.typeId, 11)
    should.equal(res.body.title, 'update-title')
    should.equal(res.body.url, 'update-url')
    should.equal(res.body.agreeabilityTypeId, agreeabilityTypeIdsMapping[4])
    should.equal(res.body.updatedBy, 'TonyJ')
    should.exist(res.body.updated)
  })

  it('fully update terms of use, updating docusign template success', async () => {
    const data = _.cloneDeep(request.updateTermsOfUse.reqBody)
    data.docusignTemplateId = 'new-template-id'
    const res = await putRequest(`${url}/${id1}`, data, token.user1)
    const record = await TermsOfUse.findOne({ where: { id: id1, deletedAt: null }, raw: true })
    should.equal(record.text, 'update-text')
    should.equal(record.typeId, 11)
    should.equal(record.title, 'update-title')
    should.equal(record.url, 'update-url')
    should.equal(record.agreeabilityTypeId, agreeabilityTypeIdsMapping[4])
    const existed = await TermsOfUseDocusignTemplateXref.findAll({ where: { termsOfUseId: id1 }, raw: true })
    should.equal(existed.length, 1)
    should.equal(existed[0].docusignTemplateId, 'new-template-id')
    should.equal(res.body.text, 'update-text')
    should.equal(res.body.typeId, 11)
    should.equal(res.body.title, 'update-title')
    should.equal(res.body.url, 'update-url')
    should.equal(res.body.agreeabilityTypeId, agreeabilityTypeIdsMapping[4])
    should.equal(res.body.updatedBy, 'TonyJ')
    should.exist(res.body.updated)
  })

  it('fully update terms of use, removing docusign template success', async () => {
    let data = _.cloneDeep(request.updateTermsOfUse.reqBody)
    data = _.omit(data, 'text', 'url', 'docusignTemplateId')
    data.agreeabilityTypeId = agreeabilityTypeIdsMapping[3]
    const res = await putRequest(`${url}/${id1}`, data, token.user1)
    const record = await TermsOfUse.findOne({ where: { id: id1, deletedAt: null }, raw: true })
    should.not.exist(record.text)
    should.equal(record.typeId, 11)
    should.equal(record.title, 'update-title')
    should.not.exist(record.url)
    should.equal(record.agreeabilityTypeId, agreeabilityTypeIdsMapping[3])
    const existed = await TermsOfUseDocusignTemplateXref.findAll({ where: { termsOfUseId: id1 }, raw: true })
    should.equal(existed.length, 0)
    should.not.exist(res.body.text)
    should.equal(res.body.typeId, 11)
    should.equal(res.body.title, 'update-title')
    should.not.exist(res.body.url)
    should.equal(res.body.agreeabilityTypeId, agreeabilityTypeIdsMapping[3])
    should.equal(res.body.updatedBy, 'TonyJ')
    should.exist(res.body.updated)
  })

  it('failure - fully update terms of use, docusign template missing', async () => {
    let data = _.cloneDeep(request.updateTermsOfUse.reqBody)
    data = _.omit(data, 'docusignTemplateId')
    data.agreeabilityTypeId = AGREE_FOR_DOCUSIGN_TEMPLATE
    try {
      await putRequest(`${url}/${id1}`, data, token.user1)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 400)
      should.equal(_.get(err, 'response.body.message'), '"docusignTemplateId" is required')
    }
  })

  it('failure - fully update terms of use not found', async () => {
    const data = _.cloneDeep(request.updateTermsOfUse.reqBody)
    try {
      await putRequest(`${url}/${termsOfUseIdsMapping['not-exist-1']}`, data, token.user1)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 404)
      should.equal(_.get(err, 'response.body.message'),
        `TermsOfUse not found with id: ${termsOfUseIdsMapping['not-exist-1']}`)
    }
  })

  it('failure - partially update terms of use, docusign template missing', async () => {
    let data = _.cloneDeep(request.updateTermsOfUse.reqBody)
    data = _.omit(data, 'docusignTemplateId')
    data.agreeabilityTypeId = AGREE_FOR_DOCUSIGN_TEMPLATE
    try {
      await patchRequest(`${url}/${id1}`, data, token.user1)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 400)
      should.equal(_.get(err, 'response.body.message'), 'Docusign template id is missing.')
    }
  })

  it('failure - partially update terms of use not found', async () => {
    let data = _.cloneDeep(request.updateTermsOfUse.reqBody)
    data = _.omit(data, 'agreeabilityTypeId')
    try {
      await patchRequest(`${url}/${termsOfUseIdsMapping['not-exist-1']}`, data, token.user1)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 404)
      should.equal(_.get(err, 'response.body.message'),
        `TermsOfUse not found with id: ${termsOfUseIdsMapping['not-exist-1']}`)
    }
  })

  it('partially update terms of use using m2m token success', async () => {
    const res = await patchRequest(`${url}/${id1}`, { url: 'm2m-url' }, token.m2mWrite)
    const record = await TermsOfUse.findOne({ where: { id: id1, deletedAt: null }, raw: true })
    should.not.exist(record.text)
    should.equal(record.typeId, 11)
    should.equal(record.title, 'update-title')
    should.equal(record.url, 'm2m-url')
    should.equal(record.updatedBy, user.m2mWrite.sub)
    should.equal(record.agreeabilityTypeId, agreeabilityTypeIdsMapping[3])
    const existed = await TermsOfUseDocusignTemplateXref.findAll({ where: { termsOfUseId: id1 }, raw: true })
    should.equal(existed.length, 0)
    should.not.exist(res.body.text)
    should.equal(res.body.typeId, 11)
    should.equal(res.body.title, 'update-title')
    should.equal(res.body.url, 'm2m-url')
    should.equal(res.body.agreeabilityTypeId, agreeabilityTypeIdsMapping[3])
    should.equal(res.body.updatedBy, user.m2mWrite.sub)
    should.exist(res.body.updated)
  })

  it('partially update terms of use, adding docusign template success', async () => {
    let data = _.cloneDeep(request.updateTermsOfUse.reqBody)
    data = _.pick(data, 'url', 'agreeabilityTypeId', 'docusignTemplateId')
    const res = await patchRequest(`${url}/${id1}`, data, token.user1)
    const record = await TermsOfUse.findOne({ where: { id: id1, deletedAt: null }, raw: true })
    should.not.exist(record.text)
    should.equal(record.typeId, 11)
    should.equal(record.title, 'update-title')
    should.equal(record.url, 'update-url')
    should.equal(record.agreeabilityTypeId, agreeabilityTypeIdsMapping[4])
    const existed = await TermsOfUseDocusignTemplateXref.findAll({ where: { termsOfUseId: id1 }, raw: true })
    should.equal(existed.length, 1)
    should.equal(existed[0].docusignTemplateId, 'update-test-template-1')
    should.not.exist(res.body.text)
    should.equal(res.body.typeId, 11)
    should.equal(res.body.title, 'update-title')
    should.equal(res.body.url, 'update-url')
    should.equal(res.body.agreeabilityTypeId, agreeabilityTypeIdsMapping[4])
    should.equal(res.body.updatedBy, 'TonyJ')
    should.exist(res.body.updated)
  })

  it('partially update terms of use, changing agreeabilityTypeId into docusign success', async () => {
    const res = await patchRequest(`${url}/${id3}`, { agreeabilityTypeId: agreeabilityTypeIdsMapping[4] }, token.user1)
    const record = await TermsOfUse.findOne({ where: { id: id3, deletedAt: null }, raw: true })
    should.equal(record.agreeabilityTypeId, agreeabilityTypeIdsMapping[4])
    const existed = await TermsOfUseDocusignTemplateXref.findAll({ where: { termsOfUseId: id1 }, raw: true })
    should.equal(existed.length, 1)
    should.equal(res.body.agreeabilityTypeId, agreeabilityTypeIdsMapping[4])
  })

  it('partially update terms of use, changing agreeabilityTypeId into electronically success', async () => {
    const res = await patchRequest(`${url}/${id2}`, { agreeabilityTypeId: agreeabilityTypeIdsMapping[3] }, token.user1)
    const record = await TermsOfUse.findOne({ where: { id: id2, deletedAt: null }, raw: true })
    should.equal(record.agreeabilityTypeId, agreeabilityTypeIdsMapping[3])
    // docusign template xref is not deleted under partially update
    const existed = await TermsOfUseDocusignTemplateXref.findAll({ where: { termsOfUseId: id1 }, raw: true })
    should.equal(existed.length, 1)
    should.equal(res.body.agreeabilityTypeId, agreeabilityTypeIdsMapping[3])
  })

  it('failure - fully update terms of use no token', async () => {
    const data = _.cloneDeep(request.updateTermsOfUse.reqBody)
    try {
      await putRequest(`${url}/${id1}`, data)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 401)
      should.equal(_.get(err, 'response.body.message'), 'No token provided.')
    }
  })

  it('failure - fully update terms of use invalid token', async () => {
    const data = _.cloneDeep(request.updateTermsOfUse.reqBody)
    try {
      await putRequest(`${url}/${id1}`, data, 'invalid')
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 401)
      should.equal(_.get(err, 'response.body.message'), 'Invalid Token.')
    }
  })

  it('failure - fully update terms of use forbidden', async () => {
    const data = _.cloneDeep(request.updateTermsOfUse.reqBody)
    try {
      await putRequest(`${url}/${id1}`, data, token.user2)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 403)
      should.equal(_.get(err, 'response.body.message'), 'You are not allowed to perform this action!')
    }
  })

  it('failure - fully update terms of use using forbidden m2m token', async () => {
    const data = _.cloneDeep(request.updateTermsOfUse.reqBody)
    try {
      await putRequest(`${url}/${id1}`, data, token.m2mRead)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 403)
      should.equal(_.get(err, 'response.body.message'), 'You are not allowed to perform this action!')
    }
  })

  it('failure - partially update terms of use no token', async () => {
    const data = _.cloneDeep(request.updateTermsOfUse.reqBody)
    try {
      await patchRequest(`${url}/${id1}`, data)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 401)
      should.equal(_.get(err, 'response.body.message'), 'No token provided.')
    }
  })

  it('failure - partially update terms of use invalid token', async () => {
    const data = _.cloneDeep(request.updateTermsOfUse.reqBody)
    try {
      await patchRequest(`${url}/${id1}`, data, 'invalid')
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 401)
      should.equal(_.get(err, 'response.body.message'), 'Invalid Token.')
    }
  })

  it('failure - partially update terms of use forbidden', async () => {
    const data = _.cloneDeep(request.updateTermsOfUse.reqBody)
    try {
      await patchRequest(`${url}/${id1}`, data, token.user2)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 403)
      should.equal(_.get(err, 'response.body.message'), 'You are not allowed to perform this action!')
    }
  })

  it('failure - partially update terms of use using forbidden m2m token', async () => {
    const data = _.cloneDeep(request.updateTermsOfUse.reqBody)
    try {
      await patchRequest(`${url}/${id1}`, data, token.m2mRead)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 403)
      should.equal(_.get(err, 'response.body.message'), 'You are not allowed to perform this action!')
    }
  })

  for (const requiredField of request.updateTermsOfUse.requiredFields) {
    it(`test invalid parameters, required field ${requiredField} is missing`, async () => {
      let data = _.cloneDeep(request.updateTermsOfUse.reqBody)
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
})
