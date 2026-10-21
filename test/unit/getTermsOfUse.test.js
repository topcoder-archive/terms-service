/**
 * Unit test of TermsOfUseService - get terms of use.
 */
const should = require('should')
const service = require('../../src/services/TermsOfUseService')
const { user } = require('../common/testData')
const termsOfUseIdsMapping = require('../../src/test-data').termsOfUseIdsMapping
const { AGREE_FOR_DOCUSIGN_TEMPLATE } = require('../../app-constants')
const TermsOfUse = require('../../src/models').TermsOfUse

const { assertError, assertValidationError, clearLogs } = require('../common/testHelper')

module.exports = describe('get terms of use', () => {
  beforeEach(() => {
    clearLogs()
  })

  it('get terms of use by user who has agreed', async () => {
    const result = await service.getTermsOfUse(user.user1, termsOfUseIdsMapping[21303], {})
    should.equal(result.id, termsOfUseIdsMapping[21303])
    should.equal(result.title, 'Standard Terms for Topcoder Competitions v2.2')
    should.equal(result.url, '')
    should.equal(result.text, 'text')
    should.equal(result.agreed, true)
    should.equal(result.agreeabilityType, 'Electronically-agreeable')
  })

  it('get terms of use by user who hasn\'t agreed', async () => {
    const result = await service.getTermsOfUse(user.user2, termsOfUseIdsMapping[21303], {})
    should.equal(result.id, termsOfUseIdsMapping[21303])
    should.equal(result.title, 'Standard Terms for Topcoder Competitions v2.2')
    should.equal(result.url, '')
    should.equal(result.text, 'text')
    should.equal(result.agreed, false)
    should.equal(result.agreeabilityType, 'Electronically-agreeable')
  })

  it('get terms of use', async () => {
    const result = await service.getTermsOfUse(undefined, termsOfUseIdsMapping[21303])
    should.equal(result.id, termsOfUseIdsMapping[21303])
    should.equal(result.title, 'Standard Terms for Topcoder Competitions v2.2')
    should.equal(result.url, '')
    should.equal(result.text, 'text')
    should.not.exist(result.agreed)
    should.equal(result.agreeabilityType, 'Electronically-agreeable')
  })

  it('get terms of use using m2m token', async () => {
    const result = await service.getTermsOfUse(user.m2mWrite, termsOfUseIdsMapping[21303])
    should.equal(result.id, termsOfUseIdsMapping[21303])
    should.equal(result.title, 'Standard Terms for Topcoder Competitions v2.2')
    should.equal(result.url, '')
    should.equal(result.text, 'text')
    should.not.exist(result.agreed)
    should.equal(result.agreeabilityType, 'Electronically-agreeable')
  })

  it('get terms of use is false with user', async () => {
    const result = await service.getTermsOfUse(user.user1, termsOfUseIdsMapping[21303])
    should.equal(result.id, termsOfUseIdsMapping[21303])
    should.equal(result.title, 'Standard Terms for Topcoder Competitions v2.2')
    should.equal(result.url, '')
    should.equal(result.text, 'text')
    should.equal(result.agreed, true)
    should.equal(result.agreeabilityType, 'Electronically-agreeable')
  })

  it('get terms of use with docusignTemplateId', async () => {
    const result = await service.getTermsOfUse(undefined, termsOfUseIdsMapping[21304])
    should.equal(result.id, termsOfUseIdsMapping[21304])
    should.equal(result.title, 'Standard Terms for Topcoder Competitions v2.2')
    should.equal(result.url, '')
    should.equal(result.text, 'another text')
    should.not.exist(result.agreed)
    if (result.agreeabilityTypeId === AGREE_FOR_DOCUSIGN_TEMPLATE) {
      should.equal(result.docusignTemplateId, '100')
    }
    should.equal(result.agreeabilityType, 'Docusign-template')
  })

  it('failure - get terms of use missing Docusign template', async () => {
    const record = await TermsOfUse.findOne({
      where: {
        id: termsOfUseIdsMapping[21305]
      }
    })

    if (record.agreeabilityTypeId === AGREE_FOR_DOCUSIGN_TEMPLATE) {
      try {
        await service.getTermsOfUse(undefined, termsOfUseIdsMapping[21305])
        throw new Error('should not throw error here')
      } catch (err) {
        should.equal(err.name, 'InternalServerError')
        assertError(err, 'Docusign template id is missing.')
      }
    }
  })

  it('failure - invalid parameter termsOfUseId', async () => {
    try {
      await service.getTermsOfUse(undefined, 123)
      throw new Error('should not throw error here')
    } catch (err) {
      assertValidationError(err, '"termsOfUseId" must be a string')
    }
  })

  it('failure - get terms of use not found', async () => {
    try {
      await service.getTermsOfUse(undefined, termsOfUseIdsMapping['not-exist-1'])
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.name, 'NotFoundError')
      assertError(err, `Terms of use with id: ${termsOfUseIdsMapping['not-exist-1']} doesn't exists.`)
    }
  })

  // NOTE: no longer need as auth is optional
  // it(`failure - missing authentication(using m2m token)`, async () => {
  //   try {
  //     await service.getTermsOfUse(user.m2mWrite, termsOfUseIdsMapping[21303], {})
  //     throw new Error('should not throw error here')
  //   } catch (err) {
  //     should.equal(err.name, 'UnauthorizedError')
  //     assertError(err, `Authentication credential was missing.`)
  //   }
  // })

  // NOTE: no longer need as auth is optional
  // it('failure - missing authentication', async () => {
  //   try {
  //     await service.getTermsOfUse(undefined, termsOfUseIdsMapping[21303], {})
  //     throw new Error('should not throw error here')
  //   } catch (err) {
  //     should.equal(err.name, 'UnauthorizedError')
  //     assertError(err, `Authentication credential was missing.`)
  //   }
  // })
})
