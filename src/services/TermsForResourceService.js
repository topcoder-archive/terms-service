/**
 * This service provides operations of TermsForResource.
 */

const _ = require('lodash')
const config = require('config')
const Joi = require('joi')
// const uuid = require('uuid/v4')
const { v4: uuid } = require('uuid')
const helper = require('../common/helper')
const errors = require('../common/errors')
const models = require('../models')
const termsOfUseService = require('./TermsOfUseService')

const TermsForResource = models.TermsForResource
const TermsOfUse = models.TermsOfUse

/**
 * Perform validation on terms ids
 * @params {Array} ids an array of terms id
 */
async function validatetemrsOfUseIds (ids) {
  const terms = await TermsOfUse.findAll({
    where: { id: { [models.Sequelize.Op.in]: ids }, deletedAt: null },
    raw: true
  })
  const invalidIds = _.filter(ids, id => _.isUndefined(_.find(terms, { id })))
  if (invalidIds.length > 0) {
    throw new errors.BadRequestError(`The following terms doesn't exist: ${helper.toString(invalidIds)}`)
  }
}

/**
 * Check duplication
 * @params {Object} criteria the tuple identity
 * @params {String} id the id(if provided) of the terms for resource matching the tuple identity
 * @returns {Boolean} flag indicate whether duplication exist.
 */
async function checkDuplicate (criteria, id) {
  const exist = await TermsForResource.findOne({ where: criteria, raw: true })
  if (!_.isNull(exist) && !(id && exist.id === id)) {
    throw new errors.BadRequestError(`Duplicate terms reference for tuple ${helper.toString(criteria)}`)
  }
}

// TermsForResource is unique in tuple(reference, referenceId, tag)
const identityFields = ['reference', 'referenceId', 'tag']

/**
 * Create a terms for resource
 * @params {Object} currentUser the user who perform this operation
 * @params {Object} termsForResource the terms for resource to be created
 * @returns {Object} the created terms for resource
 */
async function createTermsForResource (currentUser, termsForResource) {
  await validatetemrsOfUseIds(termsForResource.termsOfUseIds)
  await checkDuplicate(_.pick(termsForResource, identityFields))

  termsForResource.id = uuid()
  termsForResource.created = new Date()
  termsForResource.createdBy = currentUser.handle || currentUser.sub
  await TermsForResource.create(termsForResource)

  await helper.postEvent(config.RESOURCE_TERMS_CREATE_TOPIC, _.omit(termsForResource, 'createdBy'))

  return termsForResource
}

createTermsForResource.schema = {
  currentUser: Joi.any(),
  termsForResource: Joi.object().keys({
    reference: Joi.string().required(),
    referenceId: Joi.string().required(),
    tag: Joi.string().required(),
    termsOfUseIds: Joi.array().items(Joi.string().guid()).unique().min(1).required()
  }).required()
}

/**
 * Update a terms for resource by id
 * @params {Object} currentUser the user who perform this operation
 * @params {String} termsForResourceId the id
 * @params {Object} data the data to be updated
 * @returns {Object} the updated terms for resource
 */
async function updateTermsForResource (currentUser, termsForResourceId, data) {
  if (data.termsOfUseIds) {
    await validatetemrsOfUseIds(data.termsOfUseIds)
  }

  const termsForResource = await helper.ensureExists(TermsForResource, { id: termsForResourceId }, false)

  await checkDuplicate(_.assign(_.pick(termsForResource, identityFields), _.pick(data, identityFields)), termsForResourceId)

  data.updated = new Date()
  data.updatedBy = currentUser.handle || currentUser.sub
  const updatedTermsForResource = await termsForResource.update(data)
  await helper.postEvent(config.RESOURCE_TERMS_UPDATE_TOPIC, updatedTermsForResource)

  return _.assign(termsForResource.dataValues, data)
}

/**
 * Fully update a terms for resource by id
 * @params {Object} currentUser the user who perform this operation
 * @params {String} termsForResourceId the id
 * @params {Object} data the data to be updated
 * @returns {Object} the updated terms for resource
 */
async function fullyUpdateTermsForResource (currentUser, termsForResourceId, data) {
  return updateTermsForResource(currentUser, termsForResourceId, data)
}

fullyUpdateTermsForResource.schema = {
  currentUser: Joi.any(),
  termsForResourceId: Joi.uuid(),
  data: createTermsForResource.schema.termsForResource
}

/**
 * Partially update a terms for resource by id
 * @params {Object} currentUser the user who perform this operation
 * @params {String} termsForResourceId the id
 * @params {Object} data the data to be updated
 * @returns {Object} the updated terms for resource
 */
async function partiallyUpdateTermsForResource (currentUser, termsForResourceId, data) {
  return updateTermsForResource(currentUser, termsForResourceId, data)
}

partiallyUpdateTermsForResource.schema = {
  currentUser: Joi.any(),
  termsForResourceId: Joi.uuid(),
  data: Joi.object().keys({
    reference: Joi.string(),
    referenceId: Joi.string(),
    tag: Joi.string(),
    termsOfUseIds: Joi.array().items(Joi.string().guid()).unique().min(1)
  }).required()
}

/**
 * Get a terms for resource by id
 * @params {String} termsForResourceId the id
 * @returns {Object} the terms for resource
 */
async function getTermsForResource (termsForResourceId) {
  const entity = await helper.ensureExists(TermsForResource, { id: termsForResourceId })
  return helper.clearObject(entity)
}

getTermsForResource.schema = {
  termsForResourceId: Joi.uuid()
}

/**
 * Delete a terms for resource
 * @params {String} termsForResourceId the id
 */
async function deleteTermsForResource (termsForResourceId) {
  const entity = await helper.ensureExists(TermsForResource, { id: termsForResourceId }, false)
  const deletedEntity = _.cloneDeep(entity)
  await entity.destroy()
  await helper.postEvent(config.RESOURCE_TERMS_DELETE_TOPIC, deletedEntity)
}

deleteTermsForResource.schema = getTermsForResource.schema

/**
 * Checking whether the user has agreed to terms for a resource
 * @params {String} userId the user id
 * @params {Object} criteria the query object, include reference/referenceId/tags
 * @returns {Object} the result object indicate whether user has agreed to terms for a resource in each tag given
 */
async function checkTermsForResourceOfUser (userId, criteria) {
  if (!_.isArray(criteria.tags)) {
    criteria.tags = [criteria.tags]
  }
  const result = []
  const invalidTags = []
  for (const tag of criteria.tags) {
    const termsForResource = await TermsForResource.findOne({ where: _.assign({ tag }, _.pick(criteria, 'reference', 'referenceId')) })
    if (_.isNull(termsForResource)) {
      invalidTags.push(tag)
    } else {
      result.push({ tag, termsOfUseIds: termsForResource.termsOfUseIds })
    }
  }

  if (invalidTags.length > 0) {
    throw new errors.BadRequestError(`No terms for resouce exist with Reference(${criteria.reference}) and ReferenceId(${criteria.referenceId}) for the following tags: ${helper.toString(invalidTags)}`)
  }

  const map = new Map()

  for (const element of result) {
    element.allAgreed = true
    element.unAgreedTerms = []
    for (const termsOfUseId of element.termsOfUseIds) {
      if (!map.get(termsOfUseId)) {
        map.set(termsOfUseId, await termsOfUseService.getTermsOfUse({ userId }, termsOfUseId, {}))
      }
      const termsOfUse = map.get(termsOfUseId)
      if (!termsOfUse.agreed) {
        element.allAgreed = false
        element.unAgreedTerms.push(termsOfUse)
      }
    }
    delete element.termsOfUseIds
  }

  return { result }
}

checkTermsForResourceOfUser.schema = {
  userId: Joi.numberId(),
  criteria: Joi.object().keys({
    reference: Joi.string().required(),
    referenceId: Joi.string().required(),
    tags: Joi.alternatives().try(Joi.string().required(), Joi.array().items(Joi.string()).min(1).required())
  }).required()
}

/**
 * List terms for resource
 * @params {Object} criteria the search criteria, only pagination currently
 * @returns {Object} the search result, contain total/page/perPage and result array
 */
async function searchTermsForResources (criteria) {
  const countResult = await TermsForResource.findOne({
    attributes: [[models.Sequelize.fn('COUNT', models.Sequelize.col('id')), 'total']],
    raw: true
  })

  const result = await TermsForResource.findAll({
    order: [['created', 'DESC']],
    limit: criteria.perPage,
    offset: (criteria.page - 1) * criteria.perPage,
    raw: true
  })

  return {
    total: countResult.total,
    page: criteria.page,
    perPage: criteria.perPage,
    result: helper.clearObject(result)
  }
}

searchTermsForResources.schema = {
  criteria: Joi.object().keys({
    page: Joi.page(),
    perPage: Joi.perPage()
  }).required()
}

module.exports = {
  createTermsForResource,
  partiallyUpdateTermsForResource,
  fullyUpdateTermsForResource,
  getTermsForResource,
  deleteTermsForResource,
  checkTermsForResourceOfUser,
  searchTermsForResources
}

// logger.buildService(module.exports)
