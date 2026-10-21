/**
 * E2E test of the delete/search Terms of Use endpoint.
 */

const _ = require('lodash')
const config = require('config')
const should = require('should')
const models = require('../../src/models')
const termsOfUseIdsMapping = require('../../src/test-data').termsOfUseIdsMapping

const { token, request } = require('../common/testData')
const { getRequest, deleteRequest, clearLogs } = require('../common/testHelper')

const TermsOfUse = models.TermsOfUse

const url = `http://localhost:${config.PORT}/terms`

module.exports = describe('delete and search terms of use', () => {
  beforeEach(() => {
    clearLogs()
  })

  it('search terms of use success', async () => {
    const res = await getRequest(`${url}?page=1&perPage=5`, token.user1)
    should.equal(_.isEqual(res.body.result, request.searchTermsOfUse.response.result), true)
    should.equal(res.headers['x-page'], 1)
    should.equal(res.headers['x-per-page'], 5)
    should.equal(res.headers['x-total'], 13)
    should.equal(res.headers['x-total-pages'], 3)
  })

  it('search terms of use using m2m token success', async () => {
    const res = await getRequest(`${url}?page=1&perPage=5`, token.m2mRead)
    should.equal(_.isEqual(res.body.result, request.searchTermsOfUse.response.result), true)
    should.equal(res.headers['x-page'], 1)
    should.equal(res.headers['x-per-page'], 5)
    should.equal(res.headers['x-total'], 13)
    should.equal(res.headers['x-total-pages'], 3)
  })

  it('delete terms of use success', async () => {
    const res = await deleteRequest(`${url}/${termsOfUseIdsMapping[30000]}`, token.user1)
    should.equal(res.status, 204)
    const record = await TermsOfUse.findOne({ where: { id: termsOfUseIdsMapping[30000] }, raw: true })
    should.exist(record.deletedAt)
  })

  it('delete terms of use using m2m token success', async () => {
    const res = await deleteRequest(`${url}/${termsOfUseIdsMapping[40000]}`, token.m2mWrite)
    should.equal(res.status, 204)
    const record = await TermsOfUse.findOne({ where: { id: termsOfUseIdsMapping[40000] }, raw: true })
    should.exist(record.deletedAt)
  })

  it('failure - delete terms of use not found', async () => {
    try {
      await deleteRequest(`${url}/${termsOfUseIdsMapping['not-exist-1']}`, token.user1)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 404)
      should.equal(_.get(err, 'response.body.message'),
        `TermsOfUse not found with id: ${termsOfUseIdsMapping['not-exist-1']}`)
    }
  })

  // it('failure - search terms of use no token', async () => { // Search is no longer need auth
  //   try {
  //     await getRequest(`${url}?page=1&perPage=5`)
  //     throw new Error('should not throw error here')
  //   } catch (err) {
  //     should.equal(err.status, 401)
  //     should.equal(_.get(err, 'response.body.message'), 'No token provided.')
  //   }
  // })

  // it('failure - search terms of use invalid token', async () => { // Search is no longer need auth
  //   try {
  //     await getRequest(`${url}?page=1&perPage=5`, 'invalid')
  //     throw new Error('should not throw error here')
  //   } catch (err) {
  //     should.equal(err.status, 401)
  //     should.equal(_.get(err, 'response.body.message'), 'Invalid Token.')
  //   }
  // })

  // it('failure - search terms of use forbidden', async () => { // Search is no longer need auth
  //   try {
  //     await getRequest(`${url}?page=1&perPage=5`, token.user2)
  //     throw new Error('should not throw error here')
  //   } catch (err) {
  //     should.equal(err.status, 403)
  //     should.equal(_.get(err, 'response.body.message'), `You are not allowed to perform this action!`)
  //   }
  // })

  // it('failure - search terms of use using forbidden m2m token', async () => { // Search is no longer need auth
  //   try {
  //     await getRequest(`${url}?page=1&perPage=5`, token.m2mWrite)
  //     throw new Error('should not throw error here')
  //   } catch (err) {
  //     should.equal(err.status, 403)
  //     should.equal(_.get(err, 'response.body.message'), `You are not allowed to perform this action!`)
  //   }
  // })

  it('failure - delete terms of use no token', async () => {
    try {
      await deleteRequest(`${url}/30000`)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 401)
      should.equal(_.get(err, 'response.body.message'), 'No token provided.')
    }
  })

  it('failure - delete terms of use invalid token', async () => {
    try {
      await deleteRequest(`${url}/${termsOfUseIdsMapping[30000]}`, 'invalid')
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 401)
      should.equal(_.get(err, 'response.body.message'), 'Invalid Token.')
    }
  })

  it('failure - delete terms of use forbidden', async () => {
    try {
      await deleteRequest(`${url}/${termsOfUseIdsMapping[30000]}`, token.user2)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 403)
      should.equal(_.get(err, 'response.body.message'), 'You are not allowed to perform this action!')
    }
  })

  it('failure - delete terms of use using forbidden m2m token', async () => {
    try {
      await deleteRequest(`${url}/${termsOfUseIdsMapping[30000]}`, token.m2mRead)
      throw new Error('should not throw error here')
    } catch (err) {
      should.equal(err.status, 403)
      should.equal(_.get(err, 'response.body.message'), 'You are not allowed to perform this action!')
    }
  })
})
