'use strict';

/**
 * Middleware that determines if the current server should handle the request, and will proxy
 * it to the appropriate node if it isn't
 * @module skyring/lib/server/api/middleware/proxy
 * @author Eric Satterwhite
 * @since 1.0.0
 * @requires uid
 * @requires body
 * @requires debug
 * @requires skyring/lib/json
 */

const uuid  = require('uuid')
const body  = require('body')
const debug = require('debug')('skyring:proxy')
const json  = require('../../../json')

/**
 * @function
 * @alias module:skyring/lib/server/api/middleware/proxy
 * @param {http.IncommingMessage} req
 * @param {http.ServerResponse} res
 * @param {module:skyring/lib/server/node} node
 * @param {Function} next
 **/
module.exports = function proxy(req, res, node, cb) {
  const timer_id = req.$.headers['x-timer-id'] || uuid.v4()
  req.headers['x-timer-id'] = timer_id
  res.setHeader('location', `/timer/${timer_id}`)
  const do_handle = node.handleOrProxy(timer_id, req, res)
  if (!do_handle) return debug('proxing', timer_id)

  debug('handle request')
  body(req, res, (err, data) => {
    if (err) return cb(err)

    const {error, value} = json.parse(data)

    if (error) {
      error.statusCode = 400
      return cb(error)
    }

    req.$.body = value
    cb()
  })
}
