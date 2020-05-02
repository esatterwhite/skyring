'use strict'

const {test, threw} = require('tap')
const common = require('./common')
const scylladown = require('../')
const levelDownTest = require('abstract-leveldown/abstract/leveldown-test')
const openTest = require('abstract-leveldown/abstract/open-test')
const delTest = require('abstract-leveldown/abstract/del-test')
const getTest = require('abstract-leveldown/abstract/get-test')
const putTest = require('abstract-leveldown/abstract/put-test')
const multiTest = require('abstract-leveldown/abstract/put-get-del-test')
const batchTest = require('abstract-leveldown/abstract/batch-test')
const chainedBatchTest = require('abstract-leveldown/abstract/chained-batch-test')
const closeTest = require('abstract-leveldown/abstract/close-test')
const iteratorTest = require('abstract-leveldown/abstract/iterator-test')
test('ScyllaDown', (t) => {
  t.test('levelown', (tt) => {
    levelDownTest.args(scylladown, tt.test)
    tt.end()
  })

  t.test('leveldown#open', (tt) => {
    openTest.setUp(scylladown, tt.test, common)
    openTest.args(scylladown, tt.test, common)
    openTest.open(scylladown, tt.test, common)
    tt.end()
  })

  t.test('leveldown#del', (tt) => {
    delTest.all(scylladown, tt.test, common)
    tt.end()
  })

  t.test('leveldown#get', (tt) => {
    getTest.all(scylladown, tt.test, common)
    tt.end()
  })

  t.test('leveldown#put', (tt) => {
    putTest.all(scylladown, tt.test, common)
    tt.end()
  })

  t.test('leveldown#multi-opts', (tt) => {
    multiTest.setUp(scylladown, tt.test, common)
    multiTest.errorKeys(tt.test)
    tt.end()
  })

  t.test('leveldown#batch', (tt) => {
    batchTest.setUp(scylladown, tt.test, common)
    batchTest.args(tt.test)
    tt.end()
  })

  t.test('leveldown#chained-batch', (tt) => {
    chainedBatchTest.setUp(scylladown, tt.test, common)
    chainedBatchTest.args(tt.test)
    tt.end()
  })

  t.test('leveldown#close', (tt) => {
    closeTest.close(scylladown, tt.test, common)
    tt.end()
  })

  t.test('leveldown#iterator', (tt) => {
    iteratorTest.setUp(scylladown, tt.test, common)
    iteratorTest.args(tt.test)
    iteratorTest.sequence(tt.test)
    iteratorTest.tearDown(tt.test, common)
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
