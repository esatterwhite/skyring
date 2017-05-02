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
const ENV = process.env.NODE_ENV
 /**
  * DESCRIPTION
  * @memberof module:skyring/lib/transports
  * @property {Object} http The HTTP transport
  **/
exports.http = require('./http');

if(!ENV || ENV === 'development' || ENV === 'test') {
  exports.callback = callback
}

