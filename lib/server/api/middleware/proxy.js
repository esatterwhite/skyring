'use strict';
/*jshint laxcomma: true, smarttabs: true, esnext: true, node: true*/
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
    , body  = require('body')
    , debug = require('debug')('skyring:proxy')
    , json  = require('../../../json')
    ;

/**
 * @function
 * @alias module:skyring/lib/server/api/middleware/proxy
 * @param {http.IncommingMessage} req
 * @param {http.ServerResponse} res
 * @param {module:skyring/lib/server/node} node
 * @param {Function} next
 **/
module.exports = function proxy(req, res, node, cb) {
  const timer_id = req.$.headers['x-timer-id'] || uuid.v4();
  req.headers['x-timer-id'] = timer_id;
  const do_handle = node.handleOrProxy(timer_id, req, res);
  if (!do_handle) return debug('proxing', timer_id);

  body(req, res, (err, data) => {
    if (err) return cb(err);

    const {error, value} = json.parse(data);
    if (error) return cb(error);

    req.$.body = value;
    cb();
  });
};
