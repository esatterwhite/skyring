'use strict'
const http = require('http')
const os = require('os')
const {test} = require('tap')
const uuid = require('uuid')
const supertest = require('supertest')
const Server = require('../../lib')
const {ports} = require('../util')

let hostname = null

if(!process.env.TEST_HOST) {
  hostname =  os.hostname()
  console.log(`env variable TEST_HOST not set. using ${hostname} as hostname`)
} else {
  hostname = process.env.TEST_HOST
}

test('skyring:api', async (t) => {
  let server, request
  const [http_port, ring_port] = await ports(2)
  t.test('set up ring server', ( tt ) => {
    server = new Server({
      seeds: [`${hostname}:${ring_port}`]
    , node: {port: ring_port}
    })
    request = supertest(`http://localhost:${http_port}`)
    server.listen(http_port, (err) => {
      tt.error(err)
      tt.end()
    })
  })

  t.on('end', ( done ) => {
    if (!server) return done()
    server.close(done)
  })

  t.test('#PUT /timer/:id', (tt) => {
    let url, callback_server, created
    tt.on('end',() => {
      if (callback_server && callback_server.listening) {
        callback_server.close()
      }
    })
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
        .end((err, res) => {
          created = Date.now()
          url = res.headers.location
          done(err)
        })
    })

    tt.test('should modify an existing timer by id', (ttt) => {
      ttt.plan(4)
      callback_server = http.createServer((req, res) => {
        const now = Date.now()
        let data = ''
        ttt.ok(now - created >= 250, 'timeout lapse time')
        req.on('data', (chunk) => {
          data += chunk
        })
        req.once('end', () => {
          ttt.equal(data, 'put 1', 'data = put 1')
          res.writeHead(200)
          res.end()
        })
      }).listen(9999, (err) => {
        ttt.error(err, 'server started')
      })
      request
        .put(url)
        .send({
          timeout: 250
        , data: 'put 1'
        , callback: {
            uri: `http://${hostname}:9999`
          , method: 'post'
          , transport: 'http'
          }
        })
        .expect(200)
        .end(ttt.error)
    })

    tt.test('should 404 for a timer that does not exist', (ttt) => {
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
        .end((err, res) => {
          ttt.error(err)
          ttt.end()
        })
    })
    tt.end()
  })
  t.end()
})
