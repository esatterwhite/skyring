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
const os         = require('os')
    , crypto     = require('crypto')
    , path       = require('path')
    , levelup    = require('levelup')
    , Transports = require('./transports')
    , nats       = require('./nats')
    , json       = require('./json')
    , conf       = require('../conf')
    , debug      = require('debug')('skyring:timer')
    , rebalance  = require('debug')('skyring:rebalance')
    , store      = require('debug')('skyring:store')
    , storage    = Symbol('storage')
    , shutdown   = Symbol.for('kShutdown')
    , noop       = () => {}
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
 * @param {Object} [options.storage] Storage config options for level db
 * @param {String[]} [options.storage.backend=memdown] a requireable module name, or absolute path to a leveldb compatible backend
 * `leveldown` and `memdown` are installed by default
 * @param {String} options.storage.path A directory path to a leveldb instance. One will be created if it doesn't already exist.
 * If the backend is memdown, this is optional and randomly generated per timer instance
 * @param {Function} [onReady=()=>{}] A callback function to call after initial recovery has completed
 * @param {String[]|Function[]} [options.transports] an array of custom transport functions, or requireable paths that resolve to functions. All transport function must be named functions
 * If not specified, configuration values will be used
 **/
class Timer extends Map {
  constructor(options = {}, cb = () => {}) {
    super();
    this.options = Object.assign({}, {
      nats: null
    , storage: null
    , transports: []
    }, options);
    this._sid = null;
    this._bail = false;
    const store_opts = conf.get('storage');
    const opts = Object.assign(store_opts, this.options.storage);
    store(opts);
    if (!opts.path) {
      if (opts.backend === 'memdown') {
        opts.path = path.join(
          os.tmpdir()
        , `skyring-${crypto.randomBytes(10).toString('hex')}`
        );
      } else {
        const err = new Error('storage.path must be set with non memdown backends');
        err.code = 'ENOSTORAGE';
        throw err;
      }
    }
    debug('storage path', opts);
    this.nats = nats.createClient( this.options.nats );
    this.transports = new Transports(this.options.transports);
    this[storage] = levelup(opts.path, {
      valueEncoding: 'json'
    , db: require( opts.backend )
    , cacheSize: opts.cache
    , writeBufferSize: opts.writeBufferSize
    });

    this[storage].once('ready', () => {
      debug('storage backend ready', conf.get('storage'));
      this.recover(cb);
    });
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
  , method: 'put'
  , uri: 'http://api.domain.com/callback'
  }
}

timers.create(id, options, (err) => {
  if (err) throw err
})
   **/
  create(id, body, cb) {
    const payload = body;
    const transport = this.transports[payload.callback.transport];
    if (!transport) {
      const err = new Error(`Unknown transport ${payload.callback.transport}`)
      err.code = 'ENOTRANSPORT'
      return setImmediate(cb, err)
    }
    if ( this.has( id ) ) {
      const err = new Error(`Timer with id ${id} already exists` );
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

      return cb(null, id);
    }

    const data = {
      created: Date.now()
    , id: id
    , payload: payload
    , timer: null
    };

    this[storage].put(id, data, (err) => {
      debug('setting timer', id);
      //TODO(esatterwhite):
      // what should happen if leveldb fails.
      if (err) console.error(err);
      data.timer = setTimeout(
        transport
      , payload.timeout - elapsed
      , payload.callback.method
      , payload.callback.uri
      , payload.data
      , id
      , this
      ).unref();
      this.set( id, data );
      cb(null, id);
    });
  }

  /**
   * Cancels a specific timer
   * @method module:skyring/lib/timer#delete
   * @param {String} id The id of the timer to cancel
   * @param {Nodeback} callback Node style callback to execute
   **/
  remove(id, cb) {
    this[storage].del(id, (err) => {
      if (err) return console.error('unable to purge %s', id, err);
      store('%s purged from storage', id, this.options.storage);
    });
    const t = this.get(id);
    if( !t ) {
      const err = new Error('Not Found');
      err.code = 'ENOENT';
      return cb && setImmediate(cb, err);
    }
    clearTimeout(t.timer);
    this.delete(id);
    debug('timer cleared', id);
    return cb && setImmediate(cb);
  }

  rebalance(opts, node, cb) {
    const callback = cb || noop
        , size = this.size
        , batch = this[storage].batch()
        ;

    if( !size ) return;
    const records = this.values();
    const run = ( obj ) => {
      if ( node.owns( obj.id ) ) return;
      clearTimeout( obj.timer );
      this.delete( obj.id );
      batch.del(obj.id);
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
    batch.write(() => {
      store('rebalance batch delete complete');
    });
  }

  recover(cb) {
    const fn = (data) => {
      store('recover', data.key);
      const out = Object.assign({}, data.value.payload, {
        id: data.value.id
      , created: data.value.created
      });
      this.create(data.key, out, debug);
    };

    const stream = this[storage].createReadStream();

    stream
    .on('data', fn)
    .once('close', function () {
      debug('recover stream close');
      stream.removeListener('data', fn);
      cb && cb();
    });
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

    if( !size ) {
      this[storage].close();
      return this.transports[shutdown](() => {
        this.nats.quit(cb);
      });
    }

    let sent = 0;
    let acks = 0;

    const batch = this[storage].batch();

    client.unsubscribe( this._sid );
    this._sid = null;

    const run = ( obj ) => {
      clearTimeout( obj.timer );
      batch.del(obj.id);
      const data = Object.assign({}, obj.payload, {
        id: obj.id
      , created: obj.created
      , count: ++sent
      });

      this.nats.publish('skyring', JSON.stringify( data ), () => {
        if( ++acks === size ) {
          return batch.write(() => {
            this.transports[shutdown](() => {
              store('batch delete finished');
              setImmediate(this.nats.quit, cb);
            });
          });
        }
        rebalance( '%s of %s processed', data.count, acks, data.id);
      });
    };

    for( var record of this.values() ) {
      run( record );
    }
    this.clear();
  }

  close(cb){
    this[storage].close(cb);
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
      cb( value.error, value.value );
    });
    return this._sid;
  }
}

module.exports = Timer;
