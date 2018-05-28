/*jshint laxcomma: true, smarttabs: true, node:true, esnext:true*/
'use strict';
/**
 * Loads and maintains all transports
 * @module skyring/lib/transports
 * @author Eric Satterwhite
 * @tutorial transports
 * @since 1.0.0
 * @requires debug
 * @requires skyring/lib/transports/http
 * @requires skyring/conf
 */

const debug     = require('debug')('skyring:transports')
    , conf      = require('../../conf')
    , callback  = require('./callback')
    , http      = require('./http')
    , kLoad     = Symbol('kLoad')
    , kShutdown = Symbol.for('kShutdown')
    , ENV       = conf.get('node_env')
    , defaults  = toArray(conf.get('transport'))
    ;

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
 * @param {TransportHandler|TransportHandler[]|String|String[]} transports Custome transports to registe
 * @example const path = require('path')
const Skyring = require('skyring')

function fizzbuz(method, uri, payload, id, timer_store) {
 // send payload to uri...
 timer_store.remove(id)
}

fuzzbuz.shutdown(cb) {
  // drain connections...
  // free up event loop
  cb()
}

const server = new Skyring({
  transports: [
    'my-transport-module'
  , fizzbuz
  , path.resolve(__dirname, '../transports/fake-transport')
  ]
})
 * @example const Transports = require('skyring/lib/transports')
function fizzbuz(method, uri, payload, id, timer_store) {
 // send payload to uri...
 timer_store.remove(id)
}

fuzzbuz.shutdown(cb) {
  // drain connections...
  // free up event loop
  cb()
}

const t = new Transports([
  'my-transport-module'
, fizzbuz
, path.resolve(__dirname, '../transports/fake-transport')
])
 **/
module.exports = class Transports {
  constructor(transports) {
    /**
     * Primary http transport
     * @memberof module:skyring/lib/transports
     * @property {Object} http The default HTTP transport
     **/
    this.http = http;
    if(ENV === 'development' || ENV === 'test') {
      this.callback = callback;
    }
    this[kLoad](toArray(transports));
  }

  [kLoad](paths) {
    const transports = new Set(defaults.concat(toArray(paths)));
    for (const path of transports) {
      const transport = typeof path === 'string' ? require(path) : path;
      if (typeof transport !== 'function') {
        throw new TypeError('A Transport must export a function');
      }

      if (transport.length !== 5) {
        throw new Error('Transports must accept five parameters');
      }

      if (typeof transport.name !== 'string' || transport.name.length <= 0) {
        throw new TypeError('transports.name is required and must be a string');
      }

      if (hasOwn(this, transport.name)) {
        const error = new Error(`A transport with name ${transport.name} is already defined`);
        error.name = 'EEXIST';
        throw error;
      }

      debug('loading %s transport', transport.name);
      this[transport.name] = transport;
    }
  }
  [kShutdown](cb) {
    const keys = Object.keys(this);
    const run = () => {
      if (!keys.length) return cb();
      const key = keys.pop();
      if (typeof this[key].shutdown === 'function') {
        debug(`shutdown ${key} transport`);
        return this[key].shutdown(run);
      }
      run();
    };
    run();
  }
};


function toArray(item) {
  if (!item) return [];
  if (Array.isArray(item)) return item;
  return typeof item === 'string' ? item.split(',') : [item];
}

function hasOwn(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}
