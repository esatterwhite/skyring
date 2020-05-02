'use strict'
/**
 * Small wrapper around nats for quickly connecting / disconnecting
 * @module skyring/lib/nats
 * @author Eric Satterwhite
 * @since 1.0.0
 * @requires url
 * @requires nats
 * @requires keef
 * @requires debug
 * @example
const nats= require('skyring/lib/nats')
const client = nats.createClient()
client.publish('foobar', JSON.stringify({'foo':'bar'}), () => {
  nats.quit()
})
 */

const nats = require('nats')
const parseHosts = require('./parse-hosts')
const pino = require('../log')
const config = require('../../conf')
const log = pino.child({name: pino.namespace(__dirname, '')})
const nats_hosts = config.get('nats:hosts')
/**
 * Creates a new nats client
 * @method module:skyring/lib/nats#createClient
 * @param {Object} [options] nats client configuration
 * @param {String} [options.hosts=localhost:4222] a comma separated list of addresses of nats hosts to connect to
 * @return {NatsClient} A nats client instance
 * @example
nats.createClient({
  hosts:'nats-1.domain.com:4222,nats-2.domain.com:4223,localhost:4222'
})
 **/
exports.createClient = createClient

function createClient(options) {
  const hosts = (options && options.hosts) || nats_hosts
  const servers = parseHosts(hosts)
  const opts = Object.assign({json: true}, options, {servers})
  log.debug(opts, 'creating nats client')
  const client = nats.connect(opts)

  /* istanbul ignore next */
  client.on('error', (err) => {
    log.error('nats error', err)
  })

  client.on('connect', () => {
    log.debug('nats connection successful')
  })

  /* istanbul ignore next */
  client.on('close', () => {
    log.debug('nats connection closed')
    client.removeAllListeners()
  })

  /* istanbul ignore next */
  client.on('disconnect', () => {
    log.debug('nats connection disconnected')
  })

  /* istanbul ignore next */
  client.on('reconnecting', () => {
    log.warn('nats client reconnecting')
  })

  client.quit = (cb) => {
    log.debug('closing nats %s', client.info.server_id)
    client.close()
    client.once('disconnect', cb)
  }

  return client
}
