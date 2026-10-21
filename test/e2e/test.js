/**
 * E2E test of the Topcoder Terms API.
 */

process.env.NODE_ENV = 'test'

global.Promise = require('bluebird')

const _ = require('lodash')
const config = require('config')
const should = require('should')
const logger = require('../../src/common/logger')
const testHelper = require('../common/testHelper')
const { initDB } = require('../../src/init-db')
const { insertData } = require('../../src/test-data')

describe('Topcoder - Topcoder Terms API E2E Test', () => {
  let app
  const infoLogs = []
  const errorLogs = []
  const debugLogs = []
  const warnLogs = []
  const info = logger.info
  const error = logger.error
  const debug = logger.debug
  const warn = logger.warn

  /**
   * Sleep with time from input
   * @param time the time input
   */
  const sleep = (time) => new Promise((resolve) => {
    setTimeout(resolve, time)
  })

  /**
   * Close http server
   * @param {Object} server the server
   */
  const closeServer = (server) => new Promise((resolve) => {
    server.close(() => {
      resolve()
    })
  })

  before(async () => {
    // inject logger with log collector
    logger.info = (message) => {
      infoLogs.push(message)
      info(message)
    }
    logger.debug = (message) => {
      debugLogs.push(message)
      debug(message)
    }
    logger.error = (message) => {
      errorLogs.push(message)
      error(message)
    }
    logger.warn = (message) => {
      warnLogs.push(message)
      warn(message)
    }

    testHelper.initErrorLogs(errorLogs)
    testHelper.initWarnLogs(warnLogs)
    testHelper.initInfoLogs(infoLogs)

    await initDB()
    await insertData()

    // start the application
    app = require('../../app')

    // wait until application init successfully
    while (true) {
      if (infoLogs.some(x => String(x).includes('Express server listening on port'))) {
        break
      }
      await sleep(config.WAIT_TIME)
    }
  })

  after(async () => {
    // close server
    await closeServer(app)

    // restore logger
    logger.error = error
    logger.info = info
    logger.debug = debug
    logger.warn = warn

    await initDB()
  })

  describe('Terms for Resource endpoints', () => {
    require('./searchAndCheckTermsForResource.test')
    require('./createTermsForResource.test')
    require('./updateTermsForResource.test')
    require('./getAndDeleteTermsForResource.test')
  })

  describe('Terms of Use endpoints', () => {
    require('./createTermsOfUse.test')
    require('./updateTermsOfUse.test')
    require('./deleteAndSearchTermsOfUse.test')
    require('./getTermsOfUse.test')
    require('./agreeTermsOfUse.test')
  })

  describe('Docusign Unit endpoints', () => {
    require('./generateDocusignViewUrl.test')
    // require('./docusignCallback.test')
    // require('./docusignCallbackListener.test')
  })

  describe('Fail routes Tests', () => {
    const url = `http://localhost:${config.PORT}`

    it('Unsupported http method, return 405', async () => {
      try {
        await testHelper.putRequest(`${url}/terms`, { name: 'fail-route' })
      } catch (err) {
        should.equal(err.status, 405)
        should.equal(_.get(err, 'response.body.message'), 'The requested HTTP method is not supported.')
      }
    })

    it('Http resource not found, return 404', async () => {
      try {
        await testHelper.getRequest(`${url}/invalid`)
      } catch (err) {
        should.equal(err.status, 404)
        should.equal(_.get(err, 'response.body.message'), 'The requested resource cannot be found.')
      }
    })
  })

  describe('New features', () => {
    before(async () => {
      await initDB()
      await insertData()
    })
    after(async () => {
      await initDB()
    })

    describe('Get Terms of Use Types Unit Test', () => {
      require('./getTermsOfUseType.test')
    })

    describe('Filter Terms of Use Unit Test', () => {
      require('./searchTermsOfUseFilter.test')
    })

    describe('Get Terms of Use Users Unit Test', () => {
      require('./getTermsOfUseUsers.test')
      require('./signAndUnsignTermsOfUse.test')
    })
  })
})
