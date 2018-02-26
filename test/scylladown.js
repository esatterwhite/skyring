'use strict'

const {test, threw} = require('tap')
const common = require('./common')
const scylladown = require('../')

test('ScyllaDown', (t) => {
  t.test('levelown', (tt) => {
    require('abstract-leveldown/abstract/leveldown-test').args(scylladown, tt.test)
    tt.end()
  })

  t.test('leveldown#open', (tt) => {
    require('abstract-leveldown/abstract/open-test').setUp(scylladown, tt.test, common)
    require('abstract-leveldown/abstract/open-test').args(scylladown, tt.test, common)
    require('abstract-leveldown/abstract/open-test').open(scylladown, tt.test, common)
    tt.end()
  })

  t.test('leveldown#del', (tt) => {
    require('abstract-leveldown/abstract/del-test').all(scylladown, tt.test, common)
    tt.end()
  })

  t.test('leveldown#get', (tt) => {
    require('abstract-leveldown/abstract/get-test').all(scylladown, tt.test, common)
    tt.end()
  })

  t.test('leveldown#put', (tt) => {
    require('abstract-leveldown/abstract/put-test').all(scylladown, tt.test, common)
    tt.end()
  })

  t.test('leveldown#multi-opts', (tt) => {
    require('abstract-leveldown/abstract/put-get-del-test').setUp(scylladown, tt.test, common)
    require('abstract-leveldown/abstract/put-get-del-test').errorKeys(tt.test)
    tt.end()
  })

  t.test('leveldown#batch', (tt) => {
    require('abstract-leveldown/abstract/batch-test').setUp(scylladown, tt.test, common)
    require('abstract-leveldown/abstract/batch-test').args(tt.test)
    tt.end()
  })

  t.test('leveldown#chained-batch', (tt) => {
    require('abstract-leveldown/abstract/chained-batch-test').setUp(scylladown, tt.test, common)
    require('abstract-leveldown/abstract/chained-batch-test').args(tt.test)
    tt.end()
  })

  t.test('leveldown#close', (tt) => {
    require('abstract-leveldown/abstract/close-test').close(scylladown, tt.test, common)
    tt.end()
  })

  t.test('leveldown#iterator', (tt) => {
    require('abstract-leveldown/abstract/iterator-test').setUp(scylladown, tt.test, common)
    require('abstract-leveldown/abstract/iterator-test').args(tt.test)
    require('abstract-leveldown/abstract/iterator-test').sequence(tt.test)
    require('abstract-leveldown/abstract/iterator-test').tearDown(tt.test, common)
    tt.end()
  })

  t.end()
}).catch(threw)

test('teardown', (t) => {
  setImmediate(() => {
    process.exit(0)
  })
  t.end()
})
