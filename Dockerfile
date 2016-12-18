FROM  mhart/alpine-node:7
COPY . /opt/skyrim
WORKDIR /opt/skyrim
RUN apk update && \ 
    apk upgrade && \
    apk add python make g++ && \
    npm install

VOLUME /etc
CMD ["node", "index.js"]
