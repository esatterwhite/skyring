'use strict'

const transports = require('./transports')
    , redis      = require('./redis')
    , json       = require('./json')
    , debug      = require('debug')('skyring:timer')
    , cache      = new Map()
    ;

let BAIL = false

exports.create = function create(id, body, cb) {
  const payload = body;
	const transport = transports[payload.callback.transport];

  if (cache.has(id)) {
    const err = new Error('Key exists');
    err.code = 'EKEYEXISTS';
    return setImmediate(cb, err)
  }
  const now = Date.now();
  const created = payload.created || now;

  if( now > created + payload.timeout ){
    debug('executing stale timer')
    return setImmediate(
        transport
      , payload.callback.method
      , payload.callback.uri
      , payload.data
      , id
    );
    cb(null)
  }
   
  
  debug('setting timer', id);
  cache.set( id, {
    payload: payload
  , created: Date.now()
  , id: id
  , timer: setTimeout(
            transport
          , payload.timeout
          , payload.callback.method
          , payload.callback.uri
          , payload.data
          , id
          ).unref()
  });
  setImmediate(cb, null);
}


exports.delete = function(id, cb) {
  const t = cache.get(id);
  if( !t ) {
    const err = new Error('Not Found');
    err.code = 'ENOENT';
    return setImmediate(cb, err);
  }
  clearTimeout(t.timer);
  cache.delete(id);
  debug('timer cleared', id)
  cb && setImmediate(cb, null);
}

exports.update = function update(id, body, cb){
  exports.delete(id, (err) => {
    if (err) return cb(err)
    debug('updating timer', id);
    exports.create(id, body, cb);
  })
}

exports.shutdown = function shutdown(cb) {
  BAIL = true;
  redis.disconnect(() => {
    const client = redis.client;

    for(var record of cache.values()) {
      clearTimeout(record.timer);
      const data = Object.assign({}, record.payload, {
        id: record.id
      , created: record.created
      });
      client.lpush('skyring', JSON.stringify( data ));
    }
    cache.clear();
    cb && setImmediate(cb);
  })
}

exports.watch = function( key, cb ){
  (function pull(){
    if(BAIL) return cb();

    redis.client.blpop(key, 0, (err, replies) => {
      if(err) return setImmediate(cb, err);
      const value = json.parse(replies[1])
      setImmediate(pull);
      cb(value.error, value.value);
    });
  }())
}

