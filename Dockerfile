FROM node:20.13.1 as base
WORKDIR /app
COPY package.json .


FROM base as dev
RUN npm i
COPY . .
CMD [ "npm","run","dev" ]

FROM base as prod
RUN npm i --only=production
COPY . .
CMD [ "npm","run","start" ]