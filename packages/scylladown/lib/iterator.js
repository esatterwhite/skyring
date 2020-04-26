'use strict'

const {AbstractIterator} = require('abstract-leveldown')
const debug = require('debug')('skyring:ScyllaIterator')
const kCursor = Symbol('cursor')
const noop = () => {}

module.exports = class ScyllaIterator extends AbstractIterator {
  constructor(db, options) {
    super(db)
    this.keyAsBuffer = options.keyAsBuffer === true
    this.valueAsBuffer = options.valueAsBuffer === true
  }

  _next(cb) {
    if (this[kCursor]) {
      const item = this[kCursor].next()
      debug('cursor item', item)
      if(item.done) return cb()
      const _key = this.keyAsBuffer ? Buffer.from(item.value.id) : item.value.id
      const _value = this.valueAsBuffer ? Buffer.from(item.value.value) : item.value.value
      cb(null, _key, _value)
      return
    }

    this._cursor((err, cursor) => {
      if (err) return cb(err)
      const item = cursor.next()
      debug('cursor item', item)
      if(item.done) return cb()
      const _key = this.keyAsBuffer ? Buffer.from(item.value.id) : item.value.id
      const _value = this.valueAsBuffer ? Buffer.from(item.value.value) : item.value.value
      cb(null, _key, _value)
    })
  }

  _end(cb) {
    this[kCursor] = null
    setImmediate(cb, null)
  }

  _cursor(cb = noop) {
    if (this[kCursor]) cb(null, this[kCursor])
    const table = this.db.table
    this.db.client.execute(`SELECT id, value from ${table}`, (err, results) => {
      if (err) return cb(err)
      this[kCursor] = results[Symbol.iterator]()
      cb(null, this[kCursor])
    })
  }
}
