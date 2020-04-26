'use strict'

module.exports = {
  sys: require('./sys')
, rand: require('./rand')
, testCase: testCase
}

function testCase(t, opts, cb) {
  return t.test(`(${opts.code}) ${opts.description}`, cb).catch(t.threw)
}
