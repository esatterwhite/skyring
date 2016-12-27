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
    , timer   = require('../timer')
    , debug   = require('debug')('skyring:transport:http')
    ;

/**
 * Dispatches an http request
 * @function
 * @alias module:skyring/lib/transports/http
 * @param {String} method The http method to use when dispatching the request
 * @param {String} url the url to target when dispatching
 * @param {String} payload The data payload to include in the request
 * @param {String} id The id of the timer being executed
 **/
module.exports = function makeRequest( method, url, payload, id) {
  const isJSON = typeof payload === 'object'
  const options = {
    body: payload || ""
  , json: isJSON
  };
  debug('executing http transport %s', id);
  request[method](url, options, (err, res, body) => {
    if(err){
      debug('timer fail');
      return timer.delete(id);
    }
    if(res.statusCode > 299 ){
      debug('timer fail');
      const err = new Error(STATUS_CODES[res.statusCode])
      err.code = res.statusCode = res.statusCode;
      return timer.delete(id);
    }

    debug('timer sucess');
    return timer.delete(id);
  });
};
