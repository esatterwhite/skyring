'use strict'
/**
 * Simple wrapper around the http response object to avoid deopts
 * @module skyring/lib/server/response
 * @author Eric Satterwhite
 * @since 1.0.0
 * @requires debug
 */

const {STATUS_CODES} = require('http')
const pino = require('../log')
const log = pino.child({name: pino.namespace(__dirname, '')})

/**
 * @constructor
 * @alias module:skyring/lib/server/response
 * @param {ServerResponse} res A {@link https://nodejs.org/api/http.html#http_class_http_serverresponse|ServerResponse}
 * from the node http module
 */
function Response(res) {
  this.res = res
  this.body = null
}

/**
 * Responsible for returning a response in the case of an error
 * If the error has a message, it will be sent with the `x-skyring-reason` http header
 * if the error has a `statusCode` property, that will be used, otherwise a 500 will be returned
 * @method module:skyring/lib/server/response#error
 * @param {Error|number} err The error to handle
 * @param {String} [msg] In the case `err` is a number, this will be used as the message
 */
Response.prototype.error = function error(err, msg) {
  if (typeof err === 'number') {
    const message = msg || STATUS_CODES[err]
    this.res.setHeader('x-skyring-reason', message || 'Internal Server Error')
    return this.status(err).json({message})
  }

  err.statusCode = err.statusCode || err.code
  if (!err.statusCode) {
    err.statusCode = 500
    err.message = 'Internal Server Error'
  }

  this.status(err.statusCode)
  log.error(err)
  this.res.setHeader('x-skyring-reason', err.message)
  return this.end()
}

/**
 * Returns the value of a response header
 * @method module:skyring/lib/server/response#get
 * @param {String} header The name of the header to get
 * @returns {String} The header value, if it is set
 */
Response.prototype.get = function get(key) {
  return this.res.getHeader(key)
}

/**
 * Helper for responding with an Object. Will serialize the object, and set the
 * Content-Type header to `application/json`
 * @chainable
 * @method module:skyring/lib/server/response#json
 * @param {Object} body The object to set as the response body
 * @returns {module:skyring/lib/server/response}
 */
Response.prototype.json = function json(body) {
  this.res.setHeader('Content-Type', 'application/json')
  this.res.end(JSON.stringify(body))
  return this
}

/**
 * Sets a response header
 * @chainable
 * @method module:skyring/lib/server/response#set
 * @param {String} header The header to set
 * @param {String} The header value to set
 * @returns {module:skyring/lib/server/response}
 */
Response.prototype.set = function set(key, val) {
  const value = Array.isArray(val)
    ? val.map(String)
    : typeof val === 'string' ? val : String(val)

  this.res.setHeader(key, value)
  return this
}

/**
 * Sets the status code on the response object
 * @chainable
 * @method module:skyring/lib/server/response#status
 * @param {Number} code The http Status code to set
 * @returns {module:skyring/lib/server/response}
 */
Response.prototype.status = function status(code) {
  this.res.statusCode = code
  return this
}

/**
 * Writes a chunk to the response stream
 * @chainable
 * @method module:skyring/lib/server/response#send
 * @param {String} [chunk] The chunk to write
 * @returns {module:skyring/lib/server/response}
 */
Response.prototype.send = function send(str) {
  this.res.write(str)
  return this
}

/**
 * Ends the response
 * @method module:skyring/lib/server/response#end
 * @param {String} [chunk] An optional chunk to write be for closing the stream
 * @returns {module:skyring/lib/server/response}
 */
Response.prototype.end = function end(str) {
  this.res.end(str)
  return this
}

module.exports = Response
