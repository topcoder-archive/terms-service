/**
 * E2E test of the generate docusign view url endpoint.
 */

const _ = require('lodash')
const config = require('config')
const should = require('should')
const models = require('../../src/models')
const { user, token } = require('../common/testData')
const { postRequest, clearLogs } = require('../common/testHelper')

const url = `http://localhost:${config.PORT}/terms/docusignViewURL`
const DocusignEnvelope = models.DocusignEnvelope

module.exports = describe('Generate docusign view url endpoint', () => {
  beforeEach(() => {
    clearLogs()
  })

  let docuEnvelope

  it('generate docusign view url(AFFIDAVIT) success', async () => {
    const res = await postRequest(url, {
      templateId: config.DOCUSIGN.AFFIDAVIT_TEMPLATE_ID,
      tabs: ['testKey||testValue']
    }, token.user4)
    docuEnvelope = await DocusignEnvelope.findOne({
      where: { userId: user.user4.userId, docusignTemplateId: config.DOCUSIGN.AFFIDAVIT_TEMPLATE_ID, isCompleted: 0 }
    })
    should.equal(res.status, 200)
    should.equal(docuEnvelope.id, res.body.envelopeId)
    should.exist(res.body.recipientViewUrl)
  })

  it('generate docusign view url(AFFIDAVIT) again success', async () => {
    await docuEnvelope.update({ isCompleted: 1 })
    try {
      const res = await postRequest(url, {
        templateId: config.DOCUSIGN.AFFIDAVIT_TEMPLATE_ID,
        tabs: ['testKey||testValue']
      }, token.user4)

      should.equal(res.status, 200)
      should.equal(docuEnvelope.id, res.body.envelopeId)
      should.exist(res.body.recipientViewUrl)
    } finally {
      await docuEnvelope.update({ isCompleted: 0 })
    }
  })

  it('generate docusign view url(NDA) success', async () => {
    const res = await postRequest(url, {
      templateId: config.DOCUSIGN.NDA_TEMPLATE_ID,
      tabs: ['testKey||testValue']
    }, token.user4)

    docuEnvelope = await DocusignEnvelope.findOne({
      where: { userId: user.user4.userId, docusignTemplateId: config.DOCUSIGN.NDA_TEMPLATE_ID, isCompleted: 0 }
    })
    should.equal(res.status, 200)
    should.equal(docuEnvelope.id, res.body.envelopeId)
    should.exist(res.body.recipientViewUrl)
  })

  it('generate docusign view url(W8BEN) success', async () => {
    const res = await postRequest(url, {
      templateId: config.DOCUSIGN.W8BEN_TEMPLATE_ID,
      tabs: ['testKey||testValue']
    }, token.user4)

    docuEnvelope = await DocusignEnvelope.findOne({
      where: { userId: user.user4.userId, docusignTemplateId: config.DOCUSIGN.W8BEN_TEMPLATE_ID, isCompleted: 0 }
    })
    should.equal(res.status, 200)
    should.equal(docuEnvelope.id, res.body.envelopeId)
    should.exist(res.body.recipientViewUrl)
  })

  it('generate docusign view url(W9) success', async () => {
    const res = await postRequest(url, {
      templateId: config.DOCUSIGN.W9TEMPLATE_ID,
      tabs: ['testKey||testValue']
    }, token.user4)

    docuEnvelope = await DocusignEnvelope.findOne({
      where: { userId: user.user4.userId, docusignTemplateId: config.DOCUSIGN.W9TEMPLATE_ID, isCompleted: 0 }
    })
    should.equal(res.status, 200)
    should.equal(docuEnvelope.id, res.body.envelopeId)
    should.exist(res.body.recipientViewUrl)
  })

  it('generate docusign view url(ASSIGNMENT) by user4 success', async () => {
    const res = await postRequest(url, {
      templateId: config.DOCUSIGN.ASSIGNMENT_V2_TEMPLATE_ID,
      tabs: ['testKey||testValue']
    }, token.user4)

    docuEnvelope = await DocusignEnvelope.findOne({
      where: { userId: user.user4.userId, docusignTemplateId: config.DOCUSIGN.ASSIGNMENT_V2_TEMPLATE_ID, isCompleted: 0 }
    })
    should.equal(res.status, 200)
    should.equal(docuEnvelope.id, res.body.envelopeId)
    should.exist(res.body.recipientViewUrl)
  })

  it('generate docusign view url(ASSIGNMENT) by user2 success', async () => {
    const res = await postRequest(url, {
      templateId: config.DOCUSIGN.ASSIGNMENT_V2_TEMPLATE_ID,
      tabs: ['testKey||testValue']
    }, token.user2)

    docuEnvelope = await DocusignEnvelope.findOne({
      where: { userId: user.user2.userId, docusignTemplateId: config.DOCUSIGN.ASSIGNMENT_V2_TEMPLATE_ID, isCompleted: 0 }
    })
    should.equal(res.status, 200)
    should.equal(docuEnvelope.id, res.body.envelopeId)
    should.exist(res.body.recipientViewUrl)
  })

  it('generate docusign view url(ASSIGNMENT) by user3 success', async () => {
    const res = await postRequest(url, {
      templateId: config.DOCUSIGN.ASSIGNMENT_V2_TEMPLATE_ID,
      tabs: ['testKey||testValue']
    }, token.user3)

    docuEnvelope = await DocusignEnvelope.findOne({
      where: { userId: user.user3.userId, docusignTemplateId: config.DOCUSIGN.ASSIGNMENT_V2_TEMPLATE_ID, isCompleted: 0 }
    })
    should.equal(res.status, 200)
    should.equal(docuEnvelope.id, res.body.envelopeId)
    should.exist(res.body.recipientViewUrl)
  })

  it('failure - docusign template not exist', async () => {
    try {
      await await postRequest(url, {
        templateId: '9103DC77-D8F1-4D7B-BED1-6116604EE98D',
        tabs: ['testKey||testValue']
      }, token.user4)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 404)
      should.equal(_.get(err, 'response.body.message'), 'Template with given id was not found.')
    }
  })

  it('failure - user doesn\'t exist', async () => {
    try {
      await await postRequest(url, {
        templateId: config.DOCUSIGN.AFFIDAVIT_TEMPLATE_ID,
        tabs: ['testKey||testValue']
      }, token.invalidUser)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 404)
      should.equal(_.get(err, 'response.body.message'), 'User with given id: 11111151743 doesn\'t exist')
    }
  })

  it('failure - invalid parameter templateId', async () => {
    try {
      await await postRequest(url, {
        templateId: 'not-uuid',
        tabs: ['testKey||testValue']
      }, token.user4)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 400)
      should.equal(_.get(err, 'response.body.message'), '"templateId" must be a valid GUID')
    }
  })

  it('failure - invalid parameter tabs', async () => {
    try {
      await await postRequest(url, {
        templateId: config.DOCUSIGN.AFFIDAVIT_TEMPLATE_ID,
        tabs: ['invalid']
      }, token.user4)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 400)
      should.equal(_.get(err, 'response.body.message'), '"0" with value "invalid" fails to match the required pattern: /^.+\\|\\|.+$/')
    }
  })

  it('failure - M2M not supported', async () => {
    try {
      await await postRequest(url, {
        templateId: config.DOCUSIGN.ASSIGNMENT_V2_TEMPLATE_ID,
        tabs: ['testKey||testValue']
      }, token.m2mWrite)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 403)
      should.equal(_.get(err, 'response.body.message'), 'You are not allowed to perform this action!')
    }
  })

  it('failure - invalid token', async () => {
    try {
      await await postRequest(url, {
        templateId: config.DOCUSIGN.ASSIGNMENT_V2_TEMPLATE_ID,
        tabs: ['testKey||testValue']
      }, 'invalid')
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 401)
      should.equal(_.get(err, 'response.body.message'), 'Invalid Token.')
    }
  })

  it('failure - no token', async () => {
    try {
      await await postRequest(url, {
        templateId: config.DOCUSIGN.ASSIGNMENT_V2_TEMPLATE_ID,
        tabs: ['testKey||testValue']
      })
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 401)
      should.equal(_.get(err, 'response.body.message'), 'No token provided.')
    }
  })
})
