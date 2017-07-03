# -- NODE 8
FROM  mhart/alpine-node:8 AS base
ENV storage__path /var/data/skyring
ENV NODE_ENV=production

# -- BUILD
FROM base AS build

COPY package*.json /opt/skyring/
WORKDIR /opt/skyring

RUN apk update && \
    apk upgrade && \
    mkdir -p /var/data/skyring && \
    apk add python make g++ git && \
    npm install

RUN mv node_modules prod_node_modules

FROM base AS skyring
RUN mkdir -p /var/data/skyring
WORKDIR /opt/skyring
VOLUME /etc
VOLUME /var/data/skyring

COPY --from=build /opt/skyring/prod_node_modules ./node_modules
COPY . .
CMD ["node", "index.js"]
