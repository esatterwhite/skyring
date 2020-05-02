'use strict'

const {URL} = require('url')
const net = require('net')
const Pool = require('generic-pool')
const {Transport} = require('skyring')
const connections = new Map()
const noop = () => {}

module.exports = class TCP extends Transport {
  constructor(opts) {
    super(opts)
    this.opts = opts
  }

  exec(method, url, payload, id, storage) {
    const pool = this.getPool(url)
    pool.acquire().then((conn) => {
      const out = typeof payload === 'object' ? JSON.stringify(payload) : payload
      this.log.trace('execute timer %s', id)
      conn.write(out + '\n', 'utf8', () => {
        storage.success(id)
        pool.release(conn)
      })
    })
      .catch((e) => {
        const err = new Error(`Unable to exeute tcp transport for timer ${id}`)
        err.name = 'ETCPERR'
        storage.failure(id, err)
        this.log.error(err)
      })
  }

  shutdown(cb = noop) {
    const entries = connections.entries()
    const run = () => {
      const next = entries.next()
      if (next.done) return cb()
      const [key, value] = next.value
      this.log.trace('disconnecting %s', key)
      value.drain().then(() => {
        value.clear()
        this.log.trace('pool tranined removing tcp connection to %s', key)
        connections.delete(key)
        run()
      })
    }

    run()
  }

  getPool(addr) {
    if (connections.has(addr)) return connections.get(addr)
    const log = this.log
    const pool = Pool.createPool({
      create: () => {
        log.debug('creating new tcp connection', addr)
        const url = new URL(addr)
        const conn = net.connect(url.port, url.hostname)
        conn.setNoDelay(true)
        conn.setKeepAlive(true)
        conn.once('error', (err) => {
          log.error(err, 'destroying tcp connection for %s', addr)
          pool.destroy(conn).catch(() => {})
          connections.delete(addr)
        })
        return Promise.resolve(conn)
      }
    , destroy: (client, cb) => {
        return new Promise((resolve) => {
          client.on('end', () => {
            log.trace('connection closed %s', client.remoteAddress)
            resolve()
          })
          client.destroy()
        })
      }
    , validate: (conn) => {
        return Promise.resolve(!conn.destroyed)
      }
    }, {
      min: 1
    , max: 100
    , testOnBorrow: true
    })
    connections.set(addr, pool)
    return pool
  }
}
