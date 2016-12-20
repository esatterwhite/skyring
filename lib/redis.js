/*jshint laxcomma: true, smarttabs: true, node:true, esnext:true*/
'use strict';
/**
 * Small wrapper around redis for quickly connecting / disconnecting
 * @module skyring/lib/redis
 * @author Eric Satterwhite
 * @since 1.0.0.0
 * @requires url
 * @requires ioredis
 * @requires keef
 * @requires debug
 */

const url         = require('url')
    , Redis       = require('ioredis')
    , config      = require('keef')
    , debug       = require('debug')('skyring:redis')
    , redis_hosts = config.get('redis:hosts')
    , csv_exp     = /\s?,\s?/g;

var client = null;

/**
 * Creates a new redis client
 * @method module:skyring/lib/redis#createClient
 * @return {RedisClient} A redis client instance
 **/
exports.createClient = createClient

/**
 * Disconnects the current client from redis
 * @method module:skyring/lib/redis#disconnect
 **/
exports.disconnect = disconnect

Object.defineProperty(exports, 'client', {
  get: function() {
    return client || createClient()
  }
})

function createClient() {
  const servers = parse(redis_hosts);
  debug('creating redis client', servers);

  if (servers.length === 1) {
    const redis = servers[0];
    client = new Redis(redis.port, redis.host);
  } else {
    client = new Redis.Cluster(servers, {
      scaleReads: 'all'
    });
  }

  client.on('error', (err) => {
    console.error('redis error', err);
  });

  client.on('connect', () => {
    debug('redis connection successful');
  });

  client.on('end', () => {
    debug('redis connection closed');
    client.removeAllListeners();
    client = null;
  });

  client.on('ready', () => {
    debug('redis connection ready');
  });

  client.on('reconnecting', () => {
    debug('redis client reconnecting');
  })

  return client;
}

function disconnect(cb) {
  if (!client) return setImmediate(cb);
  client.once('end', cb);
  return client.disconnect();
}



function parse(str) {
  if (typeof str !== 'string') {
    throw new TypeError('redis hosts must be a string');
  }

  const items = str.split(csv_exp);
  return items.map(parseItem);
}

function parseItem(str) {
  const s = str.indexOf('redis://') === 0
    ? str
    : `redis://${str}`

  const parsed = url.parse(s.trim());

  return {
    host: parsed.hostname
  , port: getPort(parsed.port)
  };
}

function getPort(p) {
  if (!p) return 6379;
  return +p;
}
