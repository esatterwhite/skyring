# 0001 BASE
FROM quay.io/esatterwhite/node:12 AS base
COPY ./package.json ./package-lock.json ./pnpm-lock.yaml ./pnpm-workspace.yaml /opt/
COPY ./vendor /opt/vendor
COPY ./packages/skyring /opt/packages/skyring
WORKDIR /opt
RUN pnpm install -r

# 0002 TEST
FROM quay.io/esatterwhite/node:12 AS test
ENV storage__path /var/data/skyring

RUN groupadd --gid 1000 skyring \
  && useradd --uid 1000 --gid skyring --shell /bin/bash --create-home skyring

COPY --from=base --chown=skyring:skyring /opt /opt/

RUN mkdir -p /var/data/skyring
RUN mkdir -p /opt/packages/skyring/coverage

RUN chown -R skyring:skyring /var/data/skyring
RUN chown -R skyring:skyring /opt/packages/skyring/coverage

VOLUME /opt/packages/skyring/coverage
WORKDIR /opt/packages/skyring
USER 1000
CMD ["node", "index.js"]

# 0003 PRUNE
FROM quay.io/esatterwhite/node:12 AS prune
COPY --from=base /opt/packages/skyring /opt/app
WORKDIR /opt/app
RUN pnpm install --prod

# 0004 RELEASE
FROM debian:buster-slim as skyring
ENV storage__path /var/data/skyring

LABEL org.label-schema.schema-version="1.0"
LABEL org.label-schema.url="https://esatterwhite.github.io/skyring"
LABEL org.label-schema.build-date="${BUILD_DATE}"
LABEL org.label-schema.maintainer="Eric Satterwhite <esatterwhite@wi.rr.com"
LABEL org.label-schema.name="Skyring"
LABEL org.label-schema.description="Distributed timers as a service"
LABEL org.label-schema.vcs-url="https://github.com/esatterwhite/skyring"
LABEL org.label-schema.vcs-ref="${VCS_REF}"
LABEL org.label-schema.vendor="Skyring"
LABEL org.label-schema.version="${BUILD_VERSION}"
LABEL org.label-schema.docker.cmd="docker run us.gcr.io/logdna-k8s/es-optimizer-job"

RUN groupadd --gid 1000 skyring \
  && useradd --uid 1000 --gid skyring --shell /bin/bash --create-home skyring

RUN mkdir -p /var/data/skyring
RUN chown -R skyring:skyring /var/data/skyring

WORKDIR /opt/app
VOLUME /etc
VOLUME /var/data/skyring

COPY --from=prune /usr/local/bin /usr/local/bin
COPY --from=prune /usr/local/include/node /usr/local/include
COPY --from=prune /usr/local/lib/node_modules/ /usr/local/lib/node_modules/
COPY --from=prune --chown=skyring:skyring /opt/app /opt/app
USER 1000
CMD ["node", "index.js"]
