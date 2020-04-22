'use strict'

const Zmq = require('zeromq')
const debug = require('debug')('skyring:transports:zmq')
const monitor = require('debug')('skyring:transports:zmq:monitor')
const connections = new Map()
const METHODS = new Set(['push', 'pub'])
const ZMQ_DEBUG = !!process.env.ZMQ_DEBUG
const ZMQ_BIND = !!process.env.ZMQ_BIND
const kType = Symbol.for('SkyringTransport')
const TRANSPORT = 'zmqtransport'
const MONITOR_EVENTS = new Set([
  'connect'
, 'connect_delay'
, 'connect_retry'
, 'listen'
, 'bind_error'
, 'accept'
, 'accept_error'
, 'close'
, 'close_error'
, 'disconnect'
])

const noop = () => {}

function has(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop)
}
module.exports = class ZMQ {
  constructor(opts = {}) {
    this.name = TRANSPORT
    this.connections = new Map()
    this.bind = has(opts, 'bind')
      ? !!opts.bind
      : ZMQ_BIND

    this.debug = has(opts, 'debug')
      ? !!opts.debug
      : ZMQ_DEBUG
  }

  static [Symbol.hasInstance](instance) {
    return instance[kType] === TRANSPORT
  }

  get [kType]() {
    return TRANSPORT
  }

  get [Symbol.toStringTag]() {
    return 'ZMQTransport';
  }

  exec(method, url, payload, id, storage) {
    const {socket, error} = this.connection(url, method)
    if (!socket) {
      const err = new Error(`unable to create connection for ${method} - ${url}`)
      err.code = 'ENOZMQCONN'
      storage.failure(id, err)
      return
    }

    if (error) {
      storage.failure(id, error)
      return
    }

    debug('execute zmq timer', 'timeout', payload)
    socket
      .send('timeout', Zmq.ZMQ_SNDMORE)
      .send(payload)
    storage.success(id)
  }

  shutdown(cb = noop) {
    const connections = this.connections
    for (const [addr, socket] of connections.entries()) {
      debug('shutdown - %s', addr)
      socket.removeAllListeners()
      socket.disconnect(addr)
      socket.close()
      connections.delete(addr)
    }
    cb()
  }

  connection(addr, type) {
    const connections = this.connections
    let socket = connections.get(addr)
    if (socket) return {socket: socket, error: null}

    if (!METHODS.has(type)) {
      const err = new Error(`zmq error: unsupported transport method ${type}`)
      err.code = 'ENOZMQTYPE'
      err.meta = {type: type, address: addr}
      return {socket: null, error: err}
    }

    debug(`creating ${type} socket to ${addr}`)
    socket = Zmq.socket(type)
    if (this.debug) startMonitor(socket)

    if (this.bind) {
      debug('binding to %s', addr)
      const err = tryBind(socket, addr)
      if (err) return {socket: null, error: err}
    } else {
      debug('connecting to %s', addr)
      socket.connect(addr)
    }

    socket.on('error', (err) => {
      console.error('zmq error: destroying socket %s', addr, err.message)
      socket.removeAllListeners()
      socket.disconnect(addr)
      socket.close()
      connections.delete(addr)
    })
    connections.set(addr, socket)
    return {socket: socket, error: null}
  }
}

function startMonitor(socket) {
  for (const evt of MONITOR_EVENTS) {
    debug(`adding monitor event ${evt} for socket`)
    socket.on(evt, (fd, addr) => {
      monitor(`socket ${evt}: ${addr}`)
    })
  }
}

function tryBind(socket, addr) {
  try {
    socket.bindSync(addr)
  } catch (e) {
    socket.removeAllListeners()
    socket.close()
    e.meta = {
      address: addr
    }
    return e
  }
}
