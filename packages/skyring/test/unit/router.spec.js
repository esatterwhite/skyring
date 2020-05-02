'use strict'

const http = require('http')
const body = require('body')
const {test, threw} = require('tap')
const supertest = require('supertest')
const Router = require('../../lib/server/router')
const {testCase} = require('../../../../test')

test('router', async (t) => {
  testCase(t, {
    code: 'GET'
  , description: 'router#get adds handler for a get request'
  }, (tt) => {
    let server = null
    let request = null
    const router = new Router()
    tt.on('end', () => {
      server && server.close()
    })

    tt.test('setup http', (ttt) => {
      server = http.createServer((req, res) => {
        router.handle(req, res)
      }).listen(0, (err) => {
        ttt.error(err)
        request = supertest(`http://localhost:${server.address().port}`)
        ttt.end()
      })
    })

    tt.test('/foo/:bar', (ttt) => {
      ttt.plan(5)

      const route = router.get('/foo/:bar', (req, res, node, cb) => {
        const header = req.$.get('x-manual-header')
        ttt.equal(header, 'foobar', 'x-manual-header = foobar')
        ttt.match(req.$.params, {bar: '1'})
        res.$.set('x-response-header', 'test')
        res.$.status(200)
        cb()
      })

      ttt.strictEqual(null, route.match('/foo'), 'invalid url == null')
      ttt.match(route.match('/foo/fake'), {
        bar: 'fake'
      })

      request
        .get('/foo/1')
        .set({'x-manual-header': 'foobar'})
        .expect(200)
        .end((err, res) => {
          ttt.error(err)
        })
    })
    tt.end()
  })

  testCase(t, {
    code: 'POST'
  , description: 'router#post adds handler for a post request'
  }, (tt) => {
    let server = null
    let request = null
    const router = new Router()
    tt.on('end', () => {
      server && server.close()
    })

    tt.test('setup http', (ttt) => {
      server = http.createServer((req, res) => {
        router.handle(req, res)
      }).listen(0, (err) => {
        ttt.error(err)
        request = supertest(`http://localhost:${server.address().port}`)
        ttt.end()
      })
    })

    tt.test('/foo', (ttt) => {
      const route = router.post('/foo', (req, res, node, cb) => {
        ttt.match(req.$.body, {
          bar: 'baz'
        })
        res.$.status(201)
        cb(null, {baz: 'foo'})
      })

      route.before([
        (req, res, _, cb) => {
          body(req, res, (err, data) => {
            ttt.error(err)
            try {
              req.$.body = JSON.parse(data)
              return cb()
            } catch (err) {
              cb(err)
            }
          })
        }
      ])

      request
        .post('/foo')
        .set({'Content-Type': 'application/json'})
        .send({bar: 'baz'})
        .expect(201)
        .end((err, res) => {
          ttt.error(err)
          ttt.end()
        })
    })
    tt.end()
  })

  testCase(t, {
    code: 'PUT'
  , description: 'router#put adds handler for a put request'
  }, (tt) => {
    let server = null
    let request = null
    const router = new Router()
    tt.on('end', () => {
      server && server.close()
    })

    tt.test('setup http', (ttt) => {
      server = http.createServer((req, res) => {
        router.handle(req, res)
      }).listen(0, (err) => {
        ttt.error(err)
        request = supertest(`http://localhost:${server.address().port}`)
        ttt.end()
      })
    })

    tt.test('/foo/:baz(\\w+)', (ttt) => {
      const route = router.put('/foo/:baz(\\w+)', (req, res, node, cb) => {
        ttt.match(req.$.body, {
          bar: 'baz'
        })
        ttt.match(req.$.params, {
          baz: 'foobar'
        })
        res.$.status(202)
        res.$
          .send('created')
          .end()
      })

      route.before([
        (req, res, _, cb) => {
          body(req, res, (err, data) => {
            ttt.error(err)
            try {
              req.$.body = JSON.parse(data)
              return cb()
            } catch (err) {
              cb(err)
            }
          })
        }
      ])

      request
        .put('/foo/foobar')
        .set({'Content-Type': 'application/json'})
        .send({bar: 'baz'})
        .expect(202)
        .end((err, res) => {
          ttt.error(err)
          ttt.end()
        })
    })
    tt.end()
  })

  testCase(t, {
    code: 'PATCH'
  , description: 'router#patch adds handler for a patch request'
  }, (tt) => {
    let server = null
    let request = null
    const router = new Router()
    tt.on('end', () => {
      server && server.close()
    })

    tt.test('setup http', (ttt) => {
      server = http.createServer((req, res) => {
        router.handle(req, res)
      }).listen(0, (err) => {
        ttt.error(err)
        request = supertest(`http://localhost:${server.address().port}`)
        ttt.end()
      })
    })

    tt.test('/patch/:baz(\\w+)', (ttt) => {
      const route = router.patch('/patch/:baz(\\w+)', (req, res, node, cb) => {
        ttt.match(req.$.body, {
          bar: 'baz'
        })
        ttt.match(req.$.params, {
          baz: 'resource'
        })
        res.$.status(202)
        res.$.set('Content-Type', 'text/plain')
        ttt.equal(
          res.$.get('content-type')
        , 'text/plain'
        , 'content-type header set'
        )
        cb()
      })

      route.before([
        (req, res, _, cb) => {
          body(req, res, (err, data) => {
            ttt.error(err)
            try {
              req.$.body = JSON.parse(data)
              return cb()
            } catch (err) {
              cb(err)
            }
          })
        }
      ])

      request
        .patch('/patch/resource')
        .set({'Content-Type': 'application/json'})
        .send({bar: 'baz'})
        .expect(202)
        .end((err, res) => {
          ttt.error(err)
          ttt.end()
        })
    })
    tt.end()
  })

  testCase(t, {
    code: 'DELETE'
  , description: 'router#delete adds handler for a delete request'
  }, (tt) => {
    let server = null
    let request = null
    const router = new Router()
    tt.on('end', () => {
      server && server.close()
    })

    tt.test('setup http', (ttt) => {
      server = http.createServer((req, res) => {
        router.handle(req, res)
      }).listen(0, (err) => {
        ttt.error(err)
        request = supertest(`http://localhost:${server.address().port}`)
        ttt.end()
      })
    })

    tt.test('/delete/:whiz(\\w+)', (ttt) => {
      router.delete('/delete/:whiz(\\w+)', (req, res, node, cb) => {
        ttt.match(req.$.params, {
          whiz: 'resource'
        })
        res.$.status(204)
        cb()
      })

      request
        .delete('/delete/resource')
        .expect(204)
        .end((err, res) => {
          ttt.error(err)
          ttt.end()
        })
    })
    tt.end()
  })

  testCase(t, {
    code: 'OPTIONS'
  , description: 'router#options adds handler for a options request'
  }, (tt) => {
    let server = null
    let request = null
    const router = new Router()
    tt.on('end', () => {
      server && server.close()
    })

    tt.test('setup http', (ttt) => {
      server = http.createServer((req, res) => {
        router.handle(req, res)
      }).listen(0, (err) => {
        ttt.error(err)
        request = supertest(`http://localhost:${server.address().port}`)
        ttt.end()
      })
    })

    tt.test('/opts', (ttt) => {
      router.options('/opts', (req, res, node, cb) => {
        res.$.status(204)
        cb()
      })

      request
        .options('/opts')
        .expect(204)
        .end((err, res) => {
          ttt.error(err)
          ttt.end()
        })
    })
    tt.end()
  })

  testCase(t, {
    code: 200
  , description: 'route#route duplicate routes paths stack'
  }, (tt) => {
    let server = null
    let request = null
    const router = new Router()
    tt.on('end', () => {
      server && server.close()
    })

    tt.test('setup http', (ttt) => {
      server = http.createServer((req, res) => {
        router.handle(req, res)
      }).listen(0, (err) => {
        ttt.error(err)
        request = supertest(`http://localhost:${server.address().port}`)
        ttt.end()
      })
    })

    tt.test('/stack', (ttt) => {
      const route = router.route('/stack', 'GET', (req, res, node, cb) => {
        res.$.body.stack++
        cb()
      })

      router.route('/stack', 'GET', [(req, res, node, cb) => {
        res.$.body.stack++
        cb()
      }])

      route.before(
        (req, res, node, cb) => {
          res.$.body = {stack: 0}
          cb()
        }
      )

      request
        .get('/stack')
        .set({
          'Accept': 'application/json'
        })
        .expect(200)
        .end((err, res) => {
          ttt.error(err)
          ttt.match(res, {
            body: {
              stack: 2
            }
          })
          ttt.end()
        })
    })
    tt.end()
  })

  testCase(t, {
    code: 200
  , description: '#json'
  }, (tt) => {
    let server, request
    const router = new Router()
    tt.on('end', () => {
      server && server.close()
    })

    tt.test('setup http', (ttt) => {
      server = http.createServer((req, res) => {
        router.handle(req, res)
      }).listen(0, (err) => {
        ttt.error(err)
        request = supertest(`http://localhost:${server.address().port}`)
        ttt.end()
      })
    })

    testCase(tt, {
      code: 'GET'
    , description: '/chunks'
    }, (ttt) => {
      router.get('/chunks', (req, res, node, cb) => {
        res.$.status(200)
        res.$.json({'foo': 'bar'})
      })

      request
        .get('/chunks')
        .set({Accept: 'application/json'})
        .expect(200)
        .end((err, res) => {
          ttt.error(err)
          ttt.match(res, {
            body: {foo: 'bar'}
          })
          ttt.end()
        })
    })
    tt.end()
  })

  testCase(t, {
    code: 404
  , description: 'Route not found'
  }, (tt) => {
    let server = null
    let request = null
    const router = new Router()
    tt.on('end', () => {
      server && server.close()
    })

    tt.test('setup http', (ttt) => {
      server = http.createServer((req, res) => {
        router.handle(req, res)
      }).listen(0, (err) => {
        ttt.error(err)
        request = supertest(`http://localhost:${server.address().port}`)
        ttt.end()
      })
    })

    tt.test('/route/not/found', (ttt) => {
      request
        .get('/route/not/found')
        .expect(404)
        .end((err, res) => {
          ttt.error(err)
          ttt.end()
        })
    })
    tt.end()
  })

  testCase(t, {
    code: 501
  , description: 'error.statusCode is bubbled to status'
  }, (tt) => {
    let server = null
    let request = null
    const router = new Router()
    tt.on('end', () => {
      server && server.close()
    })

    tt.test('setup http', (ttt) => {
      server = http.createServer((req, res) => {
        router.handle(req, res)
      }).listen(0, (err) => {
        ttt.error(err)
        request = supertest(`http://localhost:${server.address().port}`)
        ttt.end()
      })
    })

    tt.test('/error', (ttt) => {
      router.route('/error', 'GET', (req, res, node, cb) => {
        const error = new Error('Broken')
        error.statusCode = 501
        throw error
      })

      request
        .get('/error')
        .expect(501)
        .end((err, res) => {
          ttt.error(err)
          ttt.end()
        })
    })
    tt.end()
  })

  testCase(t, {
    code: 500
  , description: 'default error case'
  }, (tt) => {
    let server = null
    let request = null
    const router = new Router()
    tt.on('end', () => {
      server && server.close()
    })

    tt.test('setup http', (ttt) => {
      server = http.createServer((req, res) => {
        router.handle(req, res)
      }).listen(0, (err) => {
        ttt.error(err)
        request = supertest(`http://localhost:${server.address().port}`)
        ttt.end()
      })
    })

    tt.test('/error', (ttt) => {
      router.route('/error', 'GET', (req, res, node, cb) => {
        const error = new Error('Broken')
        res.$.error(error)
      })

      request
        .get('/error')
        .expect(500)
        .end((err, res) => {
          ttt.error(err)
          ttt.match(res.headers, {
            'x-skyring-reason': /internal server error/i
          })
          ttt.end()
        })
    })
    tt.end()
  })

  testCase(t, {
    code: 503
  , description: 'error return as a number'
  }, (tt) => {
    let server = null
    let request = null
    const router = new Router()
    tt.on('end', () => {
      server && server.close()
    })

    tt.test('setup http', (ttt) => {
      server = http.createServer((req, res) => {
        router.handle(req, res)
      }).listen(0, (err) => {
        ttt.error(err)
        request = supertest(`http://localhost:${server.address().port}`)
        ttt.end()
      })
    })

    tt.test('/error', (ttt) => {
      router.route('/error', 'GET', (req, res, node, cb) => {
        res.$.error(503, http.STATUS_CODES['503'])
      })

      request
        .get('/error')
        .expect(503)
        .end((err, res) => {
          ttt.error(err)
          ttt.end()
        })
    })
    tt.end()
  })
}).catch(threw)
