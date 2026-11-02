const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))
const _ = require('lodash')
const path = require('path')
const config = require('config')
const { v4: uuid } = require('uuid')
const models = require('./models')
const logger = require('./common/logger')
const { executeQueryAsync } = require('./common/informixWrapper')
const { resolveTermsOfUseId } = require('./common/utils')

const limit = config.BATCH_COUNT
const filePath = path.join(__dirname, '../progress/progress.json')
const modelName = 'TermsForResource'
const model = models[modelName]

async function persistTermsForResource (records) {
  await model.create({
    id: uuid(),
    reference: 'challenge',
    referenceId: records[0].project_id,
    tag: records[0].resource_role_id,
    termsOfUseIds: _.uniq(await Promise.all(_.map(records, resolveTermsOfUseId('terms_of_use_id')))),
    created: new Date(),
    createdBy: 'admin'
  })
}

async function process (lastSkip) {
  let skip = lastSkip
  let last = []
  while (true) {
    const data = await executeQueryAsync('common_oltp', `select skip ${skip + last.length} limit ${limit} * from project_role_terms_of_use_xref order by project_id asc, resource_role_id asc`)
    if (data.length === 0) {
      break
    }
    if (last.length !== 0) {
      while (data.length > 0) {
        if (data[0].project_id === last[0].project_id && data[0].resource_role_id === last[0].resource_role_id) {
          last.push(data.shift())
        } else {
          break
        }
      }
    }
    if (data.length !== 0) {
      if (last.length !== 0) {
        // handle last array
        await persistTermsForResource(last)
        skip += last.length
        // write skip to file
        logger.info(`migrate from project_role_terms_of_use_xref to ${modelName} ${skip - last.length + 1} ${skip}`)
        await fs.writeFileAsync(filePath, JSON.stringify({ modelName, skip }, null, 4))
        last = []
      }

      while (data.length > 0) {
        if (last.length === 0) {
          last.push(data.shift())
        } else if (data[0].project_id === last[0].project_id && data[0].resource_role_id === last[0].resource_role_id) {
          last.push(data.shift())
        } else {
          // handle last array
          await persistTermsForResource(last)
          skip += last.length
          // write skip to file
          logger.info(`migrate from project_role_terms_of_use_xref to ${modelName} ${skip - last.length + 1} ${skip}`)
          await fs.writeFileAsync(filePath, JSON.stringify({ modelName, skip }, null, 4))
          last = []
        }
      }
    }
  }

  // handle last array
  await persistTermsForResource(last)
  logger.info(`migrate from project_role_terms_of_use_xref to ${modelName} ${skip - last.length + 1} ${skip}`)
  await fs.writeFileAsync(filePath, JSON.stringify({ modelName, finishStep: true }, null, 4))
}

module.exports = {
  process
}
