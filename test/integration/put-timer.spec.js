'use strict';
const http = require('http')
    , os = require('os')
    , assert = require('assert')
    , uuid = require('uuid')
    , supertest = require('supertest')
    , Server = require('../../lib')


describe('skyring:api', function() {
  this.timeout(4000);
  let server, request, hostname;
  before(( done ) => {
    const HOST = process.env.TEST_HOST
    hostname = HOST ? HOST : os.hostname();
    server = new Server();
    request = supertest('http://localhost:5544');
    server.load().listen(5544, null, null, done);
  });

  after(( done ) => {
    server.close( done );
  });

  describe('#PUT /timer/:id', () => {
    let url, callback_server, created;
    beforeEach(( done ) => {
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
        .end(( err, res ) => {
          created = Date.now();
          assert.ifError( err );
          assert.ok( res.headers.location );
          url = res.headers.location;
          done( err );
        });
    });
    afterEach(( done ) => {
      if ( callback_server ) {
        return callback_server.close(() => {
          done();
        });
      }
      done();
    });

    it('should modify an existing timer by id', ( done ) => {
      callback_server = http.createServer((req, res) => {
        const now = Date.now();
        let data = '';
        assert.ok( now - created > 2000 )
        req.on('data', (chunk) => {
          data += chunk;
        });
        req.once('end', () => {
          res.writeHead(200);
          res.end();
          assert.equal(data, 'put 1');
          done()
        });
      }).listen(9999, (err) => {
        if (err) return done(err);
      })
      request
        .put(url)
        .send({
          timeout: 2000
        , data: 'put 1'
        , callback: {
            uri: `http://${hostname}:9999`
          , method: 'post'
          , transport: 'http'
          }
        })
        .expect(200)
        .end(( err, res ) => {
          assert.ifError(err);
        });
    });

    it('should 404 for a timer that does not exist', ( done ) => {
      request
        .put(`/timer/${uuid.v4()}`)
        .send({
          timeout: 2000
        , data: 'put 1'
        , callback: {
            uri: `http://${hostname}:9999`
          , method: 'post'
          , transport: 'http'
          }
        })
        .expect(404)
        .end(( err, res ) => {
          assert.ifError(err);
          done();
        });
    });
  });
})
