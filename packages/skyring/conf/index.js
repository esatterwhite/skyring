'use strict'

const conf = require('keef')

module.exports = conf.defaults({
  seeds: ["127.0.0.1:3455", "127.0.0.1:3456"]
, transport: []
, storage: {
    backend: "memdown"
  , path: null
  }
, autobalance: false
, channel: {
    host: "127.0.0.1"
  , port: 3455
  }
, port: 3000
, nats: {
    hosts: "127.0.0.1:4222"
  }
, log: {
    level: 'info'
  , pretty: false
  }
})
