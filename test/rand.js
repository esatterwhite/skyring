'use strict'

const crypto = require('crypto')

module.exports = {bytes}

function bytes(n = 5) {
  return crypto.randomBytes(n).toString('hex')
}
