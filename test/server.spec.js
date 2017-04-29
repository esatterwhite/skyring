'use strict'

const crypto    = require('crypto')
    , http      = require('http')
    , supertest = require('supertest')
    , async     = require('async')
    , conf      = require('keef')
    , tap       = require('tap')
    , Server    = require('../lib/server')
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
          , app: 'spec'
          }
        , seeds: [`${hostname}:4444`, `${hostname}:4445`]
        , storage:{
            path: crypto.randomBytes(19).toString('hex')
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
          , app: 'spec'
          }
        , seeds: [`${hostname}:4444`, `${hostname}:4445`]
        , storage:{
            path: crypto.randomBytes(19).toString('hex')
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
          , app: 'spec'
          }
        , seeds: [`${hostname}:4444`, `${hostname}:4445`]
        , storage:{
            path: crypto.randomBytes(19).toString('hex')
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
    let max = 50, count = 0, postback

    tt.on('end',(done) => {
      postback && postback.close(done);
    })

    tt.test('should survive a lost node', ( ttt ) => {
      postback = http.createServer((req, res) => {
        count++;
        res.writeHead(200)
        res.end();
      }).listen( 2222 );

      async.until(
        () => {
          return !max
        }

        , (callback) => {
          const request = supertest('http://localhost:5557');
          request
            .post('/timer')
            .send({
              timeout: 500
            , data: 'data'
            , callback: {
                uri: 'http://localhost:2222'
              , method: 'post'
              , transport: 'http'
              }
            })
            .expect(201)
            .end((err, res) => {
              ttt.error(err)
              max--;
              callback();
            })
        }

        , ( err ) => {
          ttt.error(err)
          setTimeout(function(args){
            sthree.close(() => {
              async.until(
                function(){
                  return count === 50;
                },
                function(cb){
                  setTimeout(cb, 1)
                },
                function(err){
                  ttt.equal(max, 0, 'max should be 0');
                  ttt.equal(count, 50, 'count should be 50')
                  ttt.end();
                }
              ) 
            })
          },50);
        }
      );
    });
    tt.end()
  });
  t.end()
});
