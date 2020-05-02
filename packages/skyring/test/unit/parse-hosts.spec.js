'use strict'

const {test, threw} = require('tap')
const parseHosts = require('../../lib/nats/parse-hosts')

test('parseHosts()', async (t) => {
  t.type(parseHosts, Function)
  const cases = [
    ['0.0.0.0:4444', ['nats://0.0.0.0:4444'], 'simple string']
  , [
      ['localhost:4222', 'nats://localhost:1111']
    , ['nats://localhost:4222', 'nats://localhost:1111']
    , 'array options'
    ]
  ]

  for (const testcase of cases) {
    t.deepEqual(parseHosts(testcase[0]), testcase[1], testcase[2])
  }
  t.throws(() => {
    parseHosts(null)
  }, /must be a string/ig)
}).catch(threw)
