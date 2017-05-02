FROM  mhart/alpine-node:7
ENV storage__path /var/data/skyring
ENV NODE_ENV=production
COPY . /opt/skyring
WORKDIR /opt/skyring
RUN apk update && \
    apk upgrade && \
    mkdir -p /var/data/skyring && \
    apk add python make g++ git && \
    npm install

VOLUME /etc
VOLUME /var/data/skyring
CMD ["node", "index.js"]
