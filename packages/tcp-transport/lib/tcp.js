'use strict'

const Url = require('url')
const net = require('net')
const Pool = require('generic-pool')
const debug = require('debug')('skyring:transports:tcp')
const kType = Symbol.for('skyringType')
const connections = new Map()
const TRANSPORT = 'tcptransport'
const noop = () => {}

module.exports = class TCP {
  constructor(opts) {
    this.name = TRANSPORT
  }

  exec(method, url, payload, id, storage) {
    const pool = getPool(url)
    pool.acquire().then((conn) => {
      const out = typeof payload === 'object' ? JSON.stringify(payload) : payload
      storage.remove(id)
      conn.write(out + '\n', 'utf8', () => {
        pool.release(conn)
      })
    })
    .catch((e) => {
      debug('error', e)
      const err = new Error(`Unable to exeute tcp transport for timer ${id}`)
      err.name = 'ETCPERR'
      console.error(err)
    })
  }
  shutdown(cb = noop) {
    const entries = connections.entries()
    const run = () => {
      const next = entries.next()
      if (next.done) return cb()
      const [key, value] = next.value
      debug('disconnecting %s', key)
      value.drain().then(() => {
        value.clear()
        debug(`removing tcp connection to ${key}`)
        connections.delete(key)
        run()
      })
    }

    run()
  }
}

function getPool(addr, opts) {
  if (connections.has(addr)) return connections.get(addr)
  const pool = Pool.createPool({
    create: () => {
      debug("creating")
      const url = Url.parse(addr)
      let conn =  net.connect(url.port, url.hostname)
      conn.setNoDelay(true)
      conn.setKeepAlive(true)
      conn.once('error', (err) => {
        debug("destroying connection", err.message)
        pool.destroy(conn).catch(()=>{})
        connections.delete(addr)
      })
      return conn
    }
  , destroy: (client, cb) => {
      client.on('end', () => {
        debug('connection closed')
      })
      client.destroy()
    }
  , validate: (conn) => {
      return Promise.resolve(conn.destroyed)
    }
  }, {
    min: 1
  , max: 100
  , testOnBorrow: true
  })
  connections.set(addr, pool)
  return pool
}

function shutdown(cb = ()=>{}) {
  const entries = connections.entries()
  const run = () => {
    const next = entries.next()
    if (next.done) return cb()
    const [key, value] = next.value
    debug('disconnecting %s', key)
    value.drain().then(() => {
      value.clear()
      debug(`removing tcp connection to ${key}`)
      connections.delete(key)
      run()
    })
  }
  run()
}
