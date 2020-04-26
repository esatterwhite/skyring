'use strict'

const path = require('path')
const {test, threw} = require('tap')
const Transports = require('../../lib/transports')
const Transport = require('../../lib/transports/transport')
const HTTP = require('../../lib/transports/http')

test('transports', async (t) => {
  const defaults = new Transports()
  t.ok(defaults.get('http') instanceof HTTP, 'auto register http transport')
  t.throws(() => {
    new Transports([
      path.join(__dirname, 'dummy.transport')
    ])
  }, /A Transport must export a function/)

  t.throws(() => {
    new Transports([
      class fake {
      }
    ])
  }, /Transport must have an "exec" function/i)

  t.throws(() => {
    new Transports([
      class fake {
        exec() {}
      }
    ])
  }, /Transports must accept five parameters/)

  t.throws(() => {
    new Transports([
      class {
        exec (a, b, c, d, e) {}
      }
    ])
  }, /transports.name is required and must be a string/)

  t.throws(() => {
    new Transports([
       class test {
         exec (a, b, c, d, e) {}
       }
     , class test {
         exec (a, b, c, d, e) {}
       }
    ])
  }, /A transport with name test is already defined/)

  t.test('base class', (tt) => {
    const base = new Transport()
    t.equal(base.toString(), '[object SkyringTransport]', 'string repr')
    t.ok(base instanceof Transport, 'instancof Transport')
    t.doesNotThrow(() => {
      base.shutdown()
    })
    base.shutdown(() => {
      tt.end()
    })
  })
}).catch(threw)
