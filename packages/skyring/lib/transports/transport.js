'use strict'

const kType = Symbol.for('SkyringTransport')
const noop = new Function()
const TRANSPORT = 'transport'

module.exports = class Transport {
  constructor(opts) {
    this.name = TRANSPORT
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
