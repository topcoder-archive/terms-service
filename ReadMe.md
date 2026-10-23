# Topcoder Terms API

## Dependencies

- nodejs https://nodejs.org/en/ (v10)
- Postgres
- Docusign

## Configuration

Configuration for the application is at `config/default.js`.
The following parameters can be set in config files or in env variables:

- LOG_LEVEL: the log level, default is 'debug'
- PORT: the server port, default is 3000
- AUTH_SECRET: The authorization secret used during token verification.
- VALID_ISSUERS: The valid issuer of tokens, a json array contains valid issuer.
- POSTGRES_URL: Postgres database url.
- USE_KEYCLOAK: `true` gets M2M tokens from Keycloak (KEYCLOAK_* below); unset or `false` gets them from Auth0 (AUTH0_* below). See "Provider switch" below.
- AUTH0_URL: Auth0 URL, used to get TC M2M token when USE_KEYCLOAK is not true, default is 'https://topcoder-dev.auth0.com/oauth/token'
- AUTH0_AUDIENCE: Auth0 audience, used to get TC M2M token when USE_KEYCLOAK is not true, default is 'https://m2m.topcoder-dev.com/'
- TOKEN_CACHE_TIME: Auth0 token cache time, passed to the Bus wrapper, default is 120
- AUTH0_CLIENT_ID: Auth0 client id, used to get TC M2M token when USE_KEYCLOAK is not true
- AUTH0_CLIENT_SECRET: Auth0 client secret, used to get TC M2M token when USE_KEYCLOAK is not true
- AUTH0_PROXY_SERVER_URL: Proxy Auth0 URL, used to get TC M2M token when USE_KEYCLOAK is not true, default is 'https://topcoder-dev.auth0.com/oauth/token'
- KEYCLOAK_ISSUER, KEYCLOAK_AUDIENCE, KEYCLOAK_TOKEN_URL: Keycloak realm issuer, audience and managed token endpoint, required when USE_KEYCLOAK=true
- KEYCLOAK_CLIENT_ID, KEYCLOAK_CLIENT_SECRET, KEYCLOAK_SCOPE: this service's Keycloak client credentials and optional scope, used when USE_KEYCLOAK=true
- USER_API_URL: User api url, default is 'https://api.topcoder-dev.com/v3/users'
- BUSAPI_URL: the Topcoder bus api base url.
- KAFKA_ERROR_TOPIC: the error topic used when posting Kafka event.
- KAFKA_MESSAGE_ORIGINATOR: the Kafka message originator.
- TERMS_CREATE_TOPIC: terms create topic name.
- TERMS_UPDATE_TOPIC: terms update topic name.
- DOCUSIGN: Contain configuration relate to DOCUSIGN API, you don't need to modify anything, refer `config/default.js` for more information
- EMAIL: Contain configuration relate to a simple SMTP server(Host, Port, UserName, Password and etc, refer `config/default.js` for more information)

Configuration for testing is at `config/test.js`, only add such new configurations different from `config/default.js`
- WAIT_TIME: wait time used in test, default is 1500 or 1.5 second

## Local environment

Copy the `env.sh.sample` to `env.sh`, set the configuration variables and run `source env.sh`. You will need to create a demo account and templates for docusign related configuration.

## Postgres Database Setup
Go to https://www.postgresql.org/ download and install the Postgres.
Modify `POSTGRES_URL` under `config/default.js` to meet your environment.
Run `npm run init-db` to create table

## Docusign Callback Listener
Docusign Connect Listener is a standalone service under docusign_callback folder.
The standalone pure node.js listener that listens to incoming Docusign Connect xml messages
It read the xml message, parses the appropriate content, and makes an equivalent POST in JSON to the v5 docusign callback endpoint
Command:
- `npm install` Install dependencies
- `npm run lint` Run lint
- `npm run lint:fix` Run lint fix
For testing the listener, you need to start the app(refer next section `Local Deployment`) and listener(Run `npm start` in docusign_callback folder)
Once App is running at `http://localhost:3000` and Listener is running at `http://localhost:8081`,
run `npm run test` under docusign_callback folder

## Local Deployment

- Install dependencies `npm install`
- Run lint `npm run lint`
- Run lint fix `npm run lint:fix`
- Setup process environment `source env.sh`
- Clear and init db `npm run init-db`
- Insert test data `npm run test-data`
- Start app `npm start`
- App is running at `http://localhost:3000`

## Testing
#### You need to `stop` the app and run command `source env.sh` before running unit or e2e tests.
- Run `npm run test` to execute unit tests and generate coverage report.
- RUN `npm run e2e` to execute e2e tests and generate coverage report.

## Verification
Refer to the verification document `Verification.md`

## Keycloak migration branch

`keycloak_m2M` pins shared core 4.0.0-keycloak.2 at
`112d54a3ed66423e7305e94e174937823e76124e`, including the Bus wrapper dependency
(through the `overrides` entry in `package.json`). Run `nvm use` (Node 22.23.2).

### Provider switch: `USE_KEYCLOAK`

`USE_KEYCLOAK=true` makes the service get its M2M tokens (Member lookups and Bus
publishing) from Keycloak, using `KEYCLOAK_TOKEN_URL`, `KEYCLOAK_AUDIENCE`,
`KEYCLOAK_CLIENT_ID` and `KEYCLOAK_CLIENT_SECRET` (optional `KEYCLOAK_SCOPE`
narrows the client's defaults). `KEYCLOAK_ISSUER` is also required; missing
settings fail at startup. Use the managed HTTPS endpoint. Issued RS256 tokens
must match the configured issuer/audience/client/scopes before shared core
caches or forwards them.

Unset or `false` restores the Auth0 behaviour from before the migration, for both
paths: `AUTH0_URL`, `AUTH0_AUDIENCE`, `AUTH0_PROXY_SERVER_URL`, `AUTH0_CLIENT_ID`
and `AUTH0_CLIENT_SECRET`, with the defaults listed under Configuration, plus
`TOKEN_CACHE_TIME` for the Bus wrapper. No `KEYCLOAK_*` setting is required.

`tc-core-library-js` reads the flag (`auth.useKeycloak`) from config, and
`src/common/helper.js` fills the Bus wrapper's `AUTH0_*` options from
`auth.wrapperSettings`, so the service, the wrapper and the core always agree.
Any value other than `true`/`false` fails at startup. In DEV the flag is
`/config/common/global-appvar/USE_KEYCLOAK`; the CircleCI deploy loads
`/config/terms-service/appvar` and `/config/common/global-appvar`.

Incoming machine tokens: with `true`, Keycloak tokens are accepted, plus Auth0
tokens while `LEGACY_M2M_ISSUERS`/`LEGACY_M2M_AUDIENCE` are set. With `false`,
Auth0 tokens are accepted through `LEGACY_M2M_*`, plus Keycloak tokens while
`KEYCLOAK_ISSUER` and `KEYCLOAK_AUDIENCE` are set, so callers that have not
switched yet keep working. The route scope rules below apply in both modes.

**Rollback:** set `USE_KEYCLOAK=false` and force a new deployment so tasks re-read
SSM. No code or dependency change is needed. Keep the Auth0 settings above in SSM
until Keycloak has been accepted. The core never retries a failed Keycloak request
against Auth0; rolling back is always this explicit change.

Inbound services require exact `read:terms` or `write:terms` route grants.
Individual terms remain publicly readable without credentials, but supplied
service tokens now require `read:terms`; optional authentication no longer
bypasses machine scope checks. Agreement and DocuSign signing routes remain
member-only. Normalized services have no member ID/handle and audit records use
their verified subject. Member sessions retain roles/ownership rules: configure
`AUTH_SECRET`, `VALID_ISSUERS`, and `AUTH_USER_AUDIENCES` (JSON array), or explicit
`ALLOW_LEGACY_USER_AUDIENCE=true` for legacy member audience compatibility.
DocuSign's own JWT authentication is independent and unchanged.

Outbound clients need Member read and `write:bus_api` grants. Configure each
workload before future deployment. CI excludes this branch; no DEV service is
deployed. Validate with `npm run lint`, `npm run build` (JavaScript syntax), and
`npm run test:keycloak` (which also covers both `USE_KEYCLOAK` modes for the
outbound paths). Existing unit/E2E suites additionally require an isolated
PostgreSQL database and fixture integrations; auth tests use local signed tokens.

Migration validation: lint/build, five auth/real-HTTP tests and live DEV direct
and nested Bus-provider checks pass. The PostgreSQL-backed legacy unit suite has
28 passing and 64 failing tests; unchanged commit `062de8cf` with independent
`npm ci` dependencies reproduces the same failures. These involve unconfigured
Bus/DocuSign integrations and existing fixture/log assertions. The legacy E2E
suite uses historical embedded JWTs; the new signed-token HTTP suite covers the
current authentication contract without external writes. Root lint now excludes
the separately packaged `data_migration` tool; existing runtime/test formatting
and an unused import were cleaned to make the required root lint pass.
