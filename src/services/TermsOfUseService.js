/**
 * This service provides operations of TermsOfUse.
 */

const _ = require('lodash')
const config = require('config')
const Joi = require('joi')
const helper = require('../common/helper')
const logger = require('../common/logger')
const errors = require('../common/errors')
const models = require('../models')
const { AGREE_FOR_DOCUSIGN_TEMPLATE, ELECT_AGREEABLE, UserRoles } = require('../../app-constants')

const TermsOfUse = models.TermsOfUse
const UserTermsOfUseXref = models.UserTermsOfUseXref
const UserTermsOfUseBanXref = models.UserTermsOfUseBanXref
const TermsOfUseDependency = models.TermsOfUseDependency
const TermsOfUseAgreeabilityType = models.TermsOfUseAgreeabilityType
const TermsOfUseDocusignTemplateXref = models.TermsOfUseDocusignTemplateXref
const TermsOfUseType = models.TermsOfUseType

/**
 * Get terms of use by id
 * @param {Object} currentUser the user who perform this operation.
 * @param {String} termsOfUseId the terms of use id
 * @param {Object} query the query object
 * @returns {Object} the terms of use
 */
async function getTermsOfUse (currentUser, termsOfUseId, query) {
  let userId = false
  if (_.get(currentUser, 'isMachine', false)) {
    userId = _.get(query, 'userId', false)
  } else if (_.get(currentUser, 'roles', []).includes(UserRoles.Admin)) {
    userId = _.get(query, 'userId', false)
  } else {
    userId = _.get(currentUser, 'userId')
  }

  const include = [
    {
      model: TermsOfUseAgreeabilityType,
      attributes: [['name', 'agreeabilityType']]
    },
    {
      model: models.TermsOfUseDocusignTemplateXref,
      attributes: ['docusignTemplateId']
    }
  ]
  if (userId) {
    // logger.debug(`Getting Terms for User ${userId}`)

    include.push({
      model: UserTermsOfUseXref,
      as: 'UserTermsOfUseXrefs',
      where: { userId },
      attributes: ['userId'],
      required: false
    })
  }

  // get terms of use
  const termsOfUse = await TermsOfUse.findOne({
    attributes: ['id', 'title', 'url', 'text', 'agreeabilityTypeId', 'typeId', 'legacyId'],
    include,
    where: { id: termsOfUseId, deletedAt: null },
    raw: true
  })
  if (!termsOfUse) {
    throw new errors.NotFoundError(`Terms of use with id: ${termsOfUseId} doesn't exists.`)
  }

  if (currentUser && userId) {
    termsOfUse.agreed = !_.isNull(termsOfUse['UserTermsOfUseXrefs.userId'])
    delete termsOfUse['UserTermsOfUseXrefs.userId']
  }

  // logger.debug(`Raw Returned Data: ${JSON.stringify(termsOfUse)}`)

  return convertRawData(termsOfUse)
}

/**
 * Convert raw terms of use data.
 * @params {termsOfUse} the raw terms of use
 * @returns the converted terms of use
 */
function convertRawData (termsOfUse, throwError = true) {
  termsOfUse.docusignTemplateId = termsOfUse['TermsOfUseDocusignTemplateXref.docusignTemplateId']
  delete termsOfUse['TermsOfUseDocusignTemplateXref.docusignTemplateId']
  termsOfUse.agreeabilityType = termsOfUse['TermsOfUseAgreeabilityType.agreeabilityType']
  delete termsOfUse['TermsOfUseAgreeabilityType.agreeabilityType']
  termsOfUse.type = termsOfUse['TermsOfUseType.type']
  delete termsOfUse['TermsOfUseType.type']
  if (termsOfUse.agreeabilityTypeId === AGREE_FOR_DOCUSIGN_TEMPLATE) {
    // check whether this is for docusign template and that template exists
    if (throwError && _.isNull(termsOfUse.docusignTemplateId)) {
      throw new errors.InternalServerError('Docusign template id is missing.')
    }
  } else {
    delete termsOfUse.docusignTemplateId
  }

  return _.omitBy(termsOfUse, _.isNull)
}

getTermsOfUse.schema = {
  currentUser: Joi.any(),
  termsOfUseId: Joi.string().guid(),
  query: Joi.object().keys({
    userId: Joi.number()
  })
}

/**
 * Agree terms of use
 * @param {Object} currentUser the user who perform this operation.
 * @param {String} termsOfUseId the terms of use id
 * @returns {Object} successful message if user agree terms of use successfully
 */
async function agreeTermsOfUse (currentUser, termsOfUseId) {
  // get terms of use
  const result = await TermsOfUse.findOne({
    include: [{
      model: TermsOfUseAgreeabilityType,
      attributes: [['name', 'agreeabilityType']]
    }],
    where: { id: termsOfUseId, deletedAt: null },
    raw: true
  })
  if (!result) {
    throw new errors.NotFoundError(`Terms of use with id: ${termsOfUseId} doesn't exists.`)
  }
  if (result['TermsOfUseAgreeabilityType.agreeabilityType'] !== ELECT_AGREEABLE) {
    throw new errors.BadRequestError('The term is not electronically agreeable.')
  }

  // check whether user has agreed before
  const exist = await UserTermsOfUseXref.findAll({
    where: { userId: currentUser.userId, termsOfUseId }
  })
  if (exist.length > 0) {
    throw new errors.BadRequestError(`User ${currentUser.userId} has already agreed to terms ${termsOfUseId}`)
  }

  // check user has agreed all dependency terms of use
  const dependency = await TermsOfUseDependency.findAll({
    attributes: [],
    include: [
      {
        model: UserTermsOfUseXref,
        attributes: ['userId'],
        where: { userId: currentUser.userId },
        required: false
      }
    ],
    where: { dependentTermsOfUseId: termsOfUseId },
    raw: true
  })
  for (let i = 0; i < dependency.length; i++) {
    if (_.isNull(dependency[i]['UserTermsOfUseXrefs.userId'])) {
      throw new errors.BadRequestError('You can\'t agree to this terms of use before you have agreed to all the dependencies terms of use.')
    }
  }

  // check whether user is banned
  const ban = await UserTermsOfUseBanXref.findAll({
    where: { userId: currentUser.userId, termsOfUseId }
  })
  if (ban.length > 0) {
    throw new errors.ForbiddenError('Sorry, you can not agree to this terms of use.')
  }

  const body = {
    userId: currentUser.userId,
    termsOfUseId,
    legacyId: _.get(result, 'legacyId'),
    created: new Date()
  }
  logger.debug(`Terms of Use Body: ${JSON.stringify(body)}`)
  await UserTermsOfUseXref.create(body)

  try {
    await helper.postEvent(config.USER_AGREED_TERMS_TOPIC, body)
  } catch (e) {
    logger.error('Failed to post event to the BUS API')
    logger.logFullError(e)
  }

  return { success: true }
}

agreeTermsOfUse.schema = {
  currentUser: Joi.any(),
  termsOfUseId: Joi.string().guid()
}

/**
 * Delete agree terms of use
 * Used by admin to remove agreement
 * @param {Object} currentUser the user who perform this operation.
 * @param {String} termsOfUseId the terms of use id
 * @returns {Object} successful message if user agree terms of use successfully
 */
async function deleteAgreeTermsOfUse (termsOfUseId, userId) {
  // get terms of use
  const term = await TermsOfUse.findOne({
    include: [{
      model: TermsOfUseAgreeabilityType,
      attributes: [['name', 'agreeabilityType']]
    }],
    where: { id: termsOfUseId, deletedAt: null },
    raw: true
  })
  if (!term) {
    throw new errors.NotFoundError(`Terms of use with id: ${termsOfUseId} doesn't exists.`)
  }
  // if (term['TermsOfUseAgreeabilityType.agreeabilityType'] !== ELECT_AGREEABLE) {
  //   throw new errors.BadRequestError('The term is not electronically agreeable.')
  // }

  // check whether user has agreed before
  const existingTerms = await UserTermsOfUseXref.findOne({
    where: { userId, termsOfUseId }
  })
  if (!existingTerms) {
    throw new errors.BadRequestError('You have NOT agreed to this terms of use before.')
  }

  logger.warn(`Deleting Terms of Use Signature user ${JSON.stringify(existingTerms)}`)
  await existingTerms.destroy()

  // try {
  //   await helper.postEvent(config.USER_AGREED_TERMS_TOPIC, body)
  // } catch (e) {
  //   logger.error('Failed to post event to the BUS API')
  //   logger.logFullError(e)
  // }

  return { success: true }
}

deleteAgreeTermsOfUse.schema = {
  termsOfUseId: Joi.string().guid(),
  userId: Joi.number()
}

/**
 * Perform validation on terms of use data
 * @params {Object} termsOfUse the terms of use
 */
async function validateTermsOfUse (termsOfUse) {
  if (termsOfUse.agreeabilityTypeId) {
    try {
      await helper.ensureExists(TermsOfUseAgreeabilityType, { id: termsOfUse.agreeabilityTypeId })
    } catch (err) {
      if (err.name === 'NotFoundError') {
        throw new errors.BadRequestError(err.message)
      }
      throw err
    }
  }
}

/**
 * Create terms of use
 * @params {Object} currentUser the user who perform this operation
 * @params {Object} termsOfUse the terms of use to be created
 * @returns {Object} the created terms of use
 */
async function createTermsOfUse (currentUser, termsOfUse) {
  await validateTermsOfUse(termsOfUse)

  termsOfUse.created = new Date()
  termsOfUse.createdBy = currentUser.handle || currentUser.sub

  const created = await TermsOfUse.create(_.omit(termsOfUse, 'docusignTemplateId'))
  termsOfUse.id = created.id

  if (termsOfUse.docusignTemplateId) {
    await TermsOfUseDocusignTemplateXref.create({
      termsOfUseId: created.id,
      docusignTemplateId: termsOfUse.docusignTemplateId
    })
  }
  await helper.postEvent(config.TERMS_CREATE_TOPIC, termsOfUse)

  return created
}

createTermsOfUse.schema = {
  currentUser: Joi.any(),
  termsOfUse: Joi.object().keys({
    id: Joi.string().guid().optional(),
    legacyId: Joi.numberId().optional(),
    text: Joi.string(),
    typeId: Joi.numberId(),
    title: Joi.string().required(),
    url: Joi.string(),
    agreeabilityTypeId: Joi.uuid(),
    docusignTemplateId: Joi.when('agreeabilityTypeId', {
      is: AGREE_FOR_DOCUSIGN_TEMPLATE,
      then: Joi.string().required(),
      otherwise: Joi.string()
    })
  }).required()
}

/**
 * Update terms of use
 * @params {Object} currentUser the user who perform this operation
 * @params {Number} termsForResourceId the id
 * @params {Object} data the data to be updated
 * @returns {Object} the updated terms of use
 */
async function updateTermsOfUse (currentUser, termsOfUseId, data, isFull) {
  await validateTermsOfUse(data)

  const termsOfUse = await helper.ensureExists(TermsOfUse, { id: termsOfUseId, deletedAt: null }, false)
  const docusignTemplateXref = await termsOfUse.getTermsOfUseDocusignTemplateXref()

  if (_.get(data, 'agreeabilityTypeId', termsOfUse.agreeabilityTypeId) === AGREE_FOR_DOCUSIGN_TEMPLATE &&
    _.isNull(docusignTemplateXref) && _.isUndefined(data.docusignTemplateId)) {
    throw new errors.BadRequestError('Docusign template id is missing.')
  }

  if (isFull && !_.isNull(docusignTemplateXref) && _.isUndefined(data.docusignTemplateId)) {
    await docusignTemplateXref.destroy()
  }

  if (isFull) {
    data.text = data.text || null
    data.url = data.url || null
  }

  if (data.docusignTemplateId) {
    if (_.isNull(docusignTemplateXref)) {
      await TermsOfUseDocusignTemplateXref.create({
        termsOfUseId,
        docusignTemplateId: data.docusignTemplateId
      })
    } else {
      docusignTemplateXref.docusignTemplateId = data.docusignTemplateId
      await docusignTemplateXref.save()
    }
  }

  data.updatedBy = currentUser.handle || currentUser.sub
  data.updated = new Date()
  await termsOfUse.update(_.omit(data, 'docusignTemplateId'))

  if (!isFull && _.isUndefined(data.docusignTemplateId) && !_.isNull(docusignTemplateXref)) {
    data.docusignTemplateId = docusignTemplateXref.docusignTemplateId
  }
  const result = helper.clearObject(_.assign(termsOfUse.dataValues, data))
  await helper.postEvent(config.TERMS_UPDATE_TOPIC, result)

  return result
}

/**
 * Partially update terms of use
 * @params {Object} currentUser the user who perform this operation
 * @params {String} termsOfUseId the id
 * @params {Object} data the data to be updated
 * @returns {Object} the updated terms of use
 */
async function partiallyUpdateTermsOfUse (currentUser, termsOfUseId, data) {
  return updateTermsOfUse(currentUser, termsOfUseId, data, false)
}

partiallyUpdateTermsOfUse.schema = {
  currentUser: Joi.any(),
  termsOfUseId: Joi.string().guid(),
  data: Joi.object().keys({
    text: Joi.string(),
    typeId: Joi.optionalNumberId(),
    legacyId: Joi.numberId().optional(),
    title: Joi.string(),
    url: Joi.string(),
    agreeabilityTypeId: Joi.string().uuid().optional(),
    docusignTemplateId: Joi.string()
  }).required()
}

/**
 * Fully update terms of use
 * @params {Object} currentUser the user who perform this operation
 * @params {String} termsOfUseId the id
 * @params {Object} data the data to be updated
 * @returns {Object} the updated terms of use
 */
async function fullyUpdateTermsOfUse (currentUser, termsOfUseId, data) {
  return updateTermsOfUse(currentUser, termsOfUseId, data, true)
}

fullyUpdateTermsOfUse.schema = {
  currentUser: Joi.any(),
  termsOfUseId: Joi.string().guid(),
  data: createTermsOfUse.schema.termsOfUse
}

/**
 * Delete terms of use
 * @params {String} termsOfUseId the id
 */
async function deleteTermsOfUse (termsOfUseId) {
  const termsOfUse = await helper.ensureExists(TermsOfUse, { id: termsOfUseId, deletedAt: null }, false)
  await termsOfUse.update({ deletedAt: new Date() })
  await helper.postEvent(config.TERMS_DELETE_TOPIC, { termsOfUseId, legacyId: termsOfUse.legacyId })
}

deleteTermsOfUse.schema = {
  termsOfUseId: Joi.string().guid()
}

/**
 * List terms of use
 * @params {Object} criteria the search criteria, only pagination and legacy Id currently
 * @returns {Object} the search result, contain total/page/perPage and result array
 */
async function searchTermsOfUses (criteria) {
  const page = criteria.page > 0 ? criteria.page : 1
  const perPage = criteria.perPage > 0 ? criteria.perPage : 20

  const where = {
    deletedAt: null
  }

  if (criteria.legacyId) {
    where.legacyId = criteria.legacyId
  }

  if (criteria.title) {
    where.title = { [models.Sequelize.Op.iLike]: '%' + criteria.title + '%' }
  }

  const include = [
    {
      model: TermsOfUseAgreeabilityType,
      attributes: [['name', 'agreeabilityType']]
    },
    {
      model: TermsOfUseType,
      attributes: [['name', 'type']]
    },
    {
      model: models.TermsOfUseDocusignTemplateXref,
      attributes: ['docusignTemplateId']
    }
  ]

  if (criteria.userId != null) {
    include.push({
      model: models.UserTermsOfUseXref,
      attributes: [],
      where: {
        userId: criteria.userId
      }
    })
  }

  const countResult = await TermsOfUse.count({
    include,
    where,
    raw: true
  })

  const query = {
    order: [['id', 'ASC']],
    attributes: ['id', 'legacyId', 'title', 'url', 'agreeabilityTypeId', 'typeId'],
    include,
    where,
    limit: perPage,
    offset: (page - 1) * perPage,
    raw: true
  }

  const result = await TermsOfUse.findAll(query)

  // logger.debug(`Query: ${JSON.stringify(query)}`)

  for (const element of result) {
    convertRawData(element, false)
  }

  return {
    total: countResult,
    page,
    perPage,
    result: helper.clearObject(result)
  }
}

searchTermsOfUses.schema = {
  criteria: Joi.object().keys({
    page: Joi.page(),
    perPage: Joi.perPage(),
    legacyId: Joi.numberId().optional(),
    userId: Joi.number(),
    title: Joi.string()
  }).required()
}

/**
 * Search all users signed a term of use
 * @params {String} termsOfUseId
 * @params {Object} query
 * @returns {Object} Return the search result containing the result array and pagination info
 */
async function getTermsOfUseUsers (termsOfUseId, query) {
  const page = query.page > 0 ? query.page : 1
  const perPage = query.perPage > 0 ? query.perPage : 20

  const where = {}
  if (query.userId) {
    const userIds = query.userId.split(',').map(s => s.trim())
    where.userId = { [models.Sequelize.Op.in]: userIds }
  }

  if (query.signedAtFrom && query.signedAtTo) {
    where.created = {
      [models.Sequelize.Op.and]: [
        { [models.Sequelize.Op.gte]: query.signedAtFrom },
        { [models.Sequelize.Op.lte]: query.signedAtTo }
      ]
    }
  } else if (query.signedAtFrom) {
    where.created = { [models.Sequelize.Op.gte]: query.signedAtFrom }
  } else if (query.signedAtTo) {
    where.created = { [models.Sequelize.Op.lte]: query.signedAtTo }
  }

  const termsOfUse = await TermsOfUse.findOne({
    where: { id: termsOfUseId, deletedAt: null }
  })

  if (!termsOfUse) {
    throw new errors.NotFoundError(`Terms of use with id: ${termsOfUseId} doesn't exists.`)
  }

  const countResult = await termsOfUse.countUserTermsOfUseXrefs({
    where
  })

  const users = await termsOfUse.getUserTermsOfUseXrefs({
    attributes: ['userId'],
    where,
    limit: perPage,
    offset: (page - 1) * perPage,
    raw: true
  })

  return {
    total: countResult,
    page,
    perPage,
    result: users.map(user => user.userId)
  }
}

getTermsOfUseUsers.schema = {
  termsOfUseId: Joi.string().guid(),
  query: Joi.object().keys({
    page: Joi.page(),
    perPage: Joi.perPage(),
    userId: Joi.string(),
    signedAtFrom: Joi.date(),
    signedAtTo: Joi.date()
  })
}

/**
 * Sign a term for a user
 * @params {String} termsOfUseId
 * @params {Object} user
 * @returns {Object} Return successful message
 */
async function signTermsOfUseUser (termsOfUseId, user) {
  return agreeTermsOfUse(user, termsOfUseId)
}

signTermsOfUseUser.schema = {
  termsOfUseId: Joi.string().guid(),
  user: Joi.object().keys({
    userId: Joi.number().required()
  }).required()
}

/**
 * Unsign a term for a user
 * @params {String} termsOfUseId
 * @params {Number} userId
 * @returns {Object} Return successful message
 */
async function unsignTermsOfUseUser (termsOfUseId, userId) {
  return deleteAgreeTermsOfUse(termsOfUseId, userId)
}

unsignTermsOfUseUser.schema = {
  termsOfUseId: Joi.string().guid(),
  userId: Joi.number()
}

/**
 * List all terms of use types
 * @returns {Array} Return an array of term types
 */
async function getTermsOfUseTypes () {
  return TermsOfUseType.findAll({ raw: true })
}

/**
 * List all terms of use agreeability types
 * @returns {Array} Return an array of term types
 */
async function getTermsOfUseAgreeabilityTypes () {
  return TermsOfUseAgreeabilityType.findAll({ raw: true })
}

/**
 * Fetch one agreeability type
 * @returns {Object} Return an array of term types
 */
async function getTermsOfUseAgreeabilityType (id) {
  const obj = await TermsOfUseAgreeabilityType.findOne({ where: { id }, raw: true })

  if (!obj) {
    throw new errors.NotFoundError(`Agreeability Type id: ${id} doesn't exist.`)
  }

  return obj
}

module.exports = {
  getTermsOfUse,
  agreeTermsOfUse,
  deleteAgreeTermsOfUse,
  createTermsOfUse,
  partiallyUpdateTermsOfUse,
  fullyUpdateTermsOfUse,
  deleteTermsOfUse,
  searchTermsOfUses,
  getTermsOfUseUsers,
  signTermsOfUseUser,
  unsignTermsOfUseUser,
  getTermsOfUseAgreeabilityType,
  getTermsOfUseAgreeabilityTypes,
  getTermsOfUseTypes
}

// logger.buildService(module.exports)
