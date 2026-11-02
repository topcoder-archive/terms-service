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
- AUTH0_URL: Auth0 URL, used to get TC M2M token
- AUTH0_AUDIENCE: Auth0 audience, used to get TC M2M token
- TOKEN_CACHE_TIME: Auth0 token cache time, used to get TC M2M token
- AUTH0_CLIENT_ID: Auth0 client id, used to get TC M2M token
- AUTH0_CLIENT_SECRET: Auth0 client secret, used to get TC M2M token
- AUTH0_PROXY_SERVER_URL: Proxy Auth0 URL, used to get TC M2M token
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

## Security update runtime requirements

Use Node.js 26 and `npm ci` (including the committed `.npmrc` and `tools` directory). The production image uses Alpine's maintained Node runtime, installs production dependencies only, and runs as UID 10001.

The shared authentication client is pinned to tc-core-library-js v4. Configure `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_URL`, and `AUTH0_AUDIENCE` for outbound calls. For inbound requests, supply exact `VALID_ISSUERS`, `JWT_AUDIENCE` for RSA user tokens, and an explicit `AUTH_SECRET` of at least 32 bytes if legacy HMAC user tokens are needed. There is no development secret fallback. Existing route roles and scopes remain enforced.

Run `npm run test:security` for local HTTP authentication and outbound-client regression tests, and `npm run test:dependency-compat` for transitive matcher/glob compatibility. Neither requires live credentials or a database. The existing full suite also requires isolated PostgreSQL and DocuSign fixtures.
