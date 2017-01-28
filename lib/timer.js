/*jshint laxcomma: true, smarttabs: true, node:true, esnext:true, unused: true*/
'use strict';
/**
 * Manage Timers on a node
 * @module skyring/lib/timer
 * @author Eric Satterwhite
 * @since 3.0.0
 * @requires debug
 * @requires skyring/lib/transports
 * @requires skyring/lib/nats
 * @requires skyring/lib/json
 */
const transports = require('./transports')
    , nats       = require('./nats')
    , json       = require('./json')
    , debug      = require('debug')('skyring:timer')
    , rebalance  = require('debug')('skyring:rebalance')
    , noop       = function(){}
    ;

/**
 * Node style callback
 * @typedef {Function} Nodeback
 * @property {?Error} [err] An error instance. If not null, the results should not be trusted 
 * @property {Object} result The results of the function execution
 **/

/**
 * @constructor
 * @alias module:skyring/lib/timer
 * @param {Object} [options]
 * @param {Object} [options.nats] Nats connection information
 * @param {String[]} [options.nats.servers] A list of nats `host:port` to connect to
 * If not specified, configuration values will be used
 **/
class Timer extends Map {
  constructor(options = {}) {
    super();
    this.options = Object.assign({}, {
      nats: null
    }, options);
    this._sid = null;
    this._bail = false;
    this.nats = nats.createClient( this.options.nats );
  }

  /**
   * Sets a new time instance. If The timer has lapsed, it will be executed immediately
   * @method module:skyring/lib/timer#create
   * @param {String} id A unique Id of the time
   * @param {Object} body Configuration options for the timer instance
   * @param {Number} body.timeout Duration in milisecods to delay execution of the timer
   * @param {String} body.data The data to be assicated with the timer, when it is executed
   * @param {Number} [body.created=Date.now()] timestamp when the timer is created. if not set, will default to now
   * @param {Object} callback Options for the outbound transport for the timer when it executes
   * @param {String} callback.transport The transport type ( http, etc )
   * @param {String} transport.method The method the transport should use when executing the timer
   * @param {String} transport.uri The target uri for the transport when the timer executes 
   * @param {Nodeback} callback
   * @example
const crypto = require('crypto')
id = crypto.createHash('sha1')
           .update(crypto.randomBytes(10))
           .digest('hex')

const options = {
  timeout: 4000
, data: "this is a payload"
, callback: {
    transport: 'http'
  , method: 'put
  , uri: 'http://api.domain.com/callback'
  }
}

timers.create(id, options, (err) => {
  if (err) throw err
})
   **/
  create(id, body, cb) {
    const payload = body;
    const transport = transports[payload.callback.transport];
    if ( this.has( id ) ) {
      const err = new Error( 'Key exists' );
      err.code = 'EKEYEXISTS';
      return setImmediate(cb, err);
    }
    const now = Date.now();
    const created = payload.created || now;
    const elapsed = now - created;
    if( now > created + payload.timeout ){
      debug('executing stale timer');
      setImmediate(
          transport
        , payload.callback.method
        , payload.callback.uri
        , payload.data
        , id
        , this
      );
      return cb(null, id)
    }

    debug('setting timer', id);
    this.set( id, {
      payload: payload
    , created: Date.now()
    , id: id
    , timer: setTimeout(
              transport
            , payload.timeout - elapsed
            , payload.callback.method
            , payload.callback.uri
            , payload.data
            , id
            , this
            ).unref()
    });
    setImmediate(cb, null, id);
  }

  /**
   * Cancels a specific timer
   * @method module:skyring/lib/timer#delete
   * @param {String} id The id of the timer to cancel
   * @param {Nodeback} callback Node style callback to execute
   **/
  remove(id, cb) {
    const t = this.get(id);
    if( !t ) {
      const err = new Error('Not Found');
      err.code = 'ENOENT';
      return cb && setImmediate(cb, err);
    }
    clearTimeout(t.timer);
    this.delete(id);
    debug('timer cleared', id);
    cb && setImmediate(cb, null);
  }

  rebalance(opts, node, cb) {
    const callback = cb || noop
        , size = this.size
        ;

    if( !size ) return;
    const records = this.values();
    const run = ( obj ) => {
      if ( node.owns( obj.id ) ) return;
      clearTimeout( obj.timer );
      this.delete( obj.id );
      const data = Object.assign({}, obj.payload, {
        id: obj.id
      , created: obj.created
      });
      rebalance( 'no longer the owner of %s', obj.id );
      callback( data );
    };

    for( var record of records ) {
      run( record );
    }
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
  update(id, body, cb){
    this.remove(id, ( err ) => {
      if ( err ) return cb( err );
      debug( 'updating timer', id );
      this.create( id, body, cb );
    });
  }

  /**
   * Triggers timers to be rebalanced with in the ring before sutdown, and cancels all locally pending timers
   * @method module:skyring/lib/timer#shutdown
   * @param {Nodeback} callback Node style callback to execute when the function is complete
   **/
  shutdown(cb) {
    const size = this.size;
    const client = this.nats;
    let sent = 0;
    let acks = 0;

    if( !size ) return nats.quit(cb);

    client.unsubscribe( this._sid );
    this._sid = null;

    const run = ( obj ) => {
      clearTimeout( obj.timer );
      const data = Object.assign({}, obj.payload, {
        id: obj.id
      , created: obj.created
      , count: ++sent
      });

      this.nats.publish('skyring', JSON.stringify( data ), () => {
        if( ++acks === size ) return setImmediate( nats.quit, cb );
        rebalance( '%s of %s processed', data.count, acks);
      });
    };

    for( var record of this.values() ) {
      run( record );
    }
    this.clear();
  }

  /**
   * Starts an internal nats queue
   * @method module:skyring/lib/timer#watch
   * @param {String} key The key name in redis to use as a timer queue
   * @param {Nodeback} callback Node style callback to execute when the function has finished execution
   **/
  watch( key, cb ){
    if( this._bail ) return;
    const opts = { queue: key };
    this._sid = this.nats.subscribe('skyring', opts, ( data ) => {
      if( this._bail ) return;
      const value = json.parse( data );
      rebalance( 'received %s', value.value.count );
      cb( value.error, value.value );
    });
    return this._sid;
  }
}

module.exports = Timer;
