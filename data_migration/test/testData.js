const { v4: uuid } = require('uuid')
const { executeQueryAsync } = require('../src/common/informixWrapper')

async function clearTestData () {
  console.log('Start clear test data on informix database')
  await executeQueryAsync('common_oltp', `delete from project_role_terms_of_use_xref`)
  await executeQueryAsync('common_oltp', `delete from user_terms_of_use_xref where terms_of_use_id > 30000`)
  await executeQueryAsync('common_oltp', `delete from user_terms_of_use_ban_xref where terms_of_use_id > 30000`)
  await executeQueryAsync('informixoltp', `delete from docusign_envelope`)
  await executeQueryAsync('common_oltp', `delete from terms_of_use_docusign_template_xref where terms_of_use_id > 30000`)
  await executeQueryAsync('common_oltp', `delete from terms_of_use_dependency where dependency_terms_of_use_id > 30000 or dependent_terms_of_use_id > 30000`)
  await executeQueryAsync('common_oltp', `delete from terms_of_use where terms_of_use_id > 30000`)
  await executeQueryAsync('common_oltp', `delete from user where user_id >= 300000000 and user_id <= 300001000`)
}

async function generateTerms () {
  for (let i = 30001; i <= 30205; i++) {
    const typeId = Math.floor(Math.random() * 9) + 1
    const agreeId = Math.floor(Math.random() * 4) + 1
    await executeQueryAsync('common_oltp', `insert into terms_of_use(terms_of_use_id, terms_of_use_type_id, title, terms_of_use_agreeability_type_id) values(${i}, ${typeId}, "terms ${i}", ${agreeId})`)
  }
}

async function generateTermsForResource () {
  for (let projectId = 100000; projectId <= 100135; projectId++) {
    const resourceRoleCnt = Math.floor(Math.random() * 9) + 1
    for (let resourceRoleId = 1; resourceRoleId <= resourceRoleCnt; resourceRoleId++) {
      const termTime = Math.floor(Math.random() * 9) + 1
      let termIds = []
      while (termIds.length < termTime) {
        const termId = Math.floor(Math.random() * 205) + 30001
        if (termIds.indexOf(termId) === -1) {
          termIds.push(termId)
        }
      }
      for (let i = 0; i < termTime; i++) {
        const termId = termIds[i]
        const groupTime = Math.floor(Math.random() * 3) + 1
        for (let groupInd = 0; groupInd < groupTime; groupInd++) {
          await executeQueryAsync('common_oltp', `insert into project_role_terms_of_use_xref(project_id, resource_role_id, terms_of_use_id, group_ind) values(${projectId}, ${resourceRoleId}, ${termId}, ${groupInd})`)
        }
      }
    }
  }
}

async function generateTermsOfUseDependency () {
  for (let dependency = 30105; dependency <= 30205; dependency++) {
    const termTime = Math.floor(Math.random() * 9) + 1
    let termIds = []
    while (termIds.length < termTime) {
      const termId = Math.floor(Math.random() * 100) + 30001
      if (termIds.indexOf(termId) === -1) {
        termIds.push(termId)
      }
    }
    for (let i = 0; i < termTime; i++) {
      const termId = termIds[i]
      await executeQueryAsync('common_oltp', `insert into terms_of_use_dependency(dependency_terms_of_use_id, dependent_terms_of_use_id) values(${dependency}, ${termId})`)
    }
  }
}

async function generateDocusignEnvelope () {
  for (let i = 0; i < 9998; i++) {
    let docusignEnvelopeId = uuid()
    let docusignTemplateId = uuid()
    let userId = Math.floor(Math.random() * 1000) + 300000000
    let isCompleted = Math.round(Math.random())
    await executeQueryAsync('informixoltp', `insert into docusign_envelope(docusign_envelope_id, docusign_template_id, user_id, is_completed) values("${docusignEnvelopeId}", "${docusignTemplateId}", ${userId}, ${isCompleted})`)
  }
}

async function generateDocusignTemplateXref () {
  for (let i = 30001; i <= 30100; i += 5) {
    let docusignTemplateId = uuid()
    await executeQueryAsync('common_oltp', `insert into terms_of_use_docusign_template_xref(terms_of_use_id, docusign_template_id) values(${i}, "${docusignTemplateId}")`)
  }
}

async function generateUserTerms () {
  for (let userId = 300000000; userId <= 300001000; userId++) {
    await executeQueryAsync('common_oltp', `insert into user(user_id, handle, status) values(${userId}, "handle${userId}", "A")`)
  }
  for (let i = 30001; i <= 30200; i++) {
    const leap1 = Math.round(Math.random() * 9) + 10
    for (let userId = 300000000; userId <= 300001000; userId += leap1) {
      await executeQueryAsync('common_oltp', `insert into user_terms_of_use_xref(user_id, terms_of_use_id) values(${userId}, ${i})`)
    }
    const leap2 = Math.round(Math.random() * 50) + 200
    for (let userId = 300000000; userId <= 300001000; userId += leap2) {
      await executeQueryAsync('common_oltp', `insert into user_terms_of_use_ban_xref(user_id, terms_of_use_id) values(${userId}, ${i})`)
    }
  }
}

async function generateTestData () {
  await clearTestData()
  console.log('Start generate test data on informix database')
  await generateTerms()
  await generateTermsOfUseDependency()
  await generateDocusignEnvelope()
  await generateDocusignTemplateXref()
  await generateUserTerms()
  await generateTermsForResource()
}

generateTestData()
  .then(() => {
    console.log('Done')
  })
  .catch(e => {
    console.log(e)
  })
