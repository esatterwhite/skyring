'use strict'

const kType = Symbol('skyringType')
const noop = new Function()
const TRANSPORT = 'transport'

module.exports = class Transport {
  constructor(opts) {
    this.name = TRANSPORT
  }

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
    return 'SkyringTransport';
  }

}
