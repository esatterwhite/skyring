'use strict'
/**
 * Function to parse and normalize nats host addresses
 * @module skyring/lib/nats/parse-hosts
 * @author Eric Satterwhite
 * @since 10.0.0
 **/

const toArray = require('../lang/array/to-array')

module.exports = parseHosts
function parseHosts(str) {
  if (Array.isArray(str)) return str.map(parseItem)

  if (typeof str !== 'string') {
    throw new TypeError('nats hosts must be a string')
  }

  return toArray(str).map(parseItem)
}

function parseItem(str) {
  return str.indexOf('nats://') === 0 ? str : `nats://${str}`
}
