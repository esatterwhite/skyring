
'user strict';
const http      = require('http')
const os        = require('os')
const {test}    = require('tap')
const supertest = require('supertest')
const nats      = require('../../lib/nats')
const Server    = require('../../lib')
const {ports}   = require('../util')

let hostname = null;

if(!process.env.TEST_HOST) {
  hostname =  os.hostname()
  console.log(`env variable TEST_HOST not set. using ${hostname} as hostname`)
} else {
  hostname = process.env.TEST_HOST;
}

test('skyring:api', async (t) => {
  const [http_port, ring_port] = await ports(2)
  const request = supertest(`http://localhost:${http_port}`)
  t.test('setup skyring server', (tt) => {
    server = new Server({
      seeds: [`${hostname}:${ring_port}`]
    , node: {port: ring_port}
    });
    server.listen(http_port, tt.end)
  });

  t.test('#GET /ping', async (tt) => {
    await request.get('/ping').expect(200)
  })

  t.test('close server', (tt) => {
    server.close(tt.end)
  })

  t.end()
})
