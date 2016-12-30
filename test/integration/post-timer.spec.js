'user strict';
const http = require('http')
    , assert = require('assert')
    , supertest = require('supertest')
    , nats = require('../../lib/nats')
    , Server = require('../../lib')
    ;

function toServer(port, expect = 'hello', method = 'post', time = 1000, cb){
  const start = Date.now()
  const s = http.createServer((req, res) => {
    let data = ''
      , now = Date.now()
      ;

    res.writeHead(200);
    res.end('ok');
    assert.equal(req.method.toLowerCase(), method);
    req.on('data', (chunk) => {
      data += chunk
    });
    req.on('end', () => {
      assert.ok(now - start > time, `expected > ${time} got ${now-start}`)
      assert.equal(data, expect);
      s.close( cb )
    });
  }).listen(port);
  return s
}

describe('skyring:api', function() {
  this.timeout(4000)
  let request, server
  before(( done ) => {
    server = new Server();
    request = supertest('http://localhost:3333');
    server.load().listen(3333, null, null, done)
  });

  after((done) => {
    server.close(done)
  });

  describe('#POST /timer', function(){
    let sone, stwo, sthree
    var os = require('os')
    var hostname;
    if(!process.env.TEST_HOST) {
      hostname =  os.hostname()
      console.log(`env variable TEST_HOST not set. using ${hostname} as hostname`)
    } else {
      hostname = process.env.TEST_HOST;
    }
    describe('valid request', function(){
      this.timeout(3000);
      it('should set a timer postback (201)', ( done ) => {
        toServer(9999, 'hello', 'post', 1000, done)
        request
          .post('/timer')
          .send({
            timeout: 1000
          , data: 'hello'
          , callback: {
              uri: `http://${hostname}:9999`
            , method: 'post'
            , transport: 'http'
            }
          })
          .expect(201)
          .end((err, res) => {
            assert.ifError(err);
            assert.ok(res.headers.location)
          });
      });

      it('should allow request with no data - (201)', (done) => {
        toServer(9999, '', 'post', 2000, done)
        request
          .post('/timer')
          .send({
            timeout: 2000
          , callback: {
              uri: `http://${hostname}:9999`
            , method: 'post'
            , transport: 'http'
            }
          })
          .expect(201)
          .end((err, res) => {
            assert.ifError(err);
            assert.ok(res.headers.location)
          });
      });

      it('should allow request with timeout - (400)', (done) => {
        request
          .post('/timer')
          .send({
            callback: {
              uri: `http://${hostname}:9999`
            , data: 'fake'
            , method: 'post'
            , transport: 'http'
            }
          })
          .expect(400)
          .end((err, res) => {
            assert.equal(typeof res.headers['x-skyring-reason'], 'string')
            done()
          });
      });

      it('should allow request with no callback uri - (400)', (done) => {
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
            assert.equal(typeof res.headers['x-skyring-reason'], 'string')
            done()
          });
      });

      it('should allow request with no transport - (400)', (done) => {
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
            assert.equal(typeof res.headers['x-skyring-reason'], 'string')
            done()
          });
      });
      it('should not allow request with no callback - (400)', (done) => {
        request
          .post('/timer')
          .send({
            timeout:1000
          , data: 'hello'
          })
          .expect(400)
          .end((err, res) => {
            done()
          });
      });

    })

  });
});
