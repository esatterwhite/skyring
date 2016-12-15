'use strict';

const {Url} = require('url')
    , cache = new WeakMap()
    , qs = require('querystring')
    , pathexp = /^(\/\/?(?!\/)[^\?#\s]*)(\?[^#\s]*)?$/
    ; 

function Request( req ) {

  const parsed = parseurl(req);
  this._body  = false;
  this.body   = null;

  if ( parsed ) {
    this.query = parsed.query;
    this.path = parsed.pathname;
  } else {
    this.query = Object.create(null);
    this.path = null;
  }
  this.headers = req.headers;
}

Request.prototype.get = function get( key ) {
  const _key = key.toLowerCae();
  const headers = this.req.headers || {};
  switch (_key) {
    case 'referrer':
    case 'referer':
      return headers.referrer || headers.referer;
    default:
      return headers[_key];
  }
};

function parseurl( req ) {
  debugger;
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
};

module.exports = Request;
