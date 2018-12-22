
'user strict';
const http      = require('http')
    , os        = require('os')
    , tap       = require('tap')
    , supertest = require('supertest')
    , nats      = require('../../lib/nats')
    , Server    = require('../../lib')
    , test      = tap.test
    ;
let hostname = null;

if(!process.env.TEST_HOST) {
  hostname =  os.hostname()
  console.log(`env variable TEST_HOST not set. using ${hostname} as hostname`)
} else {
  hostname = process.env.TEST_HOST;
}

test('skyring:api', (t) => {

  const request = supertest('http://localhost:3333')
  t.test('setup skyring server', (tt) => {
    server = new Server({
      seeds: [`${hostname}:3455`]
    });
    server.listen(3333, null, null, tt.end)
  });

  t.test('#GET /ping', (tt) => {
    request
      .get('/ping')
      .expect(200)
      .end((err, res) => {
        tt.error(err)
        tt.end()
      })
  })

  t.test('close server', (tt) => {
    server.close(tt.end)
  })

  t.end()
})
