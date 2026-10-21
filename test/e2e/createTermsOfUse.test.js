/**
 * E2E test of the create terms of use endpoint.
 */

const _ = require('lodash')
const config = require('config')
const should = require('should')
const models = require('../../src/models')
const { termsOfUseIdsMapping, agreeabilityTypeIdsMapping } = require('../../src/test-data')
const { AGREE_FOR_DOCUSIGN_TEMPLATE } = require('../../app-constants')

const { user, token, request } = require('../common/testData')
const { postRequest, clearLogs } = require('../common/testHelper')

const TermsOfUse = models.TermsOfUse
const TermsOfUseDocusignTemplateXref = models.TermsOfUseDocusignTemplateXref

const url = `http://localhost:${config.PORT}/terms`

module.exports = describe('create terms of use endpoint', () => {
  beforeEach(() => {
    clearLogs()
  })

  it('create terms of use without docusign template success', async () => {
    let data = _.cloneDeep(request.createTermsOfUse.reqBody)
    data = _.omit(data, 'docusignTemplateId')
    data.agreeabilityTypeId = agreeabilityTypeIdsMapping[3]
    data.id = termsOfUseIdsMapping[40001]
    data.legacyId = 40001
    const res = await postRequest(url, data, token.user1)
    const record = await TermsOfUse.findOne({ where: { id: res.body.id, deletedAt: null }, raw: true })
    should.equal(record.text, 'text')
    should.equal(record.typeId, 10)
    should.equal(record.title, 'title')
    should.equal(record.url, 'url')
    should.equal(record.agreeabilityTypeId, agreeabilityTypeIdsMapping[3])
    should.equal(record.createdBy, 'TonyJ')
    should.exist(record.created)
    const existed = await TermsOfUseDocusignTemplateXref.findAll({ where: { termsOfUseId: res.body.id }, raw: true })
    should.equal(existed.length, 0)
    should.equal(res.body.text, 'text')
    should.equal(res.body.typeId, 10)
    should.equal(res.body.title, 'title')
    should.equal(res.body.url, 'url')
    should.equal(res.body.agreeabilityTypeId, agreeabilityTypeIdsMapping[3])
    should.equal(res.body.createdBy, 'TonyJ')
    should.exist(res.body.created)
  })

  it('create terms of use without docusign template using m2m token success', async () => {
    let data = _.cloneDeep(request.createTermsOfUse.reqBody)
    data = _.omit(data, 'docusignTemplateId')
    data.agreeabilityTypeId = agreeabilityTypeIdsMapping[3]
    data.id = termsOfUseIdsMapping[40002]
    data.legacyId = 40002
    const res = await postRequest(url, data, token.m2mWrite)
    const record = await TermsOfUse.findOne({ where: { id: res.body.id, deletedAt: null }, raw: true })
    should.equal(record.text, 'text')
    should.equal(record.typeId, 10)
    should.equal(record.title, 'title')
    should.equal(record.url, 'url')
    should.equal(record.agreeabilityTypeId, agreeabilityTypeIdsMapping[3])
    should.equal(record.createdBy, user.m2mWrite.sub)
    should.exist(record.created)
    const existed = await TermsOfUseDocusignTemplateXref.findAll({ where: { termsOfUseId: res.body.id }, raw: true })
    should.equal(existed.length, 0)
    should.equal(res.body.text, 'text')
    should.equal(res.body.typeId, 10)
    should.equal(res.body.title, 'title')
    should.equal(res.body.url, 'url')
    should.equal(res.body.agreeabilityTypeId, agreeabilityTypeIdsMapping[3])
    should.equal(res.body.createdBy, user.m2mWrite.sub)
    should.exist(res.body.created)
  })

  it('create terms of use with docusign template success', async () => {
    const data = _.cloneDeep(request.createTermsOfUse.reqBody)
    data.id = termsOfUseIdsMapping[40003]
    data.legacyId = 40003
    const res = await postRequest(url, data, token.user1)
    const record = await TermsOfUse.findOne({ where: { id: res.body.id, deletedAt: null }, raw: true })
    should.equal(record.text, 'text')
    should.equal(record.typeId, 10)
    should.equal(record.title, 'title')
    should.equal(record.url, 'url')
    should.equal(record.agreeabilityTypeId, agreeabilityTypeIdsMapping[4])
    const existed = await TermsOfUseDocusignTemplateXref.findAll({ where: { termsOfUseId: res.body.id }, raw: true })
    should.equal(existed.length, 1)
    should.equal(existed[0].docusignTemplateId, 'test-template-1')
    should.equal(res.body.text, 'text')
    should.equal(res.body.typeId, 10)
    should.equal(res.body.title, 'title')
    should.equal(res.body.url, 'url')
    should.equal(res.body.agreeabilityTypeId, agreeabilityTypeIdsMapping[4])
    should.equal(res.body.createdBy, 'TonyJ')
    should.exist(res.body.created)
  })

  it('failure - no terms of use agreeability type found', async () => {
    const data = _.cloneDeep(request.createTermsOfUse.reqBody)
    data.agreeabilityTypeId = agreeabilityTypeIdsMapping['not-exist']
    try {
      await postRequest(url, data, token.user1)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 400)
      should.equal(_.get(err, 'response.body.message'), `TermsOfUseAgreeabilityType not found with id: ${agreeabilityTypeIdsMapping['not-exist']}`)
    }
  })

  it('failure - docusign template is missing', async () => {
    let data = _.cloneDeep(request.createTermsOfUse.reqBody)
    data = _.omit(data, 'docusignTemplateId')
    data.agreeabilityTypeId = AGREE_FOR_DOCUSIGN_TEMPLATE
    try {
      await postRequest(url, data, token.user1)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 400)
      should.equal(_.get(err, 'response.body.message'), '"docusignTemplateId" is required')
    }
  })

  it('failure - no token', async () => {
    const data = _.cloneDeep(request.createTermsOfUse.reqBody)
    try {
      await postRequest(url, data)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 401)
      should.equal(_.get(err, 'response.body.message'), 'No token provided.')
    }
  })

  it('failure - invalid token', async () => {
    const data = _.cloneDeep(request.createTermsOfUse.reqBody)
    try {
      await postRequest(url, data, 'invalid')
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 401)
      should.equal(_.get(err, 'response.body.message'), 'Invalid Token.')
    }
  })

  it('failure - forbidden', async () => {
    const data = _.cloneDeep(request.createTermsOfUse.reqBody)
    try {
      await postRequest(url, data, token.user2)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 403)
      should.equal(_.get(err, 'response.body.message'), 'You are not allowed to perform this action!')
    }
  })

  it('failure - forbidden m2m token', async () => {
    const data = _.cloneDeep(request.createTermsOfUse.reqBody)
    try {
      await postRequest(url, data, token.m2mRead)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 403)
      should.equal(_.get(err, 'response.body.message'), 'You are not allowed to perform this action!')
    }
  })

  for (const requiredField of request.createTermsOfUse.requiredFields) {
    it(`test invalid parameters, required field ${requiredField} is missing`, async () => {
      let data = _.cloneDeep(request.createTermsOfUse.reqBody)
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
})
