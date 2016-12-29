const assert = require('assert')
    , uuid   = require('uuid')
    , Timer  = require('../lib/timer');

describe('timers', () => {
  let timers;
  beforeEach(() => {
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
      function one(){
        throw new Error();
      }

      function two(){
        assert.ok(1)
        done()
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
      timers.create(
        id
      , {
          timeout: 1000
        , data: {
            foo: (uri, guid) => {
              assert.equal( uri, 'helloworld')
              assert.equal(guid, id)
            }
          }
        , callback: {
            transport: 'callback'
          , method: 'foo'
          , uri: 'helloworld'
          }
        }
      , () => {
          setTimeout(() => {
            timers.remove(id, () => {
              assert.equal(called, false)
              done()
            })
          }, 50)
        })
    });
  });
});
