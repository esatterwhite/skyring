'user strict';
const http      = require('http')
    , os        = require('os')
    , tap       = require('tap')
    , supertest = require('supertest')
    , nats      = require('../../lib/nats')
    , Server    = require('../../lib')
    , test      = tap.test
    ;


let hostname = null;

if(!process.env.TEST_HOST) {
  hostname =  os.hostname()
  console.log(`env variable TEST_HOST not set. using ${hostname} as hostname`)
} else {
  hostname = process.env.TEST_HOST;
}

function toServer(port, expect = 'hello', method = 'post', time = 1000, t){
  const start = Date.now()
  const s = http.createServer((req, res) => {
    let data = ''
      , now = Date.now()
      ;

    res.writeHead(200);
    res.end('ok');
    t.equal(req.method.toLowerCase(), method, 'request method');
    req.on('data', (chunk) => {
      data += chunk
    });
    req.on('end', () => {
      t.ok(now - start > time, `expected > ${time} got ${now-start}`)
      t.equal(data, expect);
      s.close(() => {
        t.pass('server close')
      })
    });
  }).listen(port);
  return s
}

test('skyring:api', (t) => {
  let request, server
  t.test('setup skyring server', (tt) => {
    server = new Server({
      seeds: [`${hostname}:3455`]
    });
    request = supertest('http://localhost:3333');
    server.load().listen(3333, null, null, tt.end)
  });

  t.test('#POST /timer', (tt) => {
    let sone, stwo, sthree

    tt.test('should set a timer postback (201)', (ttt) => {
      ttt.plan(6)
      toServer(8989, 'hello', 'post', 1000, ttt)
      request
        .post('/timer')
        .send({
          timeout: 1000
        , data: 'hello'
        , callback: {
            uri: `http://${hostname}:8989`
          , method: 'post'
          , transport: 'http'
          }
        })
        .expect(201)
        .end((err, res) => {
          ttt.error(err)
          ttt.ok(res.headers.location, 'location header')
        });
    });

    tt.test('should allow request with no data - (201)', (ttt) => {
      ttt.plan(6)
      toServer(8989, '', 'post', 2000, ttt)
      request
        .post('/timer')
        .send({
          timeout: 2000
        , callback: {
            uri: `http://${hostname}:8989`
          , method: 'post'
          , transport: 'http'
          }
        })
        .expect(201)
        .end((err, res) => {
          ttt.error(err)
          ttt.ok(res.headers.location, 'location header')
        });
    });

    tt.test('should allow request with timeout - (400)', (ttt) => {
      request
        .post('/timer')
        .send({
          callback: {
            uri: `http://${hostname}:8989`
          , data: 'fake'
          , method: 'post'
          , transport: 'http'
          }
        })
        .expect(400)
        .end((err, res) => {
          ttt.equal(typeof res.headers['x-skyring-reason'], 'string')
          ttt.end()
        });
    });

    tt.test('should allow request with no callback uri - (400)', (ttt) => {
      request
        .post('/timer')
        .send({
          callback: {
            timeout: 3000
          , data: 'fake'
          , method: 'post'
          , transport: 'http'
          }
        })
        .expect(400)
        .end((err, res) => {
          ttt.error(err)
          ttt.equal(typeof res.headers['x-skyring-reason'], 'string')
          ttt.end()
        });
    });

    tt.test('should allow request with no transport - (400)', (ttt) => {
      request
        .post('/timer')
        .send({
          callback: {
            timeout: 3000
          , data: 'fake'
          , method: 'post'
          }
        })
        .expect(400)
        .end((err, res) => {
          ttt.error(err)
          ttt.equal(typeof res.headers['x-skyring-reason'], 'string')
          ttt.end()
        });
    });
    tt.test('should not allow request with no callback - (400)', (ttt) => {
      request
        .post('/timer')
        .send({
          timeout:1000
        , data: 'hello'
        })
        .expect(400)
        .end((err, res) => {
          ttt.error(err)
          ttt.end()
        });
    });

    tt.test('should not allow request with no uri - (400)', (ttt) => {
      request
        .post('/timer')
        .send({
          timeout:1000
        , data: 'hello'
        , callback: {
            transport: 'http'
          , method: 'post'
          }
        })
        .expect(400)
        .end((err, res) => {
          ttt.error(err)
          ttt.end()
        });
    });

    tt.test('should not allow request with no transport - (400)', (ttt) => {
      request
        .post('/timer')
        .send({
          timeout:1000
        , data: 'hello'
        , callback: {
            uri: 'http://foo.com'
          , method: 'post'
          }
        })
        .expect(400)
        .end((err, res) => {
          ttt.error(err)
          ttt.end()
        });
    });
    tt.end()
  });
  t.test('close server', (tt) => {
    server.close(tt.end)
  })
  t.end()
});
