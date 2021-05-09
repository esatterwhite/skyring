# 0001 BASE
FROM quay.io/esatterwhite/node:12 AS base
COPY package.json /opt/app/
RUN npm install
COPY . /opt/app
WORKDIR /opt/app


RUN groupadd --gid 1000 skyring \
  && useradd --uid 1000 --gid skyring --shell /bin/bash --create-home skyring

RUN chown -R skyring:skyring /opt/app
WORKDIR /opt/app

USER 1000
CMD ["node", "index.js"]

