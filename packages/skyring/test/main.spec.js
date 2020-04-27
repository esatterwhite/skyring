'use strict'

const path = require('path')
const {spawn} = require('child_process')
const {test} = require('tap')
const supertest = require('supertest')

test('server starts when executed directly', (t) => {
  const LISTEN_EXP = /server listen/ig
  const server = path.join(__dirname, '..', 'index.js')
  const child = spawn(process.execPath, [server], {
    env: Object.assign({}, process.env, {
      DEBUG: 'skyring:main'
    , seeds: '127.0.0.1:2222'
    , channel__port: '2222'
    })
  , cwd: path.join(__dirname, '..')
  })

  let buf = ''
  const cases = { listen: false }
  child.once('error', t.threw)
  child.stderr.on('data', (chunk) => {
    buf += chunk.toString()
    if (!cases.listen && LISTEN_EXP.test(buf)) {
      cases.listen = true
      getPing()
    }
  })

  function getPing() {
    const request = supertest('http://localhost:3000')
    request
      .get('/ping')
      .expect(200)
      .end((err, res) => {
        t.error(err)
        t.equal(cases.listen, true)
        child.kill('SIGTERM')
      })
  }

  child.on('close', (code, signal) => {
    t.equal(code, 0)
    t.end()
  })
})
