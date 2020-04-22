'use strict'

const zmq = require('zeromq')
const os = require('os')
const path = require('path')
const {test, threw} = require('tap')
const sinon = require('sinon')
const supertest = require('supertest')
const Skyring = require('skyring')
const Transport = require('../lib/zmq')
const {sys} = require('../../../test')
const ZMQ_BIND = !!process.env.ZMQ_BIND

let hostname = null

if (!process.env.TEST_HOST) {
  hostname = os.hostname()
  console.log(`env variable TEST_HOST not set. using ${hostname} as hostname`)
} else {
  hostname = process.env.TEST_HOST
}

test('zmq:transport', async (t) => {

  t.test('class instance', async (tt) => {
    const transport = new Transport()
    t.ok(transport instanceof Transport, 'is instance of transport')
    t.equal(transport.toString(), '[object ZMQTransport]', 'string representation')
  })

  t.test('monitor events errors', (tt) => {
    const addr = 'ipc://tap'
    const one = new Transport({
      debug: true
    , bind: true
    })

    const mock_store = {
      success: sinon.spy()
    , failure: sinon.spy()
    }
    const handler = zmq.socket('pull')
    handler.connect(addr)
    tt.on('end', () => {
      handler.removeAllListeners()
      handler.disconnect(addr)
      handler.close()
      one.shutdown()
    })

    one.exec('push', addr, {}, 1, mock_store)

    setImmediate(() => {
      tt.ok(mock_store.success.called, 'timer success')
      const socket = one.connection(addr)
      tt.end()
    })
  })

  t.test('cannon bind lto restricted ports', (tt) => {
    const addr = 'tcp://0.0.0.0:80'
    const mock_store = {
      success: sinon.spy()
    , failure: sinon.spy()
    }
    const one = new Transport({
      bind: true
    })

    one.exec('push', addr, {}, 1, mock_store)
    tt.ok(mock_store.failure.called, 'timer failed')

    one.shutdown(tt.end)
  })
}).catch(threw)

test('zmq:push', async (t) => {
  let request, server, handler
  const [ring_port, zmq_port] = await sys.ports(2)

  t.on('end', () => {
    handler.removeAllListeners()
    handler.disconnect(`tcp://0.0.0.0:${zmq_port}`)
    handler.close()
    server.close()
  })

  t.test('set up skyring server', (tt) => {
    server = new Skyring({
      transports: [path.resolve(__dirname, '../')]
    , seeds: [`${hostname}:${ring_port}`]
    , node: {port: ring_port}
    })

    server.listen(0, null, null, () => {
      const {port} = server.address()
      request = supertest(`http://localhost:${port}`)
      tt.end()
    })
  })

  t.test('success - should deliver payload', (tt) => {
    tt.plan(3)
    handler = zmq.socket('pull')
    if (ZMQ_BIND) {
      handler.connect(`tcp://0.0.0.0:${zmq_port}`)
    } else {
      handler.bindSync(`tcp://0.0.0.0:${zmq_port}`)
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
          uri: `tcp://0.0.0.0:${zmq_port}`
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
  const mock_timers = {
    success: sinon.spy()
  , failure: sinon.spy()
  }
  const transport = new (require('../lib/zmq'))
  transport.exec('fake', 'zmq://0.0.0.0:3333', '{}', '1', mock_timers)
  t.ok(mock_timers.failure.called, 'timer.failure() called')
  t.end()
})

test('zmq:pub', async (t) => {
  let request, server, handler
  const [ring_port, zmq_port] = await sys.ports(2)
  function doRequest(t) {
    request
      .post('/timer')
      .send({
        timeout: 500
      , data: 'fake'
      , callback: {
          transport: 'zmq'
        , uri: `tcp://0.0.0.0:${zmq_port}`
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
    handler.disconnect(`tcp://0.0.0.0:${zmq_port}`)
    handler.close()
    server.close()
  })

  t.test('set up skyring server', (tt) => {
    server = new Skyring({
      transports: [require(path.resolve(__dirname, '../'))]
    , seeds: [`${hostname}:${ring_port}`]
    , node: {port: ring_port}
    })
    server.listen(0, null, null, (err) => {
      tt.error(err)
      const {port} = server.address()
      request = supertest(`http://localhost:${port}`)
      tt.end()
    })
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
      handler.connect(`tcp://0.0.0.0:${zmq_port}`)
    } else {
      handler.bindSync(`tcp://0.0.0.0:${zmq_port}`)
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
})
