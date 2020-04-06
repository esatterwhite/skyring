'user strict';
const http              = require('http')
const os                = require('os')
const {test}            = require('tap')
const supertest         = require('supertest')
const Server            = require('../../lib')
const {sys, testCase}   = require('../../../../test')


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
    const now = Date.now()
    let data = ''

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
    server.listen(3333, (err) => {
      tt.error(err, 'starting the server should not error')
      request = supertest(`http://localhost:${server.address().port}`);
      tt.end()
    })
  });

  t.test('#POST /timer', (tt) => {
    let sone, stwo, sthree

    testCase(tt, {
      code: 201
    , description: 'should set a timer postback'
    }, (ttt) => {
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

    tt.test('should not allow request with timeout exceeding maximum - (400)', (ttt) => {
      request
        .post('/timer')
        .send({
          timeout: Math.pow(2, 31)
        , callback: {
            uri: `http://${hostname}:8989`
          , method: 'post'
          , transport: 'http'
          }
        })
        .expect(400)
        .end((err, res) => {
          ttt.equal(typeof res.headers['x-skyring-reason'], 'string');
          ttt.end()
        });
    });

    tt.test('should not allow request with no callback uri - (400)', (ttt) => {
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

    tt.test('should not allow request with no transport - (400)', (ttt) => {
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

    testCase(tt, {
      code: 400
    , description: 'should not allow request with no callback'
    }, async (ttt) => {
      const payload ={
        timeout:1000
      , data: 'hello'
      }
      const {headers} = await request.post('/timer').send(payload).expect(400)
      ttt.match(headers, {
        location: /\/timer\/(\w+)/
      , 'x-skyring-reason': /callback is required/ig
      })
    });

    testCase(tt, {
      code: 400
    , description: 'should not allow request with no uri'
    }, async (ttt) => {
      const payload = {
        timeout:1000
      , data: 'hello'
      , callback: {
          transport: 'http'
        , method: 'post'
        }
      }
      await request.post('/timer').send(payload).expect(400)
    });

    testCase(tt, {
      code: 400
    , description: 'should not allow request with no transport'
    }, async (ttt) => {
      const payload = {
        timeout:1000
      , data: 'hello'
      , callback: {
          uri: 'http://foo.com'
        , method: 'post'
        }
      }
      await request.post('/timer').send(payload).expect(400)
    });

    testCase(tt, {
      code: 400
    , description: 'Invalid JSON'
    }, async (ttt) => {
      await request
        .post('/timer')
        .set({
          'Content-Type': 'application/json'
        })
        .send('{"foo","bar"}')
        .expect(400)
    })
    tt.end()
  });

  t.test('close server', (tt) => {
    server.close(tt.end)
  })
  t.end()
});
