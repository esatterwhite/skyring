'use strict'
/**
 * represents the middleware stack for a url / method combination
 * @module skyring/lib/server/route
 * @author Eric Satterwhite
 * @since 1.0.0
 * @requires path-to-regexp
 */

const pathToRegExp = require('path-to-regexp')

/**
 * @constructor
 * @alias module:skyring/lib/server/route
 * @param {String} path the url pattern to match
 * @param {String} method The http method to respect
 * @example
var rte = new Route('/foo/:id', 'POST')
rte.use((req, res, node, next) => {
  if(req.method === 'DELETE') {
    const err = new Error('Not Implemented')
    err.statusCode = 501
    next(err)
  }
})
 **/
function Route(path, method) {
  this.path = path
  this.method = method
  this._keys = []
  this.stack = []
  this.regexp = pathToRegExp(path, this._keys)
  this.keys = new Array(this._keys.length)
  this.params = Object.create(null)

  for (var idx = 0; idx < this._keys.length; idx++) {
    this.keys[idx] = this._keys[idx].name
    this.params[this._keys[idx].name] = undefined
  }
}

/**
 * Adds a middleware function to the end of the internal route stack
 * @method module:skyring/lib/server/route#use
 * @param {module:skyring/lib/server/route~Middleware} fn a the middelware function to add
 **/
Route.prototype.use = function use(fn) {
  if (Array.isArray(fn)) {
    for (var idx = 0; idx < fn.length; idx++) {
      this.stack.push(fn[idx])
    }
  } else {
    this.stack.push(fn)
  }

  return this
}

/**
 * Adds a middleware function to the beginning of the internal route stack
 * @method module:skyring/lib/server/route#before
 * @param {module:skyring/lib/server/route~Middleware} fn a the middelware function to add
 **/
Route.prototype.before = function before(fn) {
  if (Array.isArray(fn)) {
    this.stack.unshift(...fn)
  } else {
    this.stack.unshift(fn)
  }

  return this
}

Route.prototype.match = function match(path) {
  const matches = this.regexp.exec(path)
  if (!matches) return null

  const keys = this.keys
  const params = {...this.params}

  for (var idx = 1; idx < matches.length; idx++) {
    params[keys[idx - 1]] = matches[idx]
  }

  return params
}

Route.prototype.process = function process(req, res, node, next) {
  const stack = this.stack
;(function run(idx) {
    const fn = stack[idx]
    try {
      fn(req, res, node, (err, body) => {
        if (err) return next(err)
        if (idx === stack.length - 1) return next()
        run(++idx)
      })
    } catch (err) {
      err.statusCode = err.statusCode || 500
      return next(err)
    }
  }(0))
}

module.exports = Route

/**
 * A route middleware function
 * @typedef {Function} Middleware
 * @param {http.IncomingMessage} req The incomming request
 * @param {http.ServerResponse} res The response object to be sent
 * @param {module:skyring/lib/server/node} node The internal Ring Node instance
 * @param {Function} next The continuation callback to call when the middleware is finished
 **/
