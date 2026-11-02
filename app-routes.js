/**
 * Configure all routes for express app
 */

const _ = require('lodash')
const config = require('config')
const HttpStatus = require('http-status-codes')
const helper = require('./src/common/helper')
const errors = require('./src/common/errors')
const routes = require('./src/routes')
const authenticator = require('tc-core-library-js').createJwtAuthenticator

/**
 * Configure all routes for express app
 * @param app the express app
 */
module.exports = (app) => {
  const authenticate = authenticator(_.pick(config, ['AUTH_SECRET', 'VALID_ISSUERS', 'JWT_AUDIENCE', 'AUTH0_AUDIENCE']))
  // Load all routes
  _.each(routes, (verbs, path) => {
    _.each(verbs, (def, verb) => {
      const controllerPath = `./src/controllers/${def.controller}`
      const method = require(controllerPath)[def.method]; // eslint-disable-line
      if (!method) {
        throw new Error(`${def.method} is undefined`)
      }

      const actions = []
      actions.push((req, res, next) => {
        req.signature = `${def.controller}#${def.method}`
        next()
      })

      // add Authenticator check if route has auth
      if (def.auth || def.optionalAuth) {
        actions.push((req, res, next) => {
          if (def.auth || (def.optionalAuth && req.headers.authorization)) {
            authenticate(req, res, next)
          } else {
            next()
          }
        })

        actions.push((req, res, next) => {
          if (def.auth || (def.optionalAuth && req.headers.authorization)) {
            if (req.authUser.isMachine) {
              // M2M
              if (!def.optionalAuth && (!def.scopes || (!req.authUser.scopes || !helper.checkIfExists(def.scopes, req.authUser.scopes)))) {
                throw new errors.ForbiddenError('You are not allowed to perform this action!')
              }
            } else {
              if (def.access && (!req.authUser.roles || !helper.checkIfExists(def.access, req.authUser.roles))) {
                throw new errors.ForbiddenError('You are not allowed to perform this action!')
              }
            }
          }
          next()
        })
      }

      actions.push(method)
      const fullPath = config.get('BASE_PATH') + path
      app[verb](fullPath, helper.autoWrapExpress(actions))
    })
  })

  // Check if the route is not found or HTTP method is not supported
  app.use('*', (req, res) => {
    let url = req.baseUrl
    if (url.indexOf(config.get('BASE_PATH')) === 0) {
      url = url.substring(config.get('BASE_PATH').length)
    }
    const route = routes[url]
    if (route) {
      res.status(HttpStatus.METHOD_NOT_ALLOWED).json({ message: 'The requested HTTP method is not supported.' })
    } else {
      res.status(HttpStatus.NOT_FOUND).json({ message: 'The requested resource cannot be found.' })
    }
  })
}
