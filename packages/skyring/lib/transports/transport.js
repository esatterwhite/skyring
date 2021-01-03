'use strict'

const log = require('../log')
const kType = Symbol.for('SkyringTransport')
const TRANSPORT = 'transport'
function noop() {}

module.exports = class Transport {
  constructor(opts) {
    const name = (this.constructor.name).toLowerCase()
    this.log = log.child({name: `skyring:transports:${name}`})
  }

  /* istanbul ignore next */
  exec(method, url, payload, id, cache) {}

  shutdown(cb = noop) {
    cb()
  }

  static [Symbol.hasInstance](instance) {
    return instance[kType] === TRANSPORT
  }

  get [kType]() {
    return TRANSPORT
  }

  get [Symbol.toStringTag]() {
    return 'SkyringTransport'
  }
}

