'use strict'
const Url = require('url')
    , net = require('net')
    , Pool = require('generic-pool')
    , debug = require('debug')('skyring:transports:tcp')
    , connections = new Map()
    ;

module.exports = function tcp( method, url, payload, id, cache ){
  const pool = getPool(url)
  pool.acquire().then((conn) => {
    const out = typeof payload === 'object' ? JSON.stringify(payload) : payload
    cache.remove(id)
    conn.write(out + '\n', 'utf8',() => {
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

function getPool(addr, opts) {
  if (connections.has(addr)) return connections.get(addr)
  const pool = Pool.createPool({
    create: () => {
      debug("creating")
      const url = Url.parse(addr)
      let conn =  net.connect(url.port, url.hostname)
      conn.setNoDelay(true)
      conn.setKeepAlive(true)
      conn.on('error', (err) => {
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

function onSignal() {
  debug('open connections', connections.size)
  for (var [key, value] of connections.entries()) {
    debug('disconnecting %s', key)
    value.drain().then(() => {
      value.clear()
    })
  }
}
process.once('SIGINT', onSignal)
process.once('SIGTERM', onSignal)
