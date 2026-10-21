/**
 * Configure all routes for express app
 */

const _ = require('lodash')
const config = require('config')
const HttpStatus = require('http-status-codes')
const helper = require('./src/common/helper')
const errors = require('./src/common/errors')
const routes = require('./src/routes')
const { authenticate, hasRequiredScopes } = require('./src/common/auth')

/**
 * Register routes with shared-core validation and explicit service scope checks.
 * @param app Express application receiving the route handlers.
 * @returns {void} Invalid tokens produce 401; insufficient scopes/roles produce 403.
 * Optional authentication preserves anonymous access but supplied service tokens
 * must satisfy the declared scopes, including read:terms on individual terms.
 */
module.exports = (app) => {
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
              if (!hasRequiredScopes(def, req.authUser)) {
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
