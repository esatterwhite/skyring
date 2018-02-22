'use strict'

const Skyring = require('skyring')

const server = new Skyring({
  seeds: ['127.0.0.1:3456']
, node: {
    port: 3456
  , host: '127.0.0.1'
  , app: 'manual'
  }
, nats: {
    hosts: ['nats://localhost:4222']
  }
, storage: {
    backend: 'memdown'
  }
})

server.load().listen(3000, (err) => {
  console.log('server listening http://0.0.0.0:3000')
})

function onSignal() {
  server.close(()=>{
    console.log('shutting down');
  });
}
process.once('SIGINT', onSignal);
process.once('SIGTERM', onSignal);
