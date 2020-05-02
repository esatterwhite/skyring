'use strict'
/**
 * Middleware function the assigns the timer id to the customer header in the event it has been proxied
 * @module skyring/lib/server/api/middleware/timer_id
 * @author Eric Satterwhite
 * @since 1.0.0
 */

/**
 * @function
 * @alias module:skyring/lib/server/api/middleware/timer_id
 * @param {http.IncommingMessage} req
 * @param {http.ServerResponse} res
 * @param {module:skyring/lib/server/node} node
 * @param {Function} next
 **/
module.exports = function timer_id(req, res, node, next) {
  req.headers['x-timer-id'] = req.$.params.timer_id
  next()
}
