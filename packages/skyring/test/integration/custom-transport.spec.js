'use strict'

const os = require('os')
const path = require('path')
const supertest = require('supertest')
const {test, ok} = require('tap')
const Server = require('../../lib/server')
const {sys} = require('@vendor/test-core')

test('server', async (t) => {
  let hostname
  if (!process.env.TEST_HOST) {
    hostname = os.hostname()
    console.log(`env variable TEST_HOST not set. using ${hostname} as hostname`)
  } else {
    hostname = process.env.TEST_HOST
  }

  const [ring_port, http_port] = await sys.ports(3)
  t.test('register custom transport as a function', (tt) => {
    let server = null
    tt.test('create server', (ttt) => {
      class Foobar {
        exec(method, url, payload, id, cache) {
          ok('foobar', payload)
        }
      }
      server = new Server({
        node: {
          port: ring_port
        , host: hostname
        , app: 'spec'
        }
      , seeds: [`${hostname}:${ring_port}`]
      , storage: {
          backend: 'memdown'
        }
      , transports: [Foobar]
      })
        .listen(http_port, (err) => {
          ttt.error(err)
          new Promise((resolve) => {
            setTimeout(resolve, 300)
          }).then(ttt.end)
        })
    })

    tt.test('foobar transport', (ttt) => {
      supertest(`http://localhost:${http_port}`)
        .post('/timer')
        .send({
          timeout: 250
        , data: {put: ttt.ok, foobar: 1}
        , callback: {
            transport: 'foobar'
          , method: 'put'
          , uri: 'doesn\'t matter'
          }
        })
        .expect(201)
        .end((err, res) => {
          ttt.error(err)
          ttt.type(server._timers.transports.get('foobar').exec, 'function')
          ttt.end()
        })
    })

    tt.test('teardown', (ttt) => {
      server.close(ttt.end)
    })
    tt.end()
  })

  t.test('register custom transport as a string', async (tt) => {
    let server = null
    const [ring_port, http_port] = await sys.ports(2)
    tt.test('create server', (ttt) => {
      server = new Server({
        node: {
          port: ring_port
        , host: hostname
        , app: 'spec'
        }
      , seeds: [`${hostname}:${ring_port}`]

      , transports: [require.resolve(path.join(__dirname, 'test.transport'))]
      , storage: {
          backend: 'memdown'
        }
      })
        .listen(http_port, null, null, (err) => {
          ttt.error(err)
          new Promise((resolve) => {
            setTimeout(resolve, 300)
          }).then(ttt.end)
        })
    })

    tt.test('test transport', (ttt) => {
      supertest(`http://localhost:${http_port}`)
        .post('/timer')
        .send({
          timeout: 250
        , data: {put: () => { console.log('called') }}
        , callback: {
            transport: 'test'
          , method: 'post'
          , uri: 'doesnotmatter'
          }
        })
        .expect(201)
        .end((err, res) => {
          ttt.ok('test callback called')
          ttt.error(err)
          ttt.type(server._timers.transports.get('test').exec, 'function')
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
