'use strict'

const crypto    = require('crypto')
    , os        = require('os')
    , path      = require('path')
    , http      = require('http')
    , supertest = require('supertest')
    , async     = require('async')
    , conf      = require('keef')
    , tap       = require('tap')
    , Server    = require('../../lib/server')
    , test      = tap.test

test('server', (t) => {
  var os = require('os')
  var hostname;
  if(!process.env.TEST_HOST) {
    hostname =  os.hostname()
    console.log(`env variable TEST_HOST not set. using ${hostname} as hostname`)
  } else {
    hostname = process.env.TEST_HOST;
  }

  t.test('register custom transport as a function', (tt) => {
    let server = null
    tt.test('create server', (ttt) => {
      function foobar(method, url, payload, id, cache) {
        tap.ok('foobar')
      }
      server = new Server({
        node: {
          port: 6543
        , host: hostname
        , app: 'spec'
        }
      , seeds: [`${hostname}:6543`]
      , storage: {
          backend: 'leveldown'
          , path: '/tmp/sk111'
        }
      , transports: [foobar]
      })
      .load()
      .listen(5555, null, null, (err) => {
        ttt.error(err)
        ttt.end()
      })
    })

    tt.test('tap transport', (ttt) => {
      supertest('http://localhost:5555')
        .post('/timer')
        .send({
          timeout: 250
        , data: { put: ttt.ok, foobar: 1}
        , callback: {
            transport: 'foobar'
          , method: 'put'
          , uri: 'doesn\'t matter'
          }
        })
        .expect(201)
        .end((err, res) => {
          ttt.error(err)
          ttt.type(server._timers.transports.foobar, 'function')
          ttt.end()
        })
    })

    tt.test('teardown', (ttt) => {
      server.close(ttt.end)
    })
    tt.end()
  })

  t.test('register custom transport as a string', (tt) => {
    let server = null
    tt.test('create server', (ttt) => {
      server = new Server({
        node: {
          port: 6543
        , host: hostname
        , app: 'spec'
        }
      , seeds: [`${hostname}:6543`]
      , storage: {
          backend: 'leveldown'
        , path: '/tmp/sk22'
        }
      , transports: [require.resolve(path.join(__dirname, 'test.transport'))]
      })
      .load()
      .listen(5555, null, null, (err) => {
        ttt.error(err)
        ttt.end()
      })
    })

    tt.test('tap transport', (ttt) => {
      supertest('http://localhost:5555')
        .post('/timer')
        .send({
          timeout: 250
        , data: 'hello world'
        , callback: {
            transport: 'http'
          , method: 'put'
          , uri: 'http://localhost:4444'
          }
        })
        .expect(201)
        .end((err, res) => {
          ttt.error(err)
          ttt.type(server._timers.transports.test, 'function')
          ttt.end()
        })
    })

    tt.test('teardown', (ttt) => {
      server.close(ttt.end)
    })
    tt.end()
  })
  t.end()
})
