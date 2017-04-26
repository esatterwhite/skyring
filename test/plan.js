'use strict'
var debug = require('debug')('skyring:test')

module.exports = class Plan {
  constructor(expect, done) {
    this.count = 0;
    this.expect = +expect
    this.done = done
  }

  ok(bool) {
    if(!bool) {
      const err = new Error(`expected truthy value. Got ${bool}`)
      return this.done(err)
    }
    this.count++
    debug('expected %s - at %s', this.expect, this.count)
    if(this.expect === this.count) return this.done()
  }
}
