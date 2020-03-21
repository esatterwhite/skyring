'use strict'

const zmq = require('zeromq')
const os = require('os')
const path = require('path')
const tap = require('tap')
const supertest = require('supertest')
const Skyring = require('skyring')
const test = tap.test
const ZMQ_BIND = !!process.env.ZMQ_BIND

let hostname = null

if (!process.env.TEST_HOST) {
  hostname = os.hostname()
  console.log(`env variable TEST_HOST not set. using ${hostname} as hostname`)
} else {
  hostname = process.env.TEST_HOST
}

test('zmq:push', (t) => {
  let request, server, handler
  t.on('end', () => {
    handler.removeAllListeners()
    handler.disconnect('tcp://0.0.0.0:5555')
    handler.close()
    server.close()
  })

  t.test('set up skyring server', (tt) => {
    server = new Skyring({
      transports: [path.resolve(__dirname, '../')]
    , seeds: [`${hostname}:3455`]
    })
    request = supertest('http://localhost:3333')
    server.listen(3333, null, null, () => {
      console.log(server._timers.transports)
      tt.end()
    })
  })

  t.test('success - should deliver payload', (tt) => {
    tt.plan(3)
    handler = zmq.socket('pull')
    if (ZMQ_BIND) {
      handler.connect('tcp://0.0.0.0:5555')
    } else {
      handler.bindSync('tcp://0.0.0.0:5555')
    }
    handler.on('message', (evt, data) => {
      const payload = JSON.parse(data)
      tt.match(payload, {
        text: 'hello world'
      , status: 200
      })
      tt.pass('timeout executed')
    })

    request
      .post('/timer')
      .send({
        timeout: 500
      , data: JSON.stringify({
          text: 'hello world'
        , status: 200
        })
      , callback: {
          uri: 'tcp://0.0.0.0:5555'
        , method: 'push'
        , transport: 'zmq'
        }
      })
      .expect(201)
      .end((err, res) => {
        tt.error(err)
      })
  })

  t.end()
})

test('error case', (t) => {
  t.throws(() => {
    const transport = new (require('../lib/zmq'))
    transport.exec('fake', 'zmq://0.0.0.0:3333', '{}', '1', null)
  }, /unable to create connection for fake/)
  t.end()
})

test('zmq:pub', (t) => {
  let request, server, handler
  const req = supertest('http://localhost:3333')
  function doRequest(t) {
    req
      .post('/timer')
      .send({
        timeout: 500
      , data: 'fake'
      , callback: {
          transport: 'zmq'
        , uri: 'tcp://0.0.0.0:5555'
        , method: 'pub'
        }
      })
      .expect(201)
      .end((err, res) => {
        t.error(err)
      })
  }
  t.on('end', (done) => {
    handler.removeAllListeners()
    handler.disconnect('tcp://0.0.0.0:5555')
    handler.close()
    server.close()
  })
  t.test('set up skyring server', (tt) => {
    server = new Skyring({
      transports: [require(path.resolve(__dirname, '../'))]
      , seeds: [`${hostname}:3455`]
    })
    request = supertest('http://localhost:3333')
    server.listen(3333, null, null, tt.end)
  })

  t.test('start saturate pool - no connection', (tt) => {
    tt.plan(151)
    for (var x = 0; x < 150; x++) {
      doRequest(tt)
    }
    setTimeout(() => {
      tt.pass('saturated')
    }, 2000)
  })

  t.test('success - should deliver payload', (tt) => {
    tt.plan(150)
    handler = zmq.socket('sub')
    handler.subscribe('timeout')
    if (ZMQ_BIND) {
      handler.connect('tcp://0.0.0.0:5555')
    } else {
      handler.bindSync('tcp://0.0.0.0:5555')
    }
    handler.on('message', (evt, data) => {
      tt.match(data, /fake/)
    })
    for (var x = 0; x < 150; x++) {
      doRequest({
        error: () => {}
      })
    }
  })
  t.end()
})
