FROM  mhart/alpine-node:7
COPY . /opt/skyring
WORKDIR /opt/skyring
RUN apk update && \ 
    apk upgrade && \
    apk add python make g++ && \
    npm install

VOLUME /etc
CMD ["node", "index.js"]
