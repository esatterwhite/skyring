'use strict'

const path = require('path')
const { test } = require('tap')
const Transports = require('../../lib/transports')

test('transports', (t) => {
  t.throws(() => {
    new Transports([
      path.join(__dirname, 'dummy.transport')
    ])
  }, /A Transport must export a function/)

  t.throws(() => {
    new Transports([
      () => {}
    ])
  }, /Transports must accept five parameters/)

  t.throws(() => {
    new Transports([
      (a, b, c, d, e) => {}
    ])
  }, /transports.name is required and must be a string/)

  t.throws(() => {
    new Transports([
      function test(a, b, c, d, e) {}
    , function test(a, b, c, d, e) {}
    ])
  }, /A transport with name test is already defined/)
  t.end()
})
