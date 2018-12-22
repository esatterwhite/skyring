/*jshint laxcomma: true, smarttabs: true, node:true, esnext:true*/
'use strict';
/**
 * The Http transport backend
 * @module skyring/lib/transports/http
 * @author Eric Satterwhite
 * @since 1.0.0
 * @requires http
 * @requires request
 * @requires debug
 * @requires skyring/lib/timer
 */

const STATUS_CODES = require('http').STATUS_CODES
    , request = require('request')
    , debug   = require('debug')('skyring:transport:http')
    , method_exp = /^(post|put|patch|delete|get|options|head)$/i
    ;

/**
 * Dispatches an http request
 * @function
 * @alias module:skyring/lib/transports/http
 * @param {String} method The http method to use when dispatching the request
 * @param {String} url the url to target when dispatching
 * @param {String} payload The data payload to include in the request
 * @param {String} id The id of the timer being executed
 * @param {module:skyring/lib/timer} cache A timer cache instance to delete from after execution
 **/
module.exports = function httpTransport( method, url, payload, id, cache ) {
  const isJSON = typeof payload === 'object'
      , _method = method.toLowerCase()
      , options = {
          json: isJSON
        , body: payload || ''
        };


  if( method_exp.test(method) && typeof request[_method] !== 'function' ) {
    const t = cache.get(id);
    t && clearTimeout(t.timer);
    cache.failure(id, err);
    debug('unable to execute http transport', method, id);
    return;
  }

  debug('executing http transport %s', id, method);
  request[_method](url, options, (err, res, body) => {
    if(err){
      debug('timer err', err);
      return cache.failure(id, err);
    }
    if(res.statusCode > 299 ){
      debug('timer fail', res.statusCode, body);
      const error = new Error(STATUS_CODES[res.statusCode]);
      error.code = res.statusCode = res.statusCode;
      console.error(error, body);
      return cache.failure(id, error);
    }

    debug('timer sucess');
    return cache.success(id);
  });
};
