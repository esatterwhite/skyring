'use strict';
const os        = require('os')
    , http      = require('http')
    , tap       = require('tap')
    , uuid      = require('uuid')
    , supertest = require('supertest')
    , Server    = require('../../lib')
    , test      = tap.test
    ;

let hostname = null;

if (!process.env.TEST_HOST) {
  hostname =  os.hostname()
  console.log(`env variable TEST_HOST not set. using ${hostname} as hostname`)
} else {
  hostname = process.env.TEST_HOST;
}

test('skyring:api', (t) => {
  let server, request;
  t.test('set up skyring server', (tt) => {
    server = new Server({
      seeds: [`${hostname}:3455`]
    });
    request = supertest('http://localhost:4444')
    server.listen(4444, null, null, tt.end);
  });

  t.on('end', () => {
    server.close();
  });

  function getLocation(cb) {
    request
      .post('/timer')
      .send({
        timeout: 1000
      , data: 'hello'
      , callback: {
          uri: `http://${hostname}:7777`
        , method: 'post'
        , transport: 'http'
        }
      })
      .expect(201)
      .end(( err, res ) => {
        if (err) return cb(err)
        cb(null, res.headers.location)
      })
  }
  t.test('#DELETE /timer/:id', (tt) => {
    tt.test('Should cancel an existing timer -202', (ttt) => {
      const callback_server = http.createServer((req, res) => {
        res.writeHead(500);
        res.end();
        const err = new Error('timer should be deleted')
        ttt.fail('callback server request')
      }).listen(7777);

      getLocation((err, url) => {
        request
          .delete(url)
          .expect(202)
          .end((err, res) => {
            ttt.error(err)
            err && console.log(res.headers['x-skyring-reason'])
            setTimeout(() => {
              callback_server.close(() => {
                ttt.end()
              })
            }, 1200);
          });
      })
    }); // end 202

    tt.test('should 404 on a time that was previously canceled', (ttt) => {
      getLocation((err, url) => {
        ttt.error(err)
        request
          .delete(url)
          .expect(202)
          .end((err, res) => {
            err && ttt.fail(res.headers['x-skyring-reason'])
            ttt.error(err);
            ttt.pass(`delete ${url}`)
            request
              .delete(url)
              .expect(404)
              .end((err, res) => {
                ttt.error(err)
                setTimeout(() => {
                  ttt.end()
                }, 1200);
              });
          });
      })
    }); // end 404

    const id = uuid.v4()
    tt.test('should 404 on a timer that doesn not exist ' + id, (ttt) => {
      request
        .delete(`/timer/${id}`)
        .expect(404)
        .end((err, res) => {
          ttt.error(err)
          err && ttt.fail(res.headers['x-skyring-reason'])
          ttt.end()
        });
    })
    tt.end()
  });
  t.end()
});
