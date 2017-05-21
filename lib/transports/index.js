/*jshint laxcomma: true, smarttabs: true, node:true, esnext:true*/
'use strict';
/**
 * Available tranports
 * @module skyring/lib/transports
 * @author Eric Satterwhite
 * @since 1.0.0
 * @requires skyring/lib/transports/http
 */

const debug = require('debug')('skyring:transports:tcp')
const conf = require('../../conf');
const callback = require('./callback');
const ENV = conf.get('NODE_ENV');
const transports = new Set(toArray(conf.get('with-transport')))

 /**
  * Primary http transport
  * @memberof module:skyring/lib/transports
  * @property {Object} http The default HTTP transport
  **/
exports.http = require('./http');

debug('to load', transports)
for (const path of transports) {
  const transport = require(path)
  if (typeof transport !== 'function') {
    throw new TypeError('A Transport must export a function')
  }

  if(transport.length !== 5) {
    throw new Error('Transports must accept five parameters')
  }

  if(typeof transport.name !== 'string' && transport.name.length <= 0) {
    throw new TypeError('transports.name is required and must be a string')
  }

  debug('loading %s transport', transport.name)
  Object.defineProperty(exports, transport.name, {
    configrable: false
  , enumerable: true
  , get: () => {
      return transport
    }
  })
}

if(ENV === 'development' || ENV === 'test') {
  exports.callback = callback;
}

function toArray(item) {
  if (!item) return []
  if (Array.isArray(item)) return item
  return typeof item === 'string' ? item.split(',') : [item]
}

