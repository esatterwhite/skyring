'use strict'
/**
 * A noop function transport for testing
 * @module skyring/lib/transports/timer
 * @author Eric Satterwhite
 * @since 1.0.4
 * @requires skyring/lib/transports/transport
 */

const Transport = require('./transport')

class Callback extends Transport {
  exec(method, url, payload, id, cache) {
    setImmediate(() => {
      payload[method](url, id)
      return cache.success(id)
    })
  }
}

module.exports = Callback
