'use strict'

const qs = require('querystring')
const os = require('os')
const path = require('path')
const http = require('http')
const supertest = require('supertest')
const async = require('async')
const {test, threw} = require('tap')
const {sys, rand} = require('@vendor/test-core')
const Server = require('../../lib/server')

test('server', async (t) => {
  let sone, stwo, sthree, sfour
  var hostname
  if (!process.env.TEST_HOST) {
    hostname = os.hostname()
    console.log(`env variable TEST_HOST not set. using ${hostname} as hostname`)
  } else {
    hostname = process.env.TEST_HOST
  }

  const [
    http_one, http_two, http_three
  , ring_one, ring_two, ring_three, ring_four
  , callback_port
  ] = await sys.ports(8)

  t.test('setup server nodes', (tt) => {
    async.parallel([
      (cb) => {
        sone = new Server({
          node: {
            port: ring_one
          , host: hostname
          , app: 'rebalance'
          }
        , seeds: [`${hostname}:${ring_one}`, `${hostname}:${ring_two}`]
        , storage: {
            path: path.join(os.tmpdir(), rand.bytes())
          , backend: 'leveldown'
          }
        , autobalance: true
        })
          .listen(http_one, cb)
      }
    , (cb) => {
        stwo = new Server({
          node: {
            port: ring_two
          , host: hostname
          , app: 'rebalance'
          }
        , seeds: [`${hostname}:${ring_one}`, `${hostname}:${ring_two}`]
        , storage: {
            path: path.join(os.tmpdir(), rand.bytes())
          , backend: 'leveldown'
          }
        , autobalance: true
        })
          .listen(http_two, cb)
      }
    , (cb) => {
        sthree = new Server({
          node: {
            port: ring_three
          , host: hostname
          , app: 'rebalance'
          }
        , seeds: [`${hostname}:${ring_one}`, `${hostname}:${ring_two}`]
        , storage: {
            path: path.join(os.tmpdir(), rand.bytes())
          , backend: 'memdown'
          }
        })
          .listen(http_three, cb)
      }
    ], (err) => {
      tt.error(err)
      sfour = new Server({
        node: {
          port: ring_four
        , host: hostname
        , app: 'rebalance'
        }
      , seeds: [`${hostname}:${ring_one}`, `${hostname}:${ring_two}`]
      , storage: {
          path: path.join(os.tmpdir(), rand.bytes())
        , backend: 'memdown'
        }
      })
      sthree.listen(0, tt.end)
    })
  })

  t.on('end', () => {
    sone.close(() => {
      t.comment('sone closed')
    })

    stwo.close(() => {
      t.comment('stwo closed')
    })
    sfour.close(() => {
      t.comment('sfour closed')
    })
  })

  t.test('should bootstrap server nodes', (tt) => {
    tt.ok(sone)
    tt.ok(stwo)
    tt.ok(sthree)
    tt.ok(sfour)
    tt.end()
  })

  t.test('route() adds custom rout', async (tt) => {
    sone.route({
      method: 'GET'
    , path: '/foo/bar'
    , handler: (req, res, node, cb) => {
        setImmediate(() => {
          res.$.body = {foo: 1}
          cb()
        })
      }
    })

    const {body} = await supertest(`http://localhost:${sone.address().port}`)
      .get('/foo/bar')
      .expect(200)

    tt.deepEquals(body, {foo: 1})
  })
  t.test('rebalance on shutdown', (tt) => {
    let count = 0; let postback

    tt.on('end', (done) => {
      postback && postback.close(done)
    })

    tt.test('should survive a nodes moving', (ttt) => {
      const request = supertest(`http://localhost:${http_one}`)
      postback = http.createServer((req, res) => {
        const q = qs.parse(req.url.replace(/^[/?]+/, ''))
        ttt.pass(`timer ${q.idx} handled`)
        res.writeHead(200)
        res.end()
      }).listen(callback_port)

      async.until(
        async function _test() {
          const sone_count = sone._timers.size
          const stwo_count = stwo._timers.size
          const sthree_count = sthree._timers.size
          const valid = (sone_count > 2 && stwo_count > 2 && sthree_count > 2)
          return valid
        }
      , async function action() {
          count++
          await request
            .post('/timer')
            .send({
              timeout: 5000
            , data: 'data'
            , callback: {
                uri: `http://localhost:${callback_port}?idx=${count}`
              , method: 'post'
              , transport: 'http'
              }
            })
            .expect(201)
        }
      , function exec(err) {
          ttt.comment(`expected timers ${count}`)
          ttt.plan(count + 2)
          ttt.error(err)
          // start server 4
          sfour.listen(0, () => {
            // drop server 3
            setTimeout(() => {
              sthree.close(() => {
                ttt.pass('server closed')
              })
            }, 200)
          })
        }
      )
    })
    tt.end()
  })
}).catch(threw)
