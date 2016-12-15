'use strict'

const cache = require('./cache')
const transports = require('./transports')

exports.create = function create(id, body, cb) {
  const payload = body
	const transport = transports[payload.callback.transport]

  if (cache.has(id)) {
    const err = new Error('Key exists')
    err.code = 'EKEYEXISTS'
    return cb(err)
  }

  cache.set(
    id
  , setTimeout(
      transport
    , payload.timeout
    , payload.callback.method
    , payload.callback.uri
    , payload.data
    , id
    )
  )
  cb(null)
}

