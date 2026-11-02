ARG NODE_VERSION=26.12.1
FROM node:${NODE_VERSION}-alpine AS build
WORKDIR /terms-service
COPY package.json package-lock.json .npmrc ./
COPY tools ./tools
RUN npm ci
COPY . .
RUN npm run test:dependency-compat && npm run test:security && npm prune --omit=dev

FROM alpine:3.24 AS production
ARG NODE_VERSION
ENV NODE_ENV=production
WORKDIR /terms-service
RUN apk upgrade --no-cache \
    && apk add --no-cache ca-certificates "nodejs-current~${NODE_VERSION%%.*}" \
    && addgroup -S -g 10001 app \
    && adduser -S -D -u 10001 -G app -h /home/app app
COPY --from=build --chown=app:app /terms-service/package.json /terms-service/package-lock.json ./
COPY --from=build --chown=app:app /terms-service/node_modules ./node_modules
COPY --from=build --chown=app:app /terms-service/app-bootstrap.js ./app-bootstrap.js
COPY --from=build --chown=app:app /terms-service/app-constants.js ./app-constants.js
COPY --from=build --chown=app:app /terms-service/app-routes.js ./app-routes.js
COPY --from=build --chown=app:app /terms-service/app.js ./app.js
COPY --from=build --chown=app:app /terms-service/config ./config
COPY --from=build --chown=app:app /terms-service/src ./src
COPY --from=build --chown=app:app /terms-service/docs ./docs
USER app
EXPOSE 3000
CMD ["node", "app.js"]
