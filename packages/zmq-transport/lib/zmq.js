'use strict'
const Zmq = require('zmq')
const debug = require('debug')('skyring:transports:zmq')
const monitor = require('debug')('skyring:transports:zmq:monitor')
const connections = new Map()
const METHODS = new Set(['push', 'pub'])
const ZMQ_DEBUG = !!process.env.ZMQ_DEBUG
const ZMQ_BIND = !!process.env.ZMQ_BIND
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

module.exports = function zmq(method, url, payload, id, storage) {
  const conn = getConnection(url, method)
  if(!conn) {
    const err = new Error(`unable to create connection for ${method} - ${url}`)
    err.code = 'ENOZMQCONN'
    throw err
  }

  debug('execut zmq timer', 'timeout', payload)
  conn
    .send('timeout', Zmq.ZMQ_SNDMORE)
    .send(payload)
  storage.remove(id)
}

module.exports.shutdown = shutdown

function getConnection(addr, type) {
  if (connections.has(addr)) return connections.get(addr)
  if (!METHODS.has(type)) {
    console.error('zmq error: unsupported transport method %s', type)
    return null
  }

  debug(`creating ${type} socket to ${addr}`)
  const socket = Zmq.socket(type)
  if (ZMQ_BIND) {
    debug('binding to %s', addr)
    const err = tryBind(socket, addr)
    if (err) throw err
  } else {
    debug('connecting to %s', addr)
    socket.connect(addr)
  }
  if (ZMQ_DEBUG) startMonitor(socket)
  socket.on('error', (err) => {
    console.error('zmq error: destroying socket %s', addr, err.message)
    socket.removeAllListeners()
    socket.disconnect(addr)
    socket.close()
    connections.delete(addr)
  })
  connections.set(addr, socket)
  return socket
}

function startMonitor(socket) {
  for (const evt of MONITOR_EVENTS) {
    debug(`adding monitor event ${evt} for socket`)
    socket.on(evt, (fd, addr) => {
      monitor(`socket ${evt}: ${addr}`)
    })
  }
}

function shutdown(cb = () =>{}) {
  for (const [addr, socket] of connections.entries()) {
    debug('shutdown - %s', addr)
    socket.removeAllListeners()
    socket.disconnect(addr)
    socket.close()
    connections.delete(addr)
  }
  cb()
}

function tryBind(socket, addr){
  try{
    socket.bindSync(addr)
  } catch(e) {
    e.meta = {
      address: addr
    , type: type
    }
    return e
  }
}
