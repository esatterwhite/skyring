/*jshint laxcomma: true, smarttabs: true, node:true, esnext:true*/
'use strict';
/**
 * Simple wrapper around the http request object to avoid deopts
 * @module skyring/lib/server/request
 * @author Eric Satterwhite
 * @since 1.0.0
 * @requires url
 * @requires querystring
 */

const {Url} = require('url')
    , qs = require('querystring')
    , cache = new WeakMap()
    , pathexp = /^(\/\/?(?!\/)[^\?#\s]*)(\?[^#\s]*)?$/
    ;

/**
 * @constructor
 * @alias skyring/lib/server/request
 * @param {IncommingMessage} req An {@link https://nodejs.org/api/http.html#http_class_http_incomingmessage|IncomingMessage}
 * from the node http module
 */
function Request( req ) {

  this.query   = Object.create(null);
  this.path    = null;
  this._body   = false;
  this.body    = null;
  this.timers  = null;
  this.res     = null;
  this.headers = req.headers;

  const parsed = parseurl(req);
  if (parsed) {
    this.query = parsed.query;
    this.path = parsed.pathname;
  }
}
/**
 * Returns the value of a header, if it exists
 * @param {String} header The name of the header to lookup
 * @returns {String} The request header, if set
 */
Request.prototype.get = function get( key ) {
  const _key = key.toLowerCase();
  const headers = this.headers || {};
  switch (_key) {
    case 'referrer':
    case 'referer':
      return headers.referrer || headers.referer;
    default:
      return headers[_key];
  }
};

function parseurl( req ) {
  const url = req.url;
  if (!url) return url;

  if ( cache.has(req) ) return cache.get(req);
  const parsed = fastparse(url);
  cache.set(req, parsed);
  return parsed;
}

function fastparse( str ) {
  const simple = typeof str === 'string' && pathexp.exec( str );

  if ( simple ) {
    const pathname = simple[1];
    const search = simple[2] || null;
    const url = new Url();
    url.path = str;
    url.href = str;
    url.pathname = pathname;
    url.search = search;
    url.query = url.search ? qs.parse( search.substr( 1 ) ) : Object.create(null);
    return url;
  }

  return parseurl( str, true );
}

module.exports = Request;
