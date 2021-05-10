# 0001 BASE
FROM quay.io/esatterwhite/node:12 AS base
COPY ./package.json ./package-lock.json ./pnpm-lock.yaml ./pnpm-workspace.yaml /opt/
COPY ./vendor /opt/vendor
COPY ./packages/skyring /opt/packages/skyring
WORKDIR /opt
RUN pnpm install -r

RUN groupadd --gid 1000 skyring \
  && useradd --uid 1000 --gid skyring --shell /bin/bash --create-home skyring

RUN mkdir -p /var/data/skyring
RUN mkdir -p /opt/packages/skyring/coverage

RUN chown -R skyring:skyring /var/data/skyring
RUN chown -R skyring:skyring /opt/packages/skyring/coverage

VOLUME /opt/packages/skyring/coverage
WORKDIR /opt/packages/skyring

USER 1000
CMD ["node", "index.js"]

