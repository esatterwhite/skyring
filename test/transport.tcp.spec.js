'use strict'

const net = require('net')
    , os = require('os')
    , path = require('path')
    , tap = require('tap')
    , supertest = require('supertest')
    , Skyring = require('skyring')
    , test = tap.test
    ;

let hostname = null;

if(!process.env.TEST_HOST) {
  hostname =  os.hostname()
  console.log(`env variable TEST_HOST not set. using ${hostname} as hostname`)
} else {
  hostname = process.env.TEST_HOST;
}

test('timeouts', (t) => {
  let request, server, handler
  t.on('end', (done) => {
    handler.close()
    server.close()
  })
  t.test('set up skyring server', (tt) => {
    server = new Skyring({
      transports: [path.resolve(__dirname, '../')]
    , seeds: [`${hostname}:3455`]
    });
    request = supertest('http://localhost:3333')
    server.load().listen(3333, null, null, tt.end)
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
    }).listen(5555).unref()

    request
      .post('/timer')
      .send({
        timeout: 500
      , data: JSON.stringify({
          text: 'hello world'
        , status: 200
        })
      , callback: {
          uri: `tcp://${hostname}:5555`
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

test('pool', (t) => {
  let request, server, handler
  const req = supertest('http://localhost:3333')
  function doRequest(t) {
    req
      .post('/timer')
      .send({
        timeout: 500
      , data: 'fake'
      , callback: {
          transport: 'tcp'
        , uri: `http://${hostname}:5555`
        , method: 'post'
        }
      })
      .expect(201)
      .end((err, res) => {
        t.error(err)
      })
  }
  t.on('end', (done) => {
    console.log("shutting down")
    handler.close()
    server.shutdown()
  })
  t.test('set up skyring server', (tt) => {
    server = new Skyring({
      transports: [require(path.resolve(__dirname, '../'))]
    , seeds: [`${hostname}:3455`]
    });
    request = supertest('http://localhost:3333')
    server.load().listen(3333, null, null, tt.end)
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
    }).listen(5555, (err) => {
      tt.error(err)
      for (var x = 0; x < 150; x++ ) {
        doRequest({error: () => {}})
      }
    })
  })
  t.end()
})



