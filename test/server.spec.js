'use strict'

const assert = require('assert')
    , http = require('http')
    , supertest = require('supertest')
    , Server = require('../lib/server')
    , async = require('async')


describe('server', () => {
  let sone, stwo, sthree
  var os = require('os')
  var hostname;
  if(!process.env.TEST_HOST) {
    hostname =  os.hostname()
    console.log(`env variable TEST_HOST not set. using ${hostname} as hostname`)
  } else {
    hostname = process.env.TEST_HOST;
  }
  before((done) => {
    sone = new Server({
      node: {
        port: 4444
      , host: hostname
      , app: 'spec'
      }
      , seeds: [`${hostname}:4444`, `${hostname}:4445`]
    })
    .load()
    .listen(5555);

    stwo = new Server({
      node:{
        port: 4445
      , host: hostname
      , app: 'spec'
      }
      , seeds: [`${hostname}:4444`, `${hostname}:4445`]
    })
    .load()
    .listen(5556);
    
    sthree = new Server({
      node: {
        port: 4446
      , host: hostname
      , app: 'spec'
      }
      , seeds: [`${hostname}:4444`, `${hostname}:4445`]
    })
    .load()
    .listen(5557, null, null, done);

  })

  after((done) => {
    sone.close(() => {
      stwo.close(() => {
        sthree.close(done);
      });
    });    
  });

  it('should bootstrap server nodes', (done) => {
    assert.ok(sone);
    assert.ok(stwo);
    assert.ok(sthree);
    done();
  })

  describe('rebalance', function() {
    this.timeout(10000)
    let max = 20, count = 0, postback
    before((done) => {
      postback = http.createServer((req, res) => {
        count++;
        res.writeHead(200)
        res.end();
      }).listen( 2222, done );

    })

    after(( done ) => {
      postback.close(done);
    })
    
    it('should survive a lost node', ( done ) => {
      async.until(
        () => { return !max},
        (callback) => {
          const request = supertest('http://localhost:5557');
          request
            .post('/timer')
            .send({
              timeout: 1000
            , data: 'data'
            , callback: {
                uri: 'http://localhost:2222'
              , method: 'post'
              , transport: 'http'
              }
            })
            .expect(201)
            .end((err, res) => {
              assert.ifError(err);
              max--;
              callback();
            })
        },
        ( err ) => {
          assert.ifError(err);

          setTimeout(function(args){
            sthree.close(() => {
              async.until(
                function(){
                  return count === 20;
                },
                function(cb){
                  setImmediate(cb)
                },
                function(err){
                  assert.equal(max, 0, 'max should be 0');
                  assert.equal(count, 20, 'count should be 20')
                  done();
                }
              ) 
            })
          },50);

        }
      );
    });
  });
});
