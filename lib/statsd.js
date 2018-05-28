'use strict'

const StatsD = require('hot-shots')
const conf = require('keef')
const debug = require('debug')('statsd')
const statsd = conf.get('statsd')

const noop = () => {}
const mock = {
  gauge: noop
, increment: noop
, decrement: noop
, timing: noop
, on: noop
, close: (cb) => {
    setImmediate(cb, null)
  }
}

if (statsd) {
  debug('statsd enabled', statsd)
  const client = new StatsD(statsd)
  client.socket.on('error', (err) => {
    log.error(err)
  })
  module.exports = client
} else {
  debug('statsd disabled')
  module.exports = mock
}
