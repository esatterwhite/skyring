'use strict';

const os = require('os')
    , path = require('path')
    , crypto = require('crypto')
    , tap = require('tap')
    , uuid   = require('uuid')
    , conf   = require('keef')
    , Timer  = require('../lib/timer')
    , test   = tap.test
    ;

function clearAll(timers, cb) {
  for(var t of timers.values()){
    clearTimeout(t.timer);
  }
  timers.clear();
  timers.nats.quit(()=>{
    timers.close(cb)
  })
}

test('timers', (t) => {
  t.test('create', (tt) => {
    let timers = null

    tt.test('set up timer cache', (ttt) => {
      timers = new Timer({
        storage: {
          backend: 'memdown'
        , path: path.join(os.tmpdir(), crypto.randomBytes(10).toString('hex'))
        }
      }, ttt.end)
    })

    tt.test('Execute the transport on a delay', (ttt) => {
      const id = uuid.v4()
      const foo = (uri, guid) => {
        ttt.equal( uri, 'helloworld')
        ttt.equal(guid, id)
        clearAll(timers, ttt.end)
      }

      timers.create(id, {
        timeout: 250
      , data: { foo: foo }
      , callback: {
          transport: 'callback'
        , method: 'foo'
        , uri: 'helloworld'
        }
      }, (err, id) => {
        ttt.error(err)
      })
    });

    tt.end()
  });

  t.test('update', (tt) => {
    let timers = null

    tt.test('set up timer cache', (ttt) => {
      timers = new Timer({
        storage: {
          backend: 'memdown'
        , path: path.join(os.tmpdir(), crypto.randomBytes(10).toString('hex'))
        }
      }, ttt.end)
    })

    tt.test('should replace a timer in place', (ttt) => {
      const id = uuid.v4();
      const one = () => {
        ttt.fail('function one called')
      }

      const two = () => {
        ttt.ok('function two called')
        clearAll(timers, ttt.end)
      }

      timers.create(id, {
        timeout: 100
      , data: { one: one }
      , callback: {
          transport: 'callback'
        , method: 'one'
        , uri: 'helloworld'
        }
      }, (err) => {
        ttt.error(err)
        timers.update(id, {
          timeout: 150
        , data: { two: two }
        , callback: {
            transport: 'callback'
          , method: 'two'
          , uri: 'helloworld'
          }
        }, (err) => {
          ttt.error(err)
        })
      });
    });
    tt.end()
  });

  t.test('remove', (tt) => {
    let timers = null
    tt.test('set up timer cache', (ttt) => {
      timers = new Timer({
        storage: {
          backend: 'memdown'
        , path: path.join(os.tmpdir(), crypto.randomBytes(10).toString('hex'))
        }
      }, ttt.end)
    })

    tt.test('should cancel an existing timer', (ttt) => {
      const id = uuid.v4()
      let called = false
      timers.create(id, {
        timeout: 2000
      , data: {
          "fake 2": (uri, guid) => {
            ttt.fail('timer callback called')
          }
        }
      , callback: {
          transport: 'callback'
        , method: 'fake 2'
        , uri: 'fake 2'
        }
      }, (err) => {
        setTimeout(() => {
          timers.remove(id, () => {
            ttt.ok(!called)
            clearAll(timers, ttt.end)
          })
        }, 50)
      })
    });
    tt.end()
  });
  t.end();
});

