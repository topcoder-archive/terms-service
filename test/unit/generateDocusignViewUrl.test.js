/**
 * Unit test of DocusignService - generate Docusign View Url.
 */

const config = require('config')
const should = require('should')
const service = require('../../src/services/DocusignService')
const models = require('../../src/models')
const { user } = require('../common/testData')
const { assertError, assertValidationError, clearLogs } = require('../common/testHelper')

const DocusignEnvelope = models.DocusignEnvelope

module.exports = describe('generate Docusign View Url', () => {
  beforeEach(() => {
    clearLogs()
  })

  let docuEnvelope

  it('generate docusign view url(AFFIDAVIT) success', async () => {
    const result = await service.generateDocusignViewURL(user.user4, {
      templateId: config.DOCUSIGN.AFFIDAVIT_TEMPLATE_ID,
      tabs: ['testKey||testValue']
    })
    docuEnvelope = await DocusignEnvelope.findOne({
      where: { userId: user.user4.userId, docusignTemplateId: config.DOCUSIGN.AFFIDAVIT_TEMPLATE_ID, isCompleted: 0 }
    })
    should.equal(docuEnvelope.id, result.envelopeId)
  })

  it('generate docusign view url(AFFIDAVIT) again success', async () => {
    await docuEnvelope.update({ isCompleted: 1 })
    try {
      const result = await service.generateDocusignViewURL(user.user4, {
        templateId: config.DOCUSIGN.AFFIDAVIT_TEMPLATE_ID,
        tabs: ['testKey||testValue']
      })
      should.equal(docuEnvelope.id, result.envelopeId)
    } finally {
      await docuEnvelope.update({ isCompleted: 0 })
    }
  })

  it('generate docusign view url(NDA) success', async () => {
    const result = await service.generateDocusignViewURL(user.user4, {
      templateId: config.DOCUSIGN.NDA_TEMPLATE_ID,
      tabs: ['testKey||testValue']
    })
    docuEnvelope = await DocusignEnvelope.findOne({
      where: { userId: user.user4.userId, docusignTemplateId: config.DOCUSIGN.NDA_TEMPLATE_ID, isCompleted: 0 }
    })
    should.equal(docuEnvelope.id, result.envelopeId)
  })

  it('generate docusign view url(W8BEN) success', async () => {
    const result = await service.generateDocusignViewURL(user.user4, {
      templateId: config.DOCUSIGN.W8BEN_TEMPLATE_ID,
      tabs: ['testKey||testValue']
    })
    docuEnvelope = await DocusignEnvelope.findOne({
      where: { userId: user.user4.userId, docusignTemplateId: config.DOCUSIGN.W8BEN_TEMPLATE_ID, isCompleted: 0 }
    })
    should.equal(docuEnvelope.id, result.envelopeId)
  })

  it('generate docusign view url(W9) success', async () => {
    const result = await service.generateDocusignViewURL(user.user4, {
      templateId: config.DOCUSIGN.W9TEMPLATE_ID,
      tabs: ['testKey||testValue']
    })
    docuEnvelope = await DocusignEnvelope.findOne({
      where: { userId: user.user4.userId, docusignTemplateId: config.DOCUSIGN.W9TEMPLATE_ID, isCompleted: 0 }
    })
    should.equal(docuEnvelope.id, result.envelopeId)
  })

  it('generate docusign view url(ASSIGNMENT) by user4 success', async () => {
    const result = await service.generateDocusignViewURL(user.user4, {
      templateId: config.DOCUSIGN.ASSIGNMENT_V2_TEMPLATE_ID,
      tabs: ['testKey||testValue']
    })
    docuEnvelope = await DocusignEnvelope.findOne({
      where: { userId: user.user4.userId, docusignTemplateId: config.DOCUSIGN.ASSIGNMENT_V2_TEMPLATE_ID, isCompleted: 0 }
    })
    should.equal(docuEnvelope.id, result.envelopeId)
  })

  it('generate docusign view url(ASSIGNMENT) by user2 success', async () => {
    const result = await service.generateDocusignViewURL(user.user2, {
      templateId: config.DOCUSIGN.ASSIGNMENT_V2_TEMPLATE_ID,
      tabs: ['testKey||testValue']
    })
    docuEnvelope = await DocusignEnvelope.findOne({
      where: { userId: user.user2.userId, docusignTemplateId: config.DOCUSIGN.ASSIGNMENT_V2_TEMPLATE_ID, isCompleted: 0 }
    })
    should.equal(docuEnvelope.id, result.envelopeId)
  })

  it('generate docusign view url(ASSIGNMENT) by user3 success', async () => {
    const result = await service.generateDocusignViewURL(user.user3, {
      templateId: config.DOCUSIGN.ASSIGNMENT_V2_TEMPLATE_ID,
      tabs: ['testKey||testValue']
    })
    docuEnvelope = await DocusignEnvelope.findOne({
      where: { userId: user.user3.userId, docusignTemplateId: config.DOCUSIGN.ASSIGNMENT_V2_TEMPLATE_ID, isCompleted: 0 }
    })
    should.equal(docuEnvelope.id, result.envelopeId)
  })

  it('failure - docusign template not exist', async () => {
    try {
      await service.generateDocusignViewURL(user.user4, {
        templateId: '9103DC77-D8F1-4D7B-BED1-6116604EE98D',
        tabs: ['testKey||testValue']
      })
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.name, 'NotFoundError')
      assertError(err, 'Template with given id was not found.')
    }
  })

  it('failure - user doesn\'t exist', async () => {
    try {
      await service.generateDocusignViewURL(user.invalidUser, {
        templateId: config.DOCUSIGN.AFFIDAVIT_TEMPLATE_ID,
        tabs: ['testKey||testValue']
      })
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.name, 'NotFoundError')
      assertError(err, 'User with given id: 11111151743 doesn\'t exist')
    }
  })

  it('failure - invalid parameter templateId', async () => {
    try {
      await service.generateDocusignViewURL(user.user4, {
        templateId: 'not-uuid',
        tabs: ['testKey||testValue']
      })
      throw new Error('should not throw error here')
    } catch (err) {
      assertValidationError(err, '"templateId" must be a valid GUID')
    }
  })

  it('failure - invalid parameter tabs', async () => {
    try {
      await service.generateDocusignViewURL(user.user4, {
        templateId: config.DOCUSIGN.AFFIDAVIT_TEMPLATE_ID,
        tabs: ['invalid']
      })
      throw new Error('should not throw error here')
    } catch (err) {
      assertValidationError(err, '"0" with value "invalid" fails to match the required pattern: /^.+\\|\\|.+$/')
    }
  })
})
