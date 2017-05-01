'use strict'

const conf = require('keef')

module.exports = conf.defaults({
  seeds: ["127.0.0.1:3455", "127.0.0.1:3456"]
, storage: {
    backend: "memdown"
  , path: null
  }
, channel: {
    host: "127.0.0.1"
  , port: 3455
  }
, PORT: 3000
, nats: {
    hosts: "127.0.0.1:4222"
  }
})
