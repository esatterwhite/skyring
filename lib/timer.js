'use strict'

const transports = require('./transports')
    , redis      = require('./redis')
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
      , cb;
    );
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
          , cb
          ).unref()
  });
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
  for(var record of cache.values()) {
    clearTimeout(record.timer)
  }
  cache.clear()
  cb && setImmediate(cb)
}

exports.watch = function( key, cb ){
  (function pull(){
    console.log("pull")
    if(BAIL) return cb();
    redis.client.blpop(key, 0, (err, replies) => {
      debugger;
      if(err) return setImmediate(cb, err);

      const data = replies[1]
      setImmediate(pull);
      cb(null, data);
    });
  }())
}
