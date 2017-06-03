'use strict'

const url       = require('url')
    , qs        = require('querystring')
    , crypto    = require('crypto')
    , os        = require('os')
    , path      = require('path')
    , http      = require('http')
    , supertest = require('supertest')
    , async     = require('async')
    , conf      = require('keef')
    , tap       = require('tap')
    , Server    = require('../../lib/server')
    , test      = tap.test


test('server', (t) => {
  let sone, stwo, sthree
  var os = require('os')
  var hostname;
  if(!process.env.TEST_HOST) {
    hostname =  os.hostname()
    console.log(`env variable TEST_HOST not set. using ${hostname} as hostname`)
  } else {
    hostname = process.env.TEST_HOST;
  }

  t.test('setup server nodes',(tt) => {
    async.parallel([
      (cb) => {
        sone = new Server({
          node: {
            port: 4444
          , host: hostname
          , app: 'rebalance'
          }
        , seeds: [`${hostname}:4444`, `${hostname}:4445`]
        , storage:{
            path: path.join(os.tmpdir(), crypto.randomBytes(10).toString('hex'))
          }
        })
        .load()
        .listen(5555, null ,null, cb);
      }
    , (cb) => {
        stwo = new Server({
          node:{
            port: 4445
          , host: hostname
          , app: 'rebalance'
          }
        , seeds: [`${hostname}:4444`, `${hostname}:4445`]
        , storage:{
            path: path.join(os.tmpdir(), crypto.randomBytes(10).toString('hex'))
          }
        })
        .load()
        .listen(5556, null, null, cb);
      }
    , (cb) => {
        sthree = new Server({
          node: {
            port: 4446
          , host: hostname
          , app: 'rebalance'
          }
        , seeds: [`${hostname}:4444`, `${hostname}:4445`]
        , storage:{
            path: path.join(os.tmpdir(), crypto.randomBytes(10).toString('hex'))
          }
        })
        .load()
        .listen(5557, null, null, cb);
      }
    ], (err) => {
      tt.error(err)
      tt.end()
    });
  })

  t.on('end', () => {
    sone.close(() => {
      tap.pass('sone closed')
    });

    stwo.close(() => {
      tap.pass('two closed')
    });
  });

  t.test('should bootstrap server nodes', (tt) => {
    tt.ok(sone);
    tt.ok(stwo);
    tt.ok(sthree);
    tt.end();
  })

  t.test('rebalance', function(tt) {
    let count = 0, postback

    tt.on('end',(done) => {
      postback && postback.close(done);
    })

    tt.test('should survive a lost node', ( ttt ) => {
      ttt.plan(101)
      const request = supertest('http://localhost:5557');
      const requests = Array.from(Array(50).keys())
      postback = http.createServer((req, res) => {
        const parsed = url.parse(req.url)
        const q = qs.parse(parsed.query)
        ttt.pass(`${q.idx} idx`)
        res.writeHead(200)
        res.end();
      }).listen( 2222 );

      async.each(requests, (idx, cb) => {
        request
          .post('/timer')
          .send({
            timeout: 5000
          , data: 'data'
          , callback: {
              uri: `http://localhost:2222?idx=${idx}`
            , method: 'post'
            , transport: 'http'
            }
          })
          .expect(201)
          .end((err, res) => {
            ttt.error(err)
            cb()
          })
      }, (err) => {
        ttt.error(err)
        sthree.close()
      })
    });
    tt.end()
  });
  t.end()
});
