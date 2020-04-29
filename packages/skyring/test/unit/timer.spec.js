'use strict'

const os = require('os')
const http = require('http')
const path = require('path')
const {series} = require('async')
const {test} = require('tap')
const sinon = require('sinon')
const uuid   = require('uuid')
const conf   = require('keef')
const Timer  = require('../../lib/timer')
const Node   = require('../../lib/server/node')
const {rand} = require('../../../../test')

function clearAll(timers, cb) {
  for(const t of timers.values()){
    clearTimeout(t.timer)
  }
  timers.clear()
  for(const t of timers.values()){
    clearTimeout(t.timer)
  }
  timers.nats.quit(() => {
    timers.close(cb)
  })
}

test('timers', (t) => {
  t.test('create', (tt) => {
    let timers = null
    tt.test('options', (ttt) => {
      ttt.throws(() => {
        new Timer({
          storage: {
            backend: 'leveldown'
          , path: null
          }
        }, () => {})
      }, /storage\.path must be set with non memdown backends/)
      ttt.end()
    })

    tt.test('invalid transport', (ttt) => {
      timers = new Timer(null, () =>{
        timers.create('1', {
          callback: {
            transport: 'unknown'
          }
        }, (err) => {
          ttt.type(err, Error)
          clearAll(timers, ttt.end)
        })
      })

    })

    tt.test('immediately execute stale timer', (ttt) => {
      ttt.plan(1)
      const id = uuid.v4()
      const start = Date.now()
      class TapTransport {
        exec(a, b, c, d, e) {
          const end = Date.now()
          ttt.pass(start, end, end - start)
        }
      }
      Object.defineProperty(TapTransport, 'name', {value: 'tap'})
      ttt.on('end', () => {
        clearAll(timers)
      })
      const timers = new Timer({
        transports: [TapTransport]
      }, () => {
        timers.create(id, {
          timeout: 5000
        , created: (Date.now() - 6000)
        , callback: {
            method: 'hook'
          , transport: 'tap'
          , url: '#'
          }
        }, new Function)
      })
    })

    tt.test('duplicate timers', (ttt) => {
      timers = new Timer(undefined, () => {
        series([
          (cb) => {
            timers.create("1", {
              timeout: 1000
            , callback: {
                transport: 'http'
              , method: 'post'
              , uri: 'http://localhost'
              }
            }, cb)
          }
        , (cb) => {
            timers.create("1", {
              timeout: 1000
            , callback: {
                transport: 'http'
              , method: 'post'
              , uri: 'http://localhost'
              }
            }, cb)
          }
        ], (err) => {
          ttt.type(err, Error)
          ttt.equal(err.code, 'EKEYEXISTS')
          ttt.match(err.message, /already exists/)
          clearAll(timers, ttt.end)
        })
      })
    })

    tt.test('set up timer cache', (ttt) => {
      timers = new Timer({
        storage: {
          backend: 'memdown'
        , path: path.join(os.tmpdir(), rand.bytes(10))
        }
      }, ttt.end)
    })

    tt.test('Execute the transport on a delay', (ttt) => {
      const id = uuid.v4()
      const foo = (uri, guid) => {
        ttt.equal( uri, 'helloworld')
        ttt.equal(guid, id)
        clearAll(timers, ttt.end)
      }

      timers.create(id, {
        timeout: 250
      , data: { foo: foo }
      , callback: {
          transport: 'callback'
        , method: 'foo'
        , uri: 'helloworld'
        }
      }, (err, id) => {
        ttt.error(err)
      })
    })

    tt.end()
  })

  t.test('update', (tt) => {
    let timers = null

    tt.test('set up timer cache', (ttt) => {
      timers = new Timer({
        storage: {
          backend: 'memdown'
        , path: path.join(os.tmpdir(), rand.bytes(10))
        }
      }, ttt.end)
    })

    tt.test('should replace a timer in place', (ttt) => {
      const id = uuid.v4()
      const one = () => {
        ttt.fail('function one called')
      }

      const two = () => {
        ttt.ok('function two called')
        clearAll(timers, ttt.end)
      }

      timers.create(id, {
        timeout: 100
      , data: { one: one }
      , callback: {
          transport: 'callback'
        , method: 'one'
        , uri: 'helloworld'
        }
      }, (err) => {
        ttt.error(err)
        timers.update(id, {
          timeout: 150
        , data: { two: two }
        , callback: {
            transport: 'callback'
          , method: 'two'
          , uri: 'helloworld'
          }
        }, (err) => {
          ttt.error(err)
        })
      })
    })
    tt.end()
  })

  t.test('cancel', (tt) => {
    let timers = null
    tt.test('set up timer cache', (ttt) => {
      timers = new Timer({
        storage: {
          backend: 'memdown'
        , path: path.join(os.tmpdir(), rand.bytes(10))
        }
      }, ttt.end)
    })

    tt.test('should cancel an existing timer', (ttt) => {
      const id = uuid.v4()
      let called = false
      timers.create(id, {
        timeout: 2000
      , data: {
          "fake 2": (uri, guid) => {
            called = true
            ttt.fail('timer callback called')
          }
        }
      , callback: {
          transport: 'callback'
        , method: 'fake 2'
        , uri: 'fake 2'
        }
      }, (err) => {
        setTimeout(() => {
          timers.cancel(id, () => {
            ttt.ok(!called)
            clearAll(timers, ttt.end)
          })
        }, 50)
      })
    })
    tt.end()
  })
  t.test('failure', (tt) => {
    let timers = null
    tt.test('setup timer cache', (ttt) => {
      timers = new Timer({
        storage: {
          backend: 'memdown'
        }
      }, ttt.end)
    })

    tt.test('fail timer', (ttt) => {
      const id = uuid.v4()
      let called = false
      timers.create(id, {
        timeout: 2000
      , data: {
          "fake 3": (uri, guid) => {
            called = true
            ttt.fail('timer callback called')
          }
        }
      , callback: {
          transport: 'callback'
        , method: 'fake 3'
        , uri: 'fake 3'
        }
      }, (err) => {
        setTimeout(() => {
          const e = new Error('broke')
          timers.failure(id, e, () => {
            ttt.ok(!called)
            clearAll(timers, ttt.end)
          })
        }, 50)
      })
    })
    tt.end()
  })

  t.test('recovery', (tt) => {
    tt.plan(4)
    const state = {
      timers: null
    , server: null
    , request: null
    , id: uuid.v4()
    , storage_path: path.join(os.tmpdir(), `skyring-${rand.bytes(10)}`)
    }

    tt.on('end', () => {
      state.server && state.server.close()
      clearAll(state.timers)
    })

    series([
      (cb) => {
        state.server = http.createServer((req, res) => {
          let body = ''
          tt.pass('recovered timer called')
          req.on('data', (chunk) => {
            body += chunk
          })

          req.once('end', (chunk) => {
            body += (chunk || '')
            const out = JSON.parse(body)
            res.writeHead(204)
            res.end()
            setTimeout(() => {
              tt.match(out, {
                foo: {bar: 100}
              })
            }, 50)
          })
        }).listen(0, cb)
      }
    , (cb) => {
        state.timers = new Timer({
          storage: {
            backend: 'leveldown'
          , path: state.storage_path
          }
        }, cb)
      }
    , (cb) => {
        tt.comment(`setting timer ${state.id}`)
        state.timers.create(state.id, {
          timeout: 1000
        , data: {foo: {bar: 100}}
        , callback: {
            transport: 'http'
          , method: 'POST'
          , uri: `http://localhost:${state.server.address().port}`
          }
        }, cb)
      }
    , (cb) => {
        tt.comment('clearing timers')
        clearAll(state.timers, cb)
      }

    , (cb) => {
        tt.comment('re create timers')
        state.timers = new Timer({
          storage: {
            backend: 'leveldown'
          , path: state.storage_path
          }
        }, cb)
        sinon.spy(state.timers, 'recover')
      }
    ], (err) => {
      tt.error(err)
      tt.ok(state.timers.id, 'timer instance has unique id')
    })
  })
  t.end()
})

