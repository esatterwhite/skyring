/*jshint laxcomma: true, smarttabs: true, node:true, esnext:true*/
'use strict';
/**
 * A noop function transport for testing
 * @module skyring/lib/transports/timer
 * @author Eric Satterwhite
 * @since 1.0.4
 */

module.exports = function callback( method, url, payload, id, cache ){
  setImmediate(payload[method], url, id)
}
