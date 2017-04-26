'use strict'
/**
 * Configuration options for skyring. See {@link module:keef} on ways to pass configuration
 * @module skyring/conf
 * @author Eric Satterwhite
 * @since 1.0.0
 **/
const os = require('os')
const path = require('path')

module.exports = {
/**
 * @property {String|String[]} [seeds=127.0.0.1:3455,127.0.0.1:3456] A list of seed nodes to use for bootstrapping a ring cluster
 * @property {Object} channel
 * @property {String} [channel.host=127.0.0.1] hostname or ip addres for tchannel to listen on
 * @property {Number} [channel.port=3455] Port number for tchannel to bind to
 * @property {Number} [PORT=3000] The port number for the http API server to bind to
 * @property {Object} nats Nats queue specific configuration
 * @property {String|String[]} [nats.hosts=127.0.0.1:4222] host:port of instances of a nats cluster. One is usually enough.
 **/
  seeds: ['127.0.0.1:3455', '127.0.0.1:3456']
, storage: {
    backend: 'memdown'
  , path: path.join(os.tmpdir(), `skyring-${process.pid}`)
  }
, channel: {
    host:'127.0.0.1'
  , port: 3455
  }
, PORT: 3000
, nats: {
    hosts:'127.0.0.1:4222'
  }
}
