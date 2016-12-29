'user strict'
const http = require('http')
    , assert = require('assert')
    , supertest = require('supertest')
    , nats = require('../../lib/nats')
    , Server = require('../../lib')
    ;

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
    this.timeout(3000);
    it('should set a timer postback - 1000ms', ( done ) => {
      let start;
      const s = http.createServer((req, res) => {
        let data = ''
          , now = Date.now()
          ;

        res.writeHead(200);
        res.end('ok');
        assert.equal(req.method.toLowerCase(), 'post');
        req.on('data', (chunk) => {
          data += chunk
        });
        req.on('end', () => {
          assert.equal(data, 'hello');
          assert.ok(now - start > 1000, `expected > 1000 got ${now-start}`)
          s.close( done )
        });

      }).listen(9999);
      start = Date.now()
      request
        .post('/timer')
        .send({
          timeout: 1000
        , data: 'hello'
        , callback: {
            uri: 'http://node-5:9999'
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
  });
});
