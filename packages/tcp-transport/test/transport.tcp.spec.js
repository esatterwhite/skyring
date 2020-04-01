'use strict'

const net = require('net')
const os = require('os')
const path = require('path')
const {test} = require('tap')
const supertest = require('supertest')
const Skyring = require('skyring')
const {sys} = require('../../../test')

let hostname = null;

if(!process.env.TEST_HOST) {
  hostname =  os.hostname()
  console.log(`env variable TEST_HOST not set. using ${hostname} as hostname`)
} else {
  hostname = process.env.TEST_HOST;
}

test('timeouts', async (t) => {
  let request, server, handler
  const [node_port] = await sys.ports()
  t.on('end', (done) => {
    handler.close()
    server.close()
  })

  t.test('set up skyring server', (tt) => {
    server = new Skyring({
      transports: [path.resolve(__dirname, '../')]
    , seeds: [`${hostname}:${node_port}`]
    , node: {port: node_port}
    });
    server.listen(0, null, null, (err) => {
      tt.error(err, 'server listen should not error')
      const {port} = server.address()
      request = supertest(`http://localhost:${port}`)
      tt.end()
    })
  })

  t.test('success - should deliver payload', (tt) => {
    tt.plan(3)
    handler = net.createServer((socket) => {
      socket.setEncoding('utf8')
      socket.once('data', (data) => {
        const payload = JSON.parse(data)
        tt.match(payload, {
          text: 'hello world'
        , status: 200
        })
        socket.end()
        tt.pass('timeout executed')
      })
    }).listen(0).unref()

    request
      .post('/timer')
      .send({
        timeout: 500
      , data: JSON.stringify({
          text: 'hello world'
        , status: 200
        })
      , callback: {
          uri: `tcp://${hostname}:${handler.address().port}`
        , method: 'post'
        , transport: 'tcp'
        }
      })
      .expect(201)
      .end((err, res) => {
        tt.error(err)
      })
  })
  t.end()
})

test('pool', async (t) => {
  let request, server, handler
  const [node_port, callback_port] = await sys.ports(2)
  function doRequest(t) {
    request
      .post('/timer')
      .send({
        timeout: 500
      , data: 'fake'
      , callback: {
          transport: 'tcp'
        , uri: `http://${hostname}:${callback_port}`
        , method: 'post'
        }
      })
      .expect(201)
      .end((err, res) => {
        t.error(err)
      })
  }

  t.on('end', (done) => {
    handler.close()
    server.close()
  })

  t.test('set up skyring server', (tt) => {
    server = new Skyring({
      transports: [require(path.resolve(__dirname, '../'))]
    , seeds: [`${hostname}:${node_port}`]
    , node: {port: node_port}
    });
    server.listen(0, (err) => {
      tt.error(err)
      request = supertest(`http://localhost:${server.address().port}`)
      tt.end()
    })
  })

  t.test('start saturate pool - no connection', (tt) => {
    tt.plan(151)
    for (var x = 0; x < 150; x++ ) {
      doRequest(tt)
    }
    setTimeout(() => {
      tt.pass('saturated')
    }, 2000)
  })

  t.test('success - should deliver payload', (tt) => {
    tt.plan(151)
    handler = net.createServer((socket) => {
      socket.setEncoding('utf8')
      socket.once('data', (data) => {
        tt.match(data, /fake/)
      })
    }).listen(callback_port, (err) => {
      tt.error(err)
      for (var x = 0; x < 150; x++ ) {
        doRequest({error: () => {}})
      }
    })
  })
  t.end()
})



