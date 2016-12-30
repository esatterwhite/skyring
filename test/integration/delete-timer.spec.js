'use strict';
const os        = require('os')
    , http      = require('http')
    , assert    = require('assert')
    , uuid      = require('uuid')
    , supertest = require('supertest')
    , Server    = require('../../lib')
    ;

describe('skyring:api', function() {
  let server, request, hostname;
  this.timeout(4000);
  before(( done ) => {
    const HOST = process.env.TEST_HOST
    hostname = HOST ? HOST : os.hostname();
    server = new Server();
    request = supertest('http://localhost:4444')
    server.load().listen(4444, null, null, done);
  });

  after(( done ) => {
    server.close(done);
  });

  describe('#DELETE /timer/:id', function(){
    let url, callback_server;
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
          assert.ifError(err);
          assert.ok(res.headers.location);
          url = res.headers.location;
          done(err)
        })
    });

    afterEach(( done ) => {
      if( callback_server ){
        return callback_server.close(() => {
          callback_server = null
          done()
        })
      };
      done()
    });

    it('Should cancel an existing timer -202', (done) => {
      callback_server = http.createServer((req, res) => {
        res.writeHead(500);
        res.end();
        const err = new Error('timer should be deleted')
        done(err);
      }).listen(9999);

      request
        .delete(url)
        .expect(202)
        .end((err, res) => {
          assert.ifError(err);
          err && console.log(res.headers['x-skyring-reason'])
          setTimeout(() => {
            done()
          }, 1200);
        });
    }); // end 202

    it('should 404 on a time that was previously canceled', ( done ) => {
      callback_server = http.createServer((req, res) => {
        res.writeHead(500);
        res.end();
        const err = new Error('timer should be deleted')
        done(err);
      }).listen(9999);

      request
        .delete(url)
        .expect(202)
        .end((err, res) => {
          err && console.log(res.headers['x-skyring-reason'])
          assert.ifError(err);
          request
            .delete(url)
            .expect(404)
            .end((err, res) => {
              setTimeout(() => {
                done()
              }, 1200);
            });
        });
    }); // end 404

    it('should 404 on a timer that doesn not exist', ( done ) => {
      request
        .delete(`/timer/${uuid.v4()}`)
        .expect(404)
        .end((err, res) => {
          err && console.log(res.headers['x-skyring-reason'])
          assert.ifError(err);
          request
            .delete(url)
            .expect(404)
            .end((err, res) => {
              setTimeout(() => {
                done()
              }, 1200);
            });
        });
    })
  });
});
