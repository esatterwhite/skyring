/*jshint laxcomma: true, smarttabs: true, node:true, esnext:true*/
'use strict';
/**
 * Available tranports
 * @module skyring/lib/transports
 * @author Eric Satterwhite
 * @since 1.0.0
 * @requires skyring/lib/transports/http
 */

 /**
  * DESCRIPTION
  * @memberof module:skyring/lib/transports
  * @property {Object} http The HTTP transport
  **/
exports.http = require('./http');
