/*jshint laxcomma: true, smarttabs: true, node:true, esnext:true*/
'use strict';
/**
 * Manage Timers on a node
 * @module skyring/lib/timer
 * @author Eric Satterwhite
 * @since 1.0.0
 * @requires debug
 * @requires skyring/lib/transports
 * @requires skyring/lib/redis
 * @requires skyring/lib/json
 */
const transports = require('./transports')
    , redis      = require('./redis')
    , json       = require('./json')
    , debug      = require('debug')('skyring:timer')
    , cache      = new Map()
    ;
setInterval(() => {
    debug(`${cache.size} timers pending`)
}, 2000)
let BAIL = false

/**
 * Node style callback
 * @typedef {Function} Nodeback
 * @property {?Error} [err] An error instance. If not null, the results should not be trusted 
 * @property {Object} result The results of the function execution
 **/

/**
 * Sets a new time instance. If The timer has lapsed, it will be executed immediately
 * @method module:skyring/lib/timer#create
 * @param {String} id A unique Id of the time
 * @param {Object} body Configuration options for the timer instance
 * @param {Number} body.timeout Duration in milisecods to delay execution of the timer
 * @param {String} body.data The data to be assicated with the timer, when it is executed
 * @param {Object} callback Options for the outbound transport for the timer when it executes
 * @param {String} callback.transport The transport type ( http, etc )
 * @param {String} transport.method The method the transport should use when executing the timer
 * @param {String} transport.uri The target uri for the transport when the timer executes 
 * @param {Nodeback} callback
 **/
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


/**
 * Cancels a specific timer
 * @method module:skyring/lib/timer#delete
 * @param {String} id The id of the timer to cancel
 * @param {Nodeback} callback Node style callback to execute
 **/
exports.delete = function(id, cb) {
  const t = cache.get(id);
  if( !t ) {
    const err = new Error('Not Found');
    err.code = 'ENOENT';
    return cb && setImmediate(cb, err);
  }
  clearTimeout(t.timer);
  cache.delete(id);
  debug('timer cleared', id)
  cb && setImmediate(cb, null);
}

/**
 * Updates a timer inplace
 * @method module:skyring/lib/timer#update
 * @param {String} id A unique Id of the time
 * @param {Object} body Configuration options for the timer instance
 * @param {Number} body.timeout Duration in milisecods to delay execution of the timer
 * @param {String} body.data The data to be assicated with the timer, when it is executed
 * @param {Object} callback Options for the outbound transport for the timer when it executes
 * @param {String} callback.transport The transport type ( http, etc )
 * @param {String} transport.method The method the transport should use when executing the timer
 * @param {String} transport.uri The target uri for the transport when the timer executes 
 * @param {Nodeback} callback
 **/
exports.update = function update(id, body, cb){
  exports.delete(id, (err) => {
    if (err) return cb(err);
    debug('updating timer', id);
    exports.create(id, body, cb);
  })
}

/**
 * Triggers timers to be rebalanced with in the ring before sutdown, and cancels all locally pending timers
 * @method module:skyring/lib/timer#shutdown
 * @param {Nodeback} callback Node style callback to execute when the function is complete
 **/
exports.shutdown = function shutdown(cb) {
  BAIL = true;
  redis.disconnect(() => {
    const exit = false;
    const client = redis.client;
    const size = cache.size;
    let count = 0;

    const run = (obj) => {
      clearTimeout(record.timer);

      debug('pushing', record.id)
      const data = Object.assign({}, record.payload, {
        id: record.id
      , created: record.created
      });

      client.lpush('skyring', JSON.stringify( data ));
      if (++count === size) return client.quit(cb)
    }

    for(var record of cache.values()) {
      run(record);
    }
    cache.clear();
  })
}

/**
 * Starts an internal queue on a redis key to listen for incoming timers from a node rebalance
 * @method module:skyring/lib/timer#watch
 * @param {String} key The key name in redis to use as a timer queue
 * @param {Nodeback} callback Node style callback to execute when the function has finished execution
 **/
exports.watch = function( key, cb ){
  (function pull(){
    if(BAIL) return
    redis.client.blpop(key, 5, (err, replies) => {
      if(BAIL) return
      if (!err && !replies) return setImmediate(pull)
      if(err) return setImmediate(cb, err);
      const value = json.parse(replies[1])
      setImmediate(pull);
      cb(value.error, value.value);
    });
  }())
}

