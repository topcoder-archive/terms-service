/**
 * Unit test of TermsForResourceService - search/check terms for resource.
 */

const _ = require('lodash')
const should = require('should')
const service = require('../../src/services/TermsForResourceService')
const { request } = require('../common/testData')
const { assertError, clearLogs } = require('../common/testHelper')

module.exports = describe('search and check terms for resource', () => {
  beforeEach(() => {
    clearLogs()
  })

  it('search terms for resource success', async () => {
    const result = await service.searchTermsForResources({ page: 1, perPage: 3 })
    should.equal(result.total, 3)
    should.equal(result.page, 1)
    should.equal(result.perPage, 3)
    should.equal(result.result.length, 3)
    should.deepEqual(_.omit(result.result[0], 'created'), request.searchTermsForResource.response.result[0])
    should.deepEqual(_.omit(result.result[1], 'created'), request.searchTermsForResource.response.result[1])
    should.deepEqual(_.omit(result.result[2], 'created'), request.searchTermsForResource.response.result[2])
  })

  it('check terms for resource success, single tag', async () => {
    const result = await service.checkTermsForResourceOfUser(8547899, { reference: 'challenge', referenceId: '12345', tags: 'submitter' })
    should.deepEqual(result, request.checkTermsForResource.singleTag.response)
  })

  it('check terms for resource success, multiple tags', async () => {
    const result = await service.checkTermsForResourceOfUser(151743, { reference: 'challenge', referenceId: '12345', tags: ['submitter', 'copilot'] })
    should.deepEqual(result, request.checkTermsForResource.multipleTags.response)
  })

  it('failure - check terms for resource with incorrect criteria', async () => {
    try {
      await service.checkTermsForResourceOfUser(8547899, { reference: 'challenge', referenceId: '12345', tags: ['invalid1', 'invalid2'] })
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.name, 'BadRequestError')
      assertError(err, 'No terms for resouce exist with Reference(challenge) and ReferenceId(12345) for the following tags: [ \'invalid1\', \'invalid2\' ]')
    }
  })
})
