'use strict'

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
const needle = require('needle')
const Transport = require('./transport')
const log = require('../log')
const {name, version} = require('../../package.json')
const method_exp = /^(post|put|patch|delete|get|options|head)$/i
const kType = Symbol.for('SkyringTransport')
const TRANSPORT = 'httptransport'
const USER_AGENT = `${name}/${version}`
const HEADERS = {
  'User-Agent': USER_AGENT
}

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
class Http extends Transport {
  constructor(options) {
    super(options)
    this.log = log.child({name: 'skyring:transports:http'})
  }

  static [Symbol.hasInstance](instance) {
    return instance[kType] === TRANSPORT
  }

  exec(method, url, payload, id, cache) {
    const body = payload || ''
    const is_json = typeof body === 'object'
    if (!method_exp.test(method)) {
      const pending = cache.get(id)
      pending && clearTimeout(pending.timer)
      const err = new Error(`Invalid http verb ${method}`)
      err.code = 'ESRHTTP'
      this.log.error(err, 'unable to execute http transport %s', id)
      cache.failure(id, err)
      return
    }

    this.log.debug('executing http transport %s', id)

    const opts = {
      json: is_json
    , headers: HEADERS
    }
    needle.request(method, url, body, opts, (err, res) => {
      if (err) {
        this.log.error(err, {url, method, id})
        return cache.failure(id, err)
      }

      if (res.statusCode > 299) {
        const error = new Error(STATUS_CODES[res.statusCode])
        error.code = res.statusCode
        this.log.error(err, 'timer failure %s', res.statusCode)
        return cache.failure(id, error)
      }

      this.log.debug('timer sucess %s', id)
      return cache.success(id)
    })
  }

  get [kType]() {
    return TRANSPORT
  }

  get [Symbol.toStringTag]() {
    return 'SkyringHttpTransport'
  }
}

module.exports = Http
