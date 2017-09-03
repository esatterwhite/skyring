FROM  mhart/alpine-node:6
COPY . /opt/skyring
WORKDIR /opt/skyring
RUN apk update && \
    apk upgrade && \
    apk add python make g++ git && \
    npm install

RUN mkdir -p /var/data/skyring
VOLUME /var/data/skyring
VOLUME /etc
CMD ["node", "index.js"]
