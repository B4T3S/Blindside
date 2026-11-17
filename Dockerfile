FROM node:26-alpine

COPY . ./app

WORKDIR /app

RUN npm install
RUN npm run tailwind
RUN npm run bundle

ENTRYPOINT ["npm", "run", "prod"]
