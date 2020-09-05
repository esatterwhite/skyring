'use strict'

const http = require('http')
const sinon = require('sinon')
const {test, threw} = require('tap')
const {testCase} = require('@vendor/test-core')
const Router = require('../../lib/server/router')
const HttpTransport = require('../../lib/transports/http')

function setup() {
  return new Promise((resolve, reject) => {
    const router = new Router()
    let server = null
    server = http.createServer((req, res) => {
      router.handle(req, res)
    }).listen(0, (err) => {
      if (err) return reject(err)
      resolve({
        server: server
      , router: router
      })
    })
  })
}

test('http transport', async (t) => {
  const state = await setup()

  t.on('end', () => {
    state.server.close()
  })

  testCase(t, {
    code: 'lang'
  , description: 'String Tag'
  }, async (tt) => {
    const t = new HttpTransport()
    tt.equal(t.toString(), '[object SkyringHttpTransport]')
  })

  testCase(t, {
    code: 'success'
  , description: 'http timer executed'
  }, (tt) => {
    tt.plan(2)
    const addr = `http://localhost:${state.server.address().port}/r1`
    const mock_store = {
      success: () => {
        tt.pass('timer success')
      }
    , failure: () => {
        tt.fail('timer failure')
      }
    }

    const transport = new HttpTransport()
    state.router.post('/r1', (req, res, node, cb) => {
      res.$.status(201)
      tt.pass('timeout reached')
      cb()
    })

    transport.exec('post', addr, {}, 'r1', mock_store)
  })

  testCase(t, {
    code: 'failure'
  , description: 'http timer fail'
  }, (tt) => {
    tt.plan(3)
    const addr = `http://localhost:${state.server.address().port}/notfound`
    const mock_store = {
      success: () => {
        tt.fail('timers.success was called')
      }
    , failure: (id, err) => {
        tt.type(err, Error)
        tt.match(err.message, /not found/ig)
        tt.pass('timer fail')
      }
    }

    const transport = new HttpTransport()
    transport.exec('post', addr, {}, 'notfound', mock_store)
  })

  testCase(t, {
    code: 'failure'
  , description: 'invalid http method'
  }, (tt) => {
    tt.plan(3)
    const addr = `http://localhost:${state.server.address().port}/notfound`
    const mock_store = {
      success: () => {
        tt.fail('timers.success was called')
      }
    , failure: (id, err) => {
        tt.type(err, Error)
        tt.equal(err.code, 'ESRHTTP')
        tt.pass('timer fail')
      }
    , get: sinon.stub().returns({})
    }

    const transport = new HttpTransport()
    transport.exec('fake', addr, {}, 'badverb', mock_store)
  })
}).catch(threw)
