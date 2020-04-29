'use strict';
/**
 * Loads and maintains all transports
 * @module skyring/lib/transports
 * @author Eric Satterwhite
 * @tutorial transports
 * @since 1.0.0
 * @requires skyring/lib/transports/http
 * @requires skyring/lib/transports/callback
 * @requires skyring/lib/log
 * @requires skyring/lib/lang/array/to-array
 * @requires skyring/conf
 */

const Callback  = require('./callback')
const Http      = require('./http')
const pino      = require('../log')
const toArray   = require('../lang/array/to-array')
const conf      = require('../../conf')
const kLoad     = Symbol('kLoad')
const kShutdown = Symbol.for('kShutdown')
const ENV       = conf.get('node_env')
const defaults  = toArray(conf.get('transport'))

const log = pino.child({name: pino.namespace(__dirname, 'transports')})

/**
 *
 * @typedef {function} TransportHandler
 * @param {String} method
 * @param {String} uri
 * @param {String} Payload
 * @param {String} id
 * @param {LevelUp} storage A levelup instance container all curring timer data 
 **/

/**
 * @alias module:skyring/lib/transports
 * @constructor
 * @param {TransportHandler|TransportHandler[]|String|String[]} transports Custom transports to register
 *    This can be a Transport class or a
 * @example const path = require('path')
const Skyring = require('skyring')
const kType = Symbol.for('SkyringTransport')

class Fizzbuzz extends Skyring.Transport {
  constructor(opts) {
    super(opts)
    this.name = 'fizzbuzz'
  }
  exec (method, uri, payload, id, timer_store) {
   // send payload to uri...
   timer_store.success(id)
  }
  shutdown(cb) {
    // drain connections...
    // free up event loop
    cb()
  }

  static [Symbol.hasInstance](instance) {
    return instance[kType] === 'fizzbuzztransport'
  }
  get [Symbol.toStringTag]() {
    return 'FizzbuzzTransport'
  }

  get [kType]() {
    return 'fizzbuzztransport'
  }
}


const server = new Skyring({
  transports: [
    'my-transport-module'
  , Fizzbuzz
  , path.resolve(__dirname, '../transports/fake-transport')
  ]
})
 * @example const {Transports, Transport} = require('skyring')
class Fizzbuzz extends Transport {
  constructor(opts) {
    super(opts)
    this.name = 'fizzbuzz'
  }

  exec (method, uri, payload, id, timer_store) {
   // send payload to uri...
   timer_store.remove(id)
  }

  shutdown(cb) {
    // drain connections...
    // free up event loop
    cb()
  }
}

const t = new Transports([
  'my-transport-module'
, Fizzbuz
, path.resolve(__dirname, '../transports/fake-transport')
])
 **/
module.exports = class Transports extends Map {
  constructor(transports) {
    super()
    /**
     * Primary http transport
     * @memberof module:skyring/lib/transports
     * @property {Object} http The default HTTP transport
     **/
    this.set(Http.name.toLowerCase(),  new Http())
    if(ENV === 'test') {
      this.set('callback', new Callback())
    }
    this[kLoad](toArray(transports))
  }

  [kLoad](paths) {
    const transports = new Set(defaults.concat(toArray(paths)))
    for (const path of transports) {
      const transport = typeof path === 'string' ? require(path) : path
      if (typeof transport !== 'function') {
        throw new TypeError('A Transport must export a function')
      }

      if (typeof transport.prototype.exec !== 'function') {
        throw new TypeError('A Transport must have an "exec" function')
      }

      if (transport.prototype.exec.length !== 5) {
        throw new Error('Transports must accept five parameters')
      }

      if (typeof transport.name !== 'string' || transport.name.length <= 0) {
        throw new TypeError('transports.name is required and must be a string')
      }

      const name = transport.name.toLowerCase()
      if (this.has(name)) {
        const error = new Error(`A transport with name ${name} is already defined`)
        error.name = 'EEXIST'
        throw error
      }

      log.info('loading %s transport', name)
      const instance = new transport(
        conf.get(`transports:${name}`)
      , pino
      )

      this.set(name, instance)
    }
  }

  [kShutdown](cb) {
    const keys = Array.from(this.values())
    const run = () => {
      if (!keys.length) return cb()
      const transport = keys.pop()
      if (typeof transport.shutdown === 'function') {
        log.debug(`shutdown ${transport.name} transport`)
        return transport.shutdown(run)
      }
      run()
    }
    run()
  }
}

