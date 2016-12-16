'use strict'

const cache      = require('./cache')
    , transports = require('./transports')
    , debug      = require('debug')('kronos:timer')
    ;

exports.create = function create(id, body, cb) {
  const payload = body;
	const transport = transports[payload.callback.transport];

  if (cache.has(id)) {
    const err = new Error('Key exists');
    err.code = 'EKEYEXISTS';
    return setImmediate(cb, err)
  }

  debug('setting timer', id);
  
  cache.set(
    id
  , setTimeout(
      transport
    , payload.timeout
    , payload.callback.method
    , payload.callback.uri
    , payload.data
    , id
    )
  );
  setImmediate(cb, null);
}


exports.delete = function(id, cb) {
  const t = cache.get(id);
  if( !t ) {
    const err = new Error('Not Found');
    err.code = 'ENOENT';
    return setImmediate(cb, err);
  }
  clearTimeout(t);
  cache.delete(id);
  debug('timer cleared', id)
  setImmediate(cb, null);
}

exports.update = function update(id, body, cb){
  exports.delete(id, (err) => {
    if (err) return cb(err)
    debug('updating timer', id);
    exports.create(id, body, cb);
  })
}

exports.rebalance = function rebalance(cb) {
  for(var timer of cache.values() {
    clearTimeout(timer)
  }
  cache.clear()
}
