'use strict'

const net = require('net')
    , path = require('path')
    , tap = require('tap')
    , supertest = require('supertest')
    , Skyring = require('skyring')
    , test = tap.test
    ;

let hostname = null;

if(!process.env.TEST_HOST) {
  hostname =  os.hostname()
  console.log(`env variable TEST_HOST not set. using ${hostname} as hostname`)
} else {
  hostname = process.env.TEST_HOST;
}

test('transports:tcp', (t) => {
  let request, server
  t.test('set up skyring server', (tt) => {
    server = new Skyring({
      transports: [path.resolve('../')]
    });
    request = supertest('http://localhost:3333')
    server.load().listen(3333, null, null, tt.end)
  })

  tt.

})

