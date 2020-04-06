/*jshint laxcomma: true, smarttabs: true, node:true, esnext:true*/
'use strict';
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

const nats        = require('nats')
    , config      = require('../conf')
    , debug       = require('debug')('skyring:nats')
    , nats_hosts  = config.get('nats:hosts')
    , csv_exp     = /\s?,\s?/g;

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
exports.createClient = createClient;

Object.defineProperty(exports, 'client', {
  get: function() {
    return createClient();
  }
});

function createClient(options) {
  const hosts = (options && options.hosts) || nats_hosts;
  const servers = Array.isArray(hosts) ? hosts : parse(hosts);
  const opts = Object.assign({json: true}, options, {servers});
  debug('creating nats client', opts);
  const client = nats.connect(opts);
  client.on('error', (err) => {
    console.error('nats error', err);
  });

  client.on('connect', () => {
    debug('nats connection successful');
  });

  client.on('end', () => {
    debug('nats connection closed');
    client.removeAllListeners();
  });

  client.on('ready', () => {
    debug('nats connection ready');
  });

  client.on('reconnecting', () => {
    debug('nats client reconnecting');
  });

  client.quit = (cb) => {
    debug('closing nats', client.info.server_id);
    client.close();
    client.once('disconnect', cb);
  };

  return client;
}

function parse(str) {
  if (typeof str !== 'string') {
    throw new TypeError('nats hosts must be a string');
  }

  const items = str.split(csv_exp);
  return items.map(parseItem);
}

function parseItem(str) {
  return str.indexOf('nats://') === 0 ? str : `nats://${str}`;
}

