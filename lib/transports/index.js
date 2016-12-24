/*jshint laxcomma: true, smarttabs: true, node:true, esnext:true*/
'use strict';
/**
 * Available tranports
 * @module skyring/lib/transports
 * @author Eric Satterwhite
 * @since 1.0.0
 * @requires skyring/lib/transports/http
 */

const callback = require('./callback')
 /**
  * DESCRIPTION
  * @memberof module:skyring/lib/transports
  * @property {Object} http The HTTP transport
  **/
exports.http = require('./http');

Object.defineProperty(exports, 'callback',{
  enumerable: false
, configurable: false
, get: function(){
    switch(process.env.NODE_ENV){
      case 'production':
      case 'prod':
        const err = new Error('callback transport is for testing only')
        err.name = 'TransportError';
        err.code = 'ENOTRANSPORT';
        throw err;

      default:
        return callback;
    }
  }
});