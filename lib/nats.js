/*jshint laxcomma: true, smarttabs: true, node:true, esnext:true*/
'use strict';
/**
 * Small wrapper around nats for quickly connecting / disconnecting
 * @module skyring/lib/nats
 * @author Eric Satterwhite
 * @since 1.0.0.0
 * @requires url
 * @requires ionats
 * @requires keef
 * @requires debug
 */

const url         = require('url')
    , nats       = require('nats')
    , config      = require('keef')
    , debug       = require('debug')('skyring:nats')
    , nats_hosts = config.get('nats:hosts')
    , csv_exp     = /\s?,\s?/g;

var client = null;

/**
 * Creates a new nats client
 * @method module:skyring/lib/nats#createClient
 * @return {RedisClient} A nats client instance
 **/
exports.createClient = createClient

/**
 * Disconnects the current client from nats
 * @method module:skyring/lib/nats#disconnect
 **/
exports.disconnect = disconnect

exports.quit = quit
Object.defineProperty(exports, 'client', {
  get: function() {
    return client || createClient()
  }
})

function createClient() {
  const servers = parse(nats_hosts);
  debug('creating nats client', servers);
  client = nats.connect({servers});
  client.on('error', (err) => {
    console.error('nats error', err);
  });

  client.on('connect', () => {
    debug('nats connection successful');
  });

  client.on('end', () => {
    debug('nats connection closed');
    client.removeAllListeners();
    client = null;
  });

  client.on('ready', () => {
    debug('nats connection ready');
  });

  client.on('reconnecting', () => {
    debug('nats client reconnecting');
  })

  return client;
}

function disconnect(cb) {
  if (!client) return setImmediate(cb);
  client.close();
  client.once('close', cb);
}
function quit(cb){
  if (!client) return setImmediate(cb);
  client.close();
  client.once('close', cb);
}
function parse(str) {
  if (typeof str !== 'string') {
    throw new TypeError('nats hosts must be a string');
  }

  const items = str.split(csv_exp);
  return items.map(parseItem);
}

function parseItem(str) {
  return str.indexOf('nats://') === 0
    ? str
    : `nats://${str}`
}

