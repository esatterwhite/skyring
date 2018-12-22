'use strict';
const http = require('http')
    , os = require('os')
    , tap = require('tap')
    , uuid = require('uuid')
    , supertest = require('supertest')
    , Server = require('../../lib')
    , test = tap.test
    ;

let hostname = null;

if(!process.env.TEST_HOST) {
  hostname =  os.hostname()
  console.log(`env variable TEST_HOST not set. using ${hostname} as hostname`)
} else {
  hostname = process.env.TEST_HOST;
}

test('skyring:api', (t) => {
  let server, request;
  t.test('set up ring server', ( tt ) => {
    server = new Server({ seeds: [`${hostname}:3455`] });
    request = supertest('http://localhost:5544');
    server.listen(5544, null, null, tt.end);
  });

  t.on('end', ( done ) => {
    server.close( done );
  });

  t.test('#PUT /timer/:id', (tt) => {
    let url, callback_server, created;
    tt.beforeEach(( done ) => {
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
          url = res.headers.location;
          done( err );
        });
    });
    tt.afterEach(( done ) => {
      if ( callback_server ) {
        return callback_server.close(() => {
          done();
        });
      }
      done();
    });

    tt.test('should modify an existing timer by id', ( ttt ) => {
      callback_server = http.createServer((req, res) => {
        const now = Date.now();
        let data = '';
        ttt.ok( now - created > 2000 )
        req.on('data', (chunk) => {
          data += chunk;
        });
        req.once('end', () => {
          ttt.equal(data, 'put 1');
          res.writeHead(200);
          res.end();
        });
      }).listen(9898, (err) => {
        ttt.error(err);
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
          ttt.error(err);
          ttt.end()
        });
    });

    tt.test('should 404 for a timer that does not exist', ( ttt ) => {
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
          ttt.error(err);
          ttt.end();
        });
    });
    tt.end()
  });
  t.end()
})
