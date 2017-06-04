/*jshint laxcomma: true, smarttabs: true, node:true, esnext:true*/
'use strict';
/**
 * Mock http request / response object for use when proxing requests through TChannel
 * @module skyring/lib/server/mock
 * @author Eric satterwhite
 * @since 1.0.0
 * @requires stream
 * @requires events
 * @requires url
 * @requires http
 */

const stream       = require('stream')
    , EventEmitter = require('events').EventEmitter
    , url          = require('url')
    , http         = require('http')
    ;


/**
 * A mock IncomingMessage Object for proxying requests via tchannel
 * @class module:skyring/lib/server/mock.Request
 * @extends EventEmitter
 */
exports.Request = class Request extends stream.Readable {
  constructor ( options ){
    super();
    this.body = '';
    this.httpVersion = '1.1';
    this.payload = options.payload;
    this.url = options.url || '/';
    this.query = url.parse(this.url, true).query;
    this.headers = options.headers || {};
    this.method = options.method;
    this._headerNames = {};
    this._removedHeader = {};
    this.setHeader('transfer-encoding', 'chunked');

  }
  setHeader(name, value) {
    this.headers[name.toLowerCase()] = value;
  }
  getHeader(name){
    return this.headers[name];
  }

  _read(){

    if(this.payload){
      this.push(this.payload);
      this.payload = null;
      return;
    }

    this.push(null);

  }
};

/**
 * A mock ServerResponse Object for proxying requests via tchannel
 * @class module:skyring/lib/server/mock.Response
 * @extends EventEmitter
 */
exports.Response = class Response extends EventEmitter {

  constructor(callback){
    super();
    this.buffer = [];
    this.statusCode = 200;
    this._headers = {};
    this.on('data', function (chunk) {
      this.buffer.push(chunk);
    });
    this.on('pipe', function (src) {
      var buffer = this.buffer;

      src.on('data', function (chunk) {
        buffer.push(chunk);
      });
    });
    this.on('close', function () {});

    if (callback) {
      const self = this;
      const cleanup = function () {
        self.removeListener('error', cleanup);
        self.removeListener('response', cleanup);

        callback.apply(this, arguments);
      };
      this.once('error', cleanup);
      this.once('response', cleanup);
    }

    // necessary for mocking a real request.
    this._headerNames = {};
    this._removedHeader = {};
  }

  writeHead(statusCode, headers){
    var that = this;

    this.statusCode = statusCode;
    Object.keys(headers || {}).forEach(function (k) {
      that.setHeader(k, headers[k]);
    });
  }

  setHeader(name, value, clobber){
    if (http.ServerResponse) {
      var ret = http.ServerResponse.prototype.setHeader.call(this, name, value, clobber);
      this.headers = this._headers;
      return ret;
    } else if (clobber || !this.headers.hasOwnProperty(name)) {
      this.headers[name] = value;
    } else {
      this.headers[name] += ',' + value;
    }

  }

  getHeader(name){
    if (http.ServerResponse) {
      return http.ServerResponse.prototype.getHeader.call(this, name);
    } else {
      return this.headers[name];
    }

  }

  end(str){
    if (this.finished) {
      return;
    }

    if (str) {
      this.buffer.push(str);
    }

    var body = this._buildBody();

    this.emit('close');
    this.emit('finish');
    this.emit('end', null, { // deprecate me
      statusCode: this.statusCode,
      body: body,
      headers: this._headers
    });
    this.emit('response', null, {
      statusCode: this.statusCode,
      body: body,
      headers: this._headers
    });
    this.finished = true;

    // Cleanup any listeners that are 'hanging' around.
    this.removeAllListeners();
  }

  _buildBody(){
    if (this.buffer.length === 1) {
      return this.buffer[0];
    }

    var isBuffers = true;
    for (var i = 0; i < this.buffer.length; i++) {
      if (!Buffer.isBuffer(this.buffer[i])) {
        isBuffers = false;
      }
    }

    if (!isBuffers) {
      return this.buffer.join('');
    }

    return Buffer.concat(this.buffer);
  }

};
