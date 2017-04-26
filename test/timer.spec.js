const assert = require('assert')
    , crypto = require('crypto')
    , uuid   = require('uuid')
    , conf   = require('keef')
    , Timer  = require('../lib/timer')
    , Plan   = require('./plan')

describe('timers', () => {
  let timers;
  beforeEach(() => {
    var bits = crypto.randomBytes(10).toString('hex')
    conf.set('storage:path', bits)
    timers = new Timer();
  })

  afterEach(() => {
    for(var t of timers.values()){
      clearTimeout(t.timer);
    }
    timers.clear();
  });

  describe('create', () => {
    it('Execute the transport on a delay', (done) => {
      const id = uuid.v4()
      timers.create(
        id
      , {
          timeout: 250
        , data: {
            foo: (uri, guid) => {
              assert.equal( uri, 'helloworld')
              assert.equal(guid, id)
              done()
            }
          }
        , callback: {
            transport: 'callback'
          , method: 'foo'
          , uri: 'helloworld'
          }
        }
      , () => {})
    });
  });

  describe('update', () => {
    it('should replace a timer in place', (done) => {
      const plan = new Plan(1, done)
      function one(){
        throw new Error();
      }

      function two(){
        plan.ok(1)
      }
      const id = uuid.v4();

      timers.create(
        id
      , {
          timeout: 100
        , data: { one }
        , callback: {
            transport: 'callback'
          , method: 'one'
          , uri: 'helloworld'
          }
        }
      , () => {

        timers.update(
          id
        , {
            timeout: 150
          , data: { two }
          , callback: {
              transport: 'callback'
            , method: 'two'
            , uri: 'helloworld'
            }
          }
        , () => {})

        }
      )
    })
  });

  describe('remove', () => {
    it('should cancel an existing timer', (done) => {
      const id = uuid.v4()
      let called = false
      const plan = new Plan(1, done)
      debugger;
      timers.create(
        id
      , {
          timeout: 2000
        , data: {
            "fake 2": (uri, guid) => {
              assert.equal(uri, 'helloworld')
              assert.equal(guid, id)
            }
          }
        , callback: {
            transport: 'callback'
          , method: 'fake 2'
          , uri: 'fake 2'
          }
        }
      , () => {
          setTimeout(() => {
            timers.remove(id, () => {
              plan.ok(!called)
            })
          }, 50)
        })
    });
  });
});
