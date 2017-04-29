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
 * @param {Object} [options.storage] Storage config options for level db
 * @param {String[]} [options.storage.backend=memdown] a requireable module name, or absolute path to a leveldb compatible backend
 * `leveldown` and `memdown` are installed by default
 * @param {String} options.storage.path A directory path to a leveldb instance. One will be created if it doesn't already exist.
 * If the backend is memdown, this is optional and randomly generated per timer instance
 **/
  seeds: ['127.0.0.1:3455', '127.0.0.1:3456']
, storage: {
    backend: 'memdown'
  , path: null
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
