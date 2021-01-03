'use strict'
/**
 * Manage Timers on a node
 * @module skyring/lib/timer
 * @author Eric Satterwhite
 * @since 3.0.0
 * @requires os
 * @requires crypto
 * @requires path
 * @requires levelup
 * @requires encoding-down
 * @requires skyring/lib/transports
 * @requires skyring/lib/nats
 * @requires skyring/lib/json
 */
const os = require('os')
const crypto = require('crypto')
const path = require('path')
const levelup = require('levelup')
const encode = require('encoding-down')
const Transports = require('./transports')
const nats = require('./nats')
const pino = require('./log')
const conf = require('../conf')

const log = pino.child({name: pino.namespace(__dirname, __filename)})
const rebalance = pino.child({name: pino.namespace(__dirname, 'rebalance')})
const store = pino.child({name: pino.namespace(__dirname, 'storage')})

const storage = Symbol('storage')
const shutdown = Symbol.for('kShutdown')
const kNode = Symbol('nodeid')
const kRemove = Symbol('remove')
const REBALANCE_SUB = 'skyring.rebalance'
const EVENT_STATUS = {
  CREATED: 'create'
, UPDATED: 'replace'
, EXEC: 'execute'
, CANCELLED: 'cancel'
, FAIL: 'fail'
, SUCCESS: 'success'
, SHUTDOWN: 'shutdown'
, READY: 'ready'
, RECOVERY: 'recover'
, REBALANCE: 'rebalance'
, PURGE: 'purge'
, EVICT: 'evict'
}

function noop() {}

function generateId(id) {
  if (!id) return crypto.randomBytes(10).toString('hex')
  return crypto.createHash('sha1').update(id).digest('hex')
}
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
 * @param {String[]} [options.storage.backend=memdown] a requireable module name, or absolute path to a leveldb compatible backend. `memdown` and `leveldown` are built in
 * `leveldown` and `memdown` are installed by default
 * @param {String} options.storage.path A directory path to a leveldb instance. One will be created if it doesn't already exist.
 * If the backend is memdown, this is optional and randomly generated per timer instance
 * @param {Function} [onReady=()=>{}] A callback function to call after initial recovery has completed
 * @param {String[]|Function[]} [options.transports] an array of custom transport functions, or requireable paths that resolve to functions. All transport function must be named functions
 * If not specified, configuration values will be used
 **/
class Timer extends Map {
  constructor(options = {}, cb = noop) {
    super()
    this.options = {
      nats: null
    , storage: null
    , transports: []
    , ...options
    }
    this._sid = null
    this._bail = false
    const store_opts = conf.get('storage')
    const opts = Object.assign(store_opts, this.options.storage)
    store.debug('%j', opts)
    if (!opts.path) {
      if (opts.backend === 'memdown') {
        this[kNode] = generateId()
        opts.path = path.join(
          os.tmpdir()
        , `skyring-${this[kNode]}`
        )
      } else {
        const err = new Error('storage.path must be set with non memdown backends')
        err.code = 'ENOSTORAGE'
        throw err
      }
    }
    const backend = opts.backend === 'memdown'
      ? new(require(opts.backend))()
      : encode(require(opts.backend)(opts.path), {valueEncoding: 'json'})

    log.debug('storage path', opts)
    this[kNode] = generateId(store_opts.path)
    this[storage] = levelup(backend, opts, (err) => {
      if (err) return cb(err)
      this.nats = nats.createClient(this.options.nats)
      this.transports = new Transports(this.options.transports)
      store.debug('storage backend ready', store_opts)
      log.debug('node id', this[kNode])
      this.recover(() => {
        this.nats.publish('skyring:node', {
          node: this[kNode]
        , type: EVENT_STATUS.READY
        }, cb)
      })
    })
  }

  get id() {
    return this[kNode]
  }

  /**
   * Sets a new time instance. If The timer has lapsed, it will be executed immediately
   * @method module:skyring/lib/timer#create
   * @param {String} id A unique Id of the time
   * @param {Object} body Configuration options for the timer instance
   * @param {Number} body.timeout the time in milliseconds from now the timer should execute. This must be in the range: 0 < timeout < 2^31 - 1.
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
    const payload = body
    const transport = this.transports.get(payload.callback.transport)
    if (!transport) {
      const err = new Error(`Unknown transport ${payload.callback.transport}`)
      err.code = 'ENOTRANSPORT'
      setImmediate(cb, err)
      return null
    }
    if (this.has(id)) {
      const err = new Error(`Timer with id ${id} already exists`)
      err.code = 'EKEYEXISTS'
      setImmediate(cb, err)
      return null
    }
    const now = Date.now()
    const created = payload.created || now
    const elapsed = now - created
    if (now > created + payload.timeout) {
      log.debug('executing stale timer: %s', id)
      setImmediate(
        transport.exec.bind(transport)
      , payload.callback.method
      , payload.callback.uri
      , payload.data
      , id
      , this
      )

      this.nats.publish('skyring:events', {
        type: EVENT_STATUS.EXEC
      , timer: id
      , node: this[kNode]
      , executed: Date.now()
      , created: created
      , payload: payload
      }, noop)

      cb(null, id)
      return null
    }

    const data = {
      created: created
    , id: id
    , payload: payload
    , timer: null
    }

    this[storage].put(id, data, (err) => {
      /* istanbul ignore if */
      if (err) {
        log.error(err)
        cb(err, null)
        return null
      }

      log.debug('setting timer %s', id)
      this.nats.publish('skyring:events', {
        type: EVENT_STATUS.CREATED
      , timer: id
      , node: this[kNode]
      , created: data.created
      , payload: payload
      }, noop)

      data.timer = setTimeout(
        transport.exec.bind(transport)
      , payload.timeout - elapsed
      , payload.callback.method
      , payload.callback.uri
      , payload.data
      , id
      , this
      ).unref()
      this.set(id, data)
      cb(null, id)
      return null
    })
  }

  /**
   * Clears the respective timer from storage and publishes a success event via nats
   * @method module:skyring/lib/timer#success
   * @param {String} id the is of the time to acknowledge as delivered successfully
   * @param {Nodeback} [callback] Callback to execute when the acknowledge is complete
   * @example timers.success('2e2f6dad-9678-4caf-bc41-8e62ca07d551')
   **/
  success(id, cb = noop) {
    this[kRemove](id, (err) => {
      if (err) {
        log.error(err)
        cb(err)
        return
      }
      this.nats.publish('skyring:events', {
        type: EVENT_STATUS.SUCCESS
      , timer: id
      , node: this[kNode]
      }, cb)
    })
  }

  /**
   * Clears the respective timer from storage and publishes a failure event via nats
   * @method module:skyring/lib/timer#failure
   * @param {String} id the is of the time to acknowledge as delivered successfully
   * @param {Error} error The error object to send with event objects
   * @param {Nodeback} [callback] Callback to execute when the acknowledge is complete
   * @example
const error = Error('Remote server unavailable')
error.code = 'ENOREMOTE'
timers.failure('2e2f6dad-9678-4caf-bc41-8e62ca07d551', error)
   **/
  failure(id, error, cb = noop) {
    log.error(error, `timer failure ${id}`)
    this[kRemove](id, (err) => {
      if (err) {
        log.error(err)
        return cb(err)
      }
      this.nats.publish('skyring:events', {
        type: EVENT_STATUS.FAIL
      , timer: id
      , node: this[kNode]
      , message: error.message
      , stack: error.stack
      , error: error.code || error.name
      }, cb)
    })
  }

  /**
   * Clears the respective timer from storage and publishes a cancelled event via nats
   * @method module:skyring/lib/timer#cancelled
   * @param {String} id the is of the time to acknowledge as delivered successfully
   * @param {Nodeback} [callback] Callback to execute when the acknowledge is complete
   * @example timers.cancel('2e2f6dad-9678-4caf-bc41-8e62ca07d551')
   **/
  cancel(id, cb = noop) {
    this[kRemove](id, (err) => {
      if (err) {
        log.error(err)
        return cb(err)
      }
      this.nats.publish('skyring:events', {
        type: EVENT_STATUS.CANCELLED
      , timer: id
      , node: this[kNode]
      }, cb)
    })
  }

  [kRemove](id, cb = noop) {
    this[storage].del(id, (err) => {
      if (err) {
        store.error(err, `unable to purge timer ${id}`)
        return cb(err)
      }

      const rec = this.get(id)

      if (!rec) {
        const err = new Error('Not Found')
        err.code = 'ENOENT'
        setImmediate(cb, err)
        return null
      }

      clearTimeout(rec.timer)
      this.delete(id)
      setImmediate(cb)
      store.trace('timer purged from storage %s', id)
      return null
    })
  }

  rebalance(opts, node, cb = noop) {
    const size = this.size
    const batch = this[storage].batch()

    if (!size) return

    rebalance.info('node %s begin rebalance; timers: %d', this[kNode], size)
    this.nats.publish('skyring:node', {
      node: this[kNode]
    , type: EVENT_STATUS.REBALANCE
    }, noop)

    const records = this.values()
    const run = (obj) => {
      if (node.owns(obj.id)) return

      clearTimeout(obj.timer)
      this.delete(obj.id)
      batch.del(obj.id)

      const data = {
        ...obj.payload
      , id: obj.id
      , created: obj.created
      }

      rebalance.debug('node %s no longer the owner of %s', this[kNode], obj.id)

      this.nats.publish('skyring:events', {
        node: this[kNode]
      , type: EVENT_STATUS.EVICT
      , timer: obj.id
      }, noop)

      cb(data)
    }

    for (var record of records) {
      run(record)
    }

    batch.write(() => {
      rebalance.info('node %s rebalance batch delete complete', this[kNode])
    })
  }

  recover(cb = noop) {
    this.nats.publish('skyring:node', {
      node: this[kNode]
    , type: EVENT_STATUS.RECOVERY
    }, noop)

    const fn = (data) => {
      store.trace('recover timer %s', data.key)
      const out = {
        ...data.value.payload
      , id: data.value.id
      , created: data.value.created
      }
      // pass noop to `create` so the single callback isn't called multiple times
      this.create(data.key, out, noop)
    }

    const stream = this[storage].createReadStream()

    stream
      .on('data', fn)
      .once('close', function() {
        store.trace('recover stream close')
        stream.removeListener('data', fn)
        // call the callback when the stream is processed + complete
        cb()
      })
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
   * @example timers.update('0dc5a555-d0f6-49a0-b336-5befb0437288', {
  timeout: 4000
, data: "this is a payload"
, callback: {
    transport: 'http'
  , method: 'put'
  , uri: 'http://api.domain.com/callback'
  }
})
   **/
  update(id, body, cb) {
    this[kRemove](id, (err) => {
      if (err) return cb(err)
      log.debug('updating timer', id)
      this.create(id, body, cb)
    })
  }

  close(cb) {
    this[storage].close(cb)
  }

  disconnect(cb = noop) {
    this[storage].close(noop)
    this.transports[shutdown](() => {
      this.nats.publish('skyring:node', {
        node: this[kNode]
      , type: EVENT_STATUS.SHUTDOWN
      }, noop)

      this.nats.drainSubscription(this._sid, (err) => {
        if (err) return cb(err)
        this.nats.quit(cb)
      })
    })
  }

  /**
   * Triggers timers to be purged from this node canceling all locally pending timers,
   * and distributing them in the ring. It is assumed this node is no longer a ring member
   * @method module:skyring/lib/timer#shutdown
   * @param {Nodeback} callback Node style callback to execute when the function is complete
   **/
  shutdown(cb) {
    const size = this.size
    if (!size) {
      this[storage].close()
      return this.transports[shutdown](() => {
        this.nats.publish('skyring:node', {
          node: this[kNode]
        , type: EVENT_STATUS.SHUTDOWN
        }, noop)

        this.nats.drainSubscription(this._sid, (err) => {
          if (err) return cb(err)
          this.nats.quit(cb)
        })
      })
    }

    let sent = 0
    let acks = 0

    const batch = this[storage].batch()

    this.nats.unsubscribe(this._sid)
    this._sid = null

    const run = (obj) => {
      clearTimeout(obj.timer)
      batch.del(obj.id)
      const data = {
        ...obj.payload
      , id: obj.id
      , created: obj.created
      , count: ++sent
      }

      this.nats.request(REBALANCE_SUB, data, (reply) => {
        if (++acks === size) {
          return batch.write(() => {
            store.trace('batch delete finished')
            this.disconnect(cb)
          })
        }
        rebalance.trace('%s of %s processed', acks, data.count, data.id)
      })
    }

    this.nats.publish('skyring:node', {
      node: this[kNode]
    , type: EVENT_STATUS.PURGE
    }, noop)

    for (const record of this.values()) {
      run(record)
    }

    this.clear()
  }

  /**
   * Starts an internal nats queue
   * @method module:skyring/lib/timer#watch
   * @param {String} key The name of the nats queue to create
   * @param {Nodeback} callback Node style callback to execute when the function has finished execution
   **/
  watch(key, cb) {
    if (this._bail) return
    const opts = {queue: key}
    this._sid = this.nats.subscribe(REBALANCE_SUB, opts, (data, reply) => {
      if (reply) this.nats.publish(reply, {node: this[kNode], timer: data.id})
      if (this._bail) return
      cb(null, data)
    })
    return this._sid
  }
}

module.exports = Timer
