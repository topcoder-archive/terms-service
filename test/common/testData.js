/*
 * Test data to be used in tests
 */

const { termsOfUseIdsMapping, agreeabilityTypeIdsMapping } = require('../../src/test-data')

const token = {
  user1: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlcyI6WyJUb3Bjb2RlciBVc2VyIiwiQ29ubmVjdCBTdXBwb3J0IiwiYWRtaW5pc3RyYXRvciIsInRlc3RSb2xlIiwiYWFhIiwidG9ueV90ZXN0XzEiLCJDb25uZWN0IE1hbmFnZXIiLCJDb25uZWN0IEFkbWluIiwiY29waWxvdCIsIkNvbm5lY3QgQ29waWxvdCBNYW5hZ2VyIl0sImlzcyI6Imh0dHBzOi8vYXBpLnRvcGNvZGVyLWRldi5jb20iLCJoYW5kbGUiOiJUb255SiIsImV4cCI6MTg2NTY4MTkyMCwidXNlcklkIjoiODU0Nzg5OSIsImlhdCI6MTg1NTY4MTMyMCwiZW1haWwiOiJhamVmdHNAdG9wY29kZXIuY29tIiwianRpIjoiMTlhMDkzNzAtMjk4OC00N2I4LTkxODktMGRhODVjNjM0ZWQyIn0.Svg6IRCBexECP1cEMsjfmm0QxMIyt0fUEDcJESkZl2Y',
  user2: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlcyI6WyJUb3Bjb2RlciBVc2VyIl0sImlzcyI6Imh0dHBzOi8vYXBpLnRvcGNvZGVyLWRldi5jb20iLCJoYW5kbGUiOiJjYWxsbWVrYXRvb3RpZSIsImV4cCI6MTg2NTY4MTkyMCwidXNlcklkIjoiMjMxMjQzMjkiLCJpYXQiOjE4NTU2ODEzMjAsImVtYWlsIjoiY2FsbG1la2F0b290aWVAdG9wY29kZXIuY29tIiwianRpIjoiMTlhMDkzNzAtMjk4OC00N2I4LTkxODktMGRhODVjNjM0ZWQyIn0.pbVuyU68GBgrnixr-IWr6xai_hiBIpbrMj5NbF1yChg',
  user3: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlcyI6WyJUb3Bjb2RlciBVc2VyIl0sImlzcyI6Imh0dHBzOi8vYXBpLnRvcGNvZGVyLWRldi5jb20iLCJoYW5kbGUiOiJob2hvc2t5IiwiZXhwIjoxODY1NjgxOTIwLCJ1c2VySWQiOiIxNjA5NjgyMyIsImlhdCI6MTg1NTY4MTMyMCwiZW1haWwiOiJjYWxsbWVrYXRvb3RpZUB0b3Bjb2Rlci5jb20iLCJqdGkiOiIxOWEwOTM3MC0yOTg4LTQ3YjgtOTE4OS0wZGE4NWM2MzRlZDIifQ.gHo0ZlrbzQTzfEtGYDjR0SrXgBRXytCQ28gHkE5Zvew',
  user4: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlcyI6WyJUb3Bjb2RlciBVc2VyIl0sImlzcyI6Imh0dHBzOi8vYXBpLnRvcGNvZGVyLWRldi5jb20iLCJoYW5kbGUiOiJHaG9zdGFyIiwiZXhwIjoxODY1NjgxOTIwLCJ1c2VySWQiOiIxNTE3NDMiLCJpYXQiOjE4NTU2ODEzMjAsImVtYWlsIjoiZ2hvc3RhckB0b3Bjb2Rlci5jb20iLCJqdGkiOiIxOWEwOTM3MC0yOTg4LTQ3YjgtOTE4OS0wZGE4NWM2MzRlZDIifQ.wIJN7w0RlqpZx_1GhpeG-U516QeKD4LNbhCnubV5WuY',
  invalidUser: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlcyI6WyJUb3Bjb2RlciBVc2VyIl0sImlzcyI6Imh0dHBzOi8vYXBpLnRvcGNvZGVyLWRldi5jb20iLCJoYW5kbGUiOiJHaG9zdGFyIiwiZXhwIjoxODY1NjgxOTIwLCJ1c2VySWQiOiIxMTExMTE1MTc0MyIsImlhdCI6MTg1NTY4MTMyMCwiZW1haWwiOiJnaG9zdGFyQHRvcGNvZGVyLmNvbSIsImp0aSI6IjE5YTA5MzcwLTI5ODgtNDdiOC05MTg5LTBkYTg1YzYzNGVkMiJ9.cxUiRi0MagUfaxZ-0aLYPua9YcQoFYy1ixB_lmSbeFM',
  m2mRead: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3RvcGNvZGVyLWRldi5hdXRoMC5jb20vIiwic3ViIjoiZW5qdzE4MTBlRHozWFR3U08yUm4yWTljUVRyc3BuM0JAY2xpZW50cyIsImF1ZCI6Imh0dHBzOi8vbTJtLnRvcGNvZGVyLWRldi5jb20vIiwiaWF0IjoxODU2MDk1OTYzLCJleHAiOjE4NjYxODIzNjMsImF6cCI6ImVuancxODEwZUR6M1hUd1NPMlJuMlk5Y1FUcnNwbjNCIiwic2NvcGUiOiJyZWFkOnRlcm1zIiwiZ3R5IjoiY2xpZW50LWNyZWRlbnRpYWxzIiwidXNlcklkIjpudWxsLCJzY29wZXMiOlsicmVhZDp0ZXJtcyJdLCJpc01hY2hpbmUiOnRydWV9.iDb0pA2Shw4_P7TDoI0PFIeZHjwAuize5io7G8TAyNQ',
  m2mWrite: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3RvcGNvZGVyLWRldi5hdXRoMC5jb20vIiwic3ViIjoiZW5qdzE4MTBlRHozWFR3U08yUm4yWTljUVRyc3BuM0JAY2xpZW50cyIsImF1ZCI6Imh0dHBzOi8vbTJtLnRvcGNvZGVyLWRldi5jb20vIiwiaWF0IjoxODU2MDk1OTYzLCJleHAiOjE4NjYxODIzNjMsImF6cCI6ImVuancxODEwZUR6M1hUd1NPMlJuMlk5Y1FUcnNwbjNCIiwic2NvcGUiOiJ3cml0ZTp0ZXJtcyIsImd0eSI6ImNsaWVudC1jcmVkZW50aWFscyIsInVzZXJJZCI6bnVsbCwic2NvcGVzIjpbIndyaXRlOnRlcm1zIl0sImlzTWFjaGluZSI6dHJ1ZX0.VlZ6T60Boegop2YwGFXBzjMr4UXqCpy-6FobaZKJ4KU'
}

const user = {
  user1: {
    roles: [
      'Topcoder User',
      'Connect Support',
      'administrator',
      'testRole',
      'aaa',
      'tony_test_1',
      'Connect Manager',
      'Connect Admin',
      'copilot',
      'Connect Copilot Manager'
    ],
    iss: 'https://api.topcoder-dev.com',
    handle: 'TonyJ',
    exp: 1565681920,
    userId: '8547899',
    iat: 1555681320,
    email: 'ajefts@topcoder.com',
    jti: '19a09370-2988-47b8-9189-0da85c634ed2'
  },
  user2: {
    roles: [
      'Topcoder User'
    ],
    iss: 'https://api.topcoder-dev.com',
    handle: 'callmekatootie',
    exp: 1565681920,
    userId: '23124329',
    iat: 1555681320,
    email: 'callmekatootie@topcoder.com',
    jti: '19a09370-2988-47b8-9189-0da85c634ed2'
  },
  user3: {
    roles: [
      'Topcoder User'
    ],
    iss: 'https://api.topcoder-dev.com',
    handle: 'hohosky',
    exp: 1565681920,
    userId: '16096823',
    iat: 1555681320,
    email: 'callmekatootie@topcoder.com',
    jti: '19a09370-2988-47b8-9189-0da85c634ed2'
  },
  user4: {
    roles: [
      'Topcoder User'
    ],
    iss: 'https://api.topcoder-dev.com',
    handle: 'Ghostar',
    exp: 1565681920,
    userId: '151743',
    iat: 1555681320,
    email: 'ghostar@topcoder.com',
    jti: '19a09370-2988-47b8-9189-0da85c634ed2'
  },
  invalidUser: {
    roles: [
      'Topcoder User'
    ],
    iss: 'https://api.topcoder-dev.com',
    handle: 'Ghostar',
    exp: 1565681920,
    userId: '11111151743',
    iat: 1555681320,
    email: 'ghostar@topcoder.com',
    jti: '19a09370-2988-47b8-9189-0da85c634ed2'
  },
  m2mRead: {
    iss: 'https://topcoder-dev.auth0.com/',
    sub: 'enjw1810eDz3XTwSO2Rn2Y9cQTrspn3B@clients',
    aud: 'https://m2m.topcoder-dev.com/',
    iat: 1556095963,
    exp: 1566182363,
    azp: 'enjw1810eDz3XTwSO2Rn2Y9cQTrspn3B',
    scope: 'read:terms',
    gty: 'client-credentials',
    userId: null,
    scopes: ['read:terms'],
    isMachine: true
  },
  m2mWrite: {
    iss: 'https://topcoder-dev.auth0.com/',
    sub: 'enjw1810eDz3XTwSO2Rn2Y9cQTrspn3B@clients',
    aud: 'https://m2m.topcoder-dev.com/',
    iat: 1556095963,
    exp: 1566182363,
    azp: 'enjw1810eDz3XTwSO2Rn2Y9cQTrspn3B',
    scope: 'write:terms',
    gty: 'client-credentials',
    userId: null,
    scopes: ['write:terms'],
    isMachine: true
  }
}

const request = {
  createTermsOfUse: {
    requiredFields: ['typeId', 'title', 'agreeabilityTypeId'],
    reqBody: {
      text: 'text',
      typeId: 10,
      title: 'title',
      url: 'url',
      agreeabilityTypeId: agreeabilityTypeIdsMapping[4],
      docusignTemplateId: 'test-template-1'
    }
  },
  updateTermsOfUse: {
    requiredFields: ['typeId', 'title', 'agreeabilityTypeId'],
    reqBody: {
      text: 'update-text',
      typeId: 11,
      title: 'update-title',
      url: 'update-url',
      agreeabilityTypeId: agreeabilityTypeIdsMapping[4],
      docusignTemplateId: 'update-test-template-1'
    }
  },
  searchTermsOfUse: {
    response: {
      result: [
        {
          id: termsOfUseIdsMapping[21306],
          legacyId: 21306,
          title: 'Standard Terms for Topcoder Competitions v2.2',
          url: '',
          agreeabilityTypeId: '2c78f834-61f4-11ea-bd4f-3c15c2e2c206',
          agreeabilityType: 'Electronically-agreeable'
        },
        {
          id: termsOfUseIdsMapping[21307],
          legacyId: 21307,
          title: 'Standard Terms for Topcoder Competitions v2.2',
          url: '',
          agreeabilityTypeId: '2c78f834-61f4-11ea-bd4f-3c15c2e2c206',
          agreeabilityType: 'Electronically-agreeable'
        },
        {
          id: termsOfUseIdsMapping[21303],
          legacyId: 21303,
          title: 'Standard Terms for Topcoder Competitions v2.2',
          url: '',
          agreeabilityTypeId: '2c78f834-61f4-11ea-bd4f-3c15c2e2c206',
          agreeabilityType: 'Electronically-agreeable'
        },
        {
          id: termsOfUseIdsMapping[40001],
          legacyId: 40001,
          title: 'title',
          url: 'url',
          agreeabilityTypeId: '2c78f834-61f4-11ea-bd4f-3c15c2e2c206',
          agreeabilityType: 'Electronically-agreeable'
        },
        {
          id: termsOfUseIdsMapping[40002],
          legacyId: 40002,
          title: 'title',
          url: 'url',
          agreeabilityTypeId: '2c78f834-61f4-11ea-bd4f-3c15c2e2c206',
          agreeabilityType: 'Electronically-agreeable'
        }
      ]
    }
  },
  createTermsForResource: {
    requiredFields: ['reference', 'referenceId', 'tag', 'termsOfUseIds'],
    reqBody: {
      reference: 'challenge',
      referenceId: '12346',
      tag: 'copilot',
      termsOfUseIds: [termsOfUseIdsMapping[21307]]
    }
  },
  updateTermsForResource: {
    requiredFields: ['reference', 'referenceId', 'tag', 'termsOfUseIds'],
    reqBody: {
      reference: 'new-reference',
      referenceId: '11111',
      tag: 'tester',
      termsOfUseIds: [termsOfUseIdsMapping[21303], termsOfUseIdsMapping[21304]]
    }
  },
  searchTermsForResource: {
    response: {
      result: [
        {
          id: 'a41d1974-5823-473e-bacb-7eed17500ad3',
          reference: 'challenge',
          referenceId: '12345',
          tag: 'manager',
          termsOfUseIds: [
            termsOfUseIdsMapping[21307]
          ],
          createdBy: 'admin'
        },
        {
          id: 'a41d1974-5823-473e-bacb-7eed17500ad2',
          reference: 'challenge',
          referenceId: '12345',
          tag: 'copilot',
          termsOfUseIds: [
            termsOfUseIdsMapping[21307]
          ],
          createdBy: 'admin'
        },
        {
          id: 'a41d1974-5823-473e-bacb-7eed17500ad1',
          reference: 'challenge',
          referenceId: '12345',
          tag: 'submitter',
          termsOfUseIds: [
            termsOfUseIdsMapping[21303],
            termsOfUseIdsMapping[21304]
          ],
          createdBy: 'admin'
        }
      ]
    }
  },
  checkTermsForResource: {
    singleTag: {
      response: {
        result: [
          {
            tag: 'submitter',
            allAgreed: false,
            unAgreedTerms: [
              {
                id: termsOfUseIdsMapping[21304],
                legacyId: 21304,
                title: 'Standard Terms for Topcoder Competitions v2.2',
                url: '',
                text: 'another text',
                agreed: false,
                typeId: 10,
                // docusignTemplateId: '100', // NOTE: this field was deleted by convertRawData() as agreeabilityTypeId !== env.AGREE_FOR_DOCUSIGN_TEMPLATE
                agreeabilityTypeId: '301a36ec-61f4-11ea-bc96-3c15c2e2c206',
                agreeabilityType: 'Docusign-template'
              }
            ]
          }
        ]
      }
    },
    multipleTags: {
      response: {
        result: [
          {
            tag: 'submitter',
            allAgreed: false,
            unAgreedTerms: [
              {
                id: termsOfUseIdsMapping[21303],
                legacyId: 21303,
                title: 'Standard Terms for Topcoder Competitions v2.2',
                url: '',
                text: 'text',
                agreed: false,
                typeId: 10,
                agreeabilityTypeId: '2c78f834-61f4-11ea-bd4f-3c15c2e2c206',
                agreeabilityType: 'Electronically-agreeable'
              },
              {
                id: termsOfUseIdsMapping[21304],
                legacyId: 21304,
                title: 'Standard Terms for Topcoder Competitions v2.2',
                url: '',
                text: 'another text',
                agreed: false,
                typeId: 10,
                // docusignTemplateId: '100', // NOTE: this field was deleted by convertRawData() as agreeabilityTypeId !== env.AGREE_FOR_DOCUSIGN_TEMPLATE
                agreeabilityTypeId: '301a36ec-61f4-11ea-bc96-3c15c2e2c206',
                agreeabilityType: 'Docusign-template'
              }
            ]
          },
          {
            tag: 'copilot',
            allAgreed: true,
            unAgreedTerms: []
          }
        ]
      }
    }
  },
  searchTermsOfUseByUserId23124329: {
    response: {
      result: [
        {
          id: termsOfUseIdsMapping[21306],
          legacyId: 21306,
          title: 'Standard Terms for Topcoder Competitions v2.2',
          url: '',
          agreeabilityTypeId: agreeabilityTypeIdsMapping[3],
          agreeabilityType: 'Electronically-agreeable'
        },
        {
          id: termsOfUseIdsMapping[21307],
          legacyId: 21307,
          title: 'Standard Terms for Topcoder Competitions v2.2',
          url: '',
          agreeabilityTypeId: agreeabilityTypeIdsMapping[3],
          agreeabilityType: 'Electronically-agreeable'
        }
      ]
    }
  },
  getTermsTypes: {
    response: {
      result: [
        { id: 1, name: 'High School Web Site Terms' },
        { id: 2, name: 'Corp Site Terms of Use' },
        { id: 3, name: 'General Product Terms of Use' },
        { id: 4, name: 'Product Terms of Use' },
        { id: 5, name: 'Contest' },
        { id: 6, name: 'Reviewer Terms' },
        { id: 7, name: 'Testing Tool NDA' },
        { id: 8, name: 'Site Terms of Use' },
        { id: 9, name: 'Download Submission Terms of Use' }
      ]
    }
  },
  getTermsOfUseLegacyId21306Users: {
    response: {
      result: [
        23124329,
        151743,
        16096823
      ]
    }
  }
}

module.exports = {
  token,
  user,
  request
}
