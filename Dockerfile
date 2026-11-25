FROM node:26-alpine

COPY . ./app

ARG APP_VERSION=dev
ENV APP_VERSION=$APP_VERSION

WORKDIR /app

RUN npm install
RUN npm run tailwind
RUN npm run bundle

ENTRYPOINT ["npm", "run", "prod"]
