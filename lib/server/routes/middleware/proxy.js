'use strict'
const uuid = require('uuid')
const body = require('body')
const ring = require('../../../ring')
const json = require('../../../json')

module.exports = function proxy(req, res, cb) {
  const timer_id = req.$.params.timer_id || uuid.v4()
  req.headers['x-timer-id'] = timer_id
  const do_handle = ring.handleOrProxy(timer_id, req, res)
  if (!do_handle) return
  body(req, res, (err, data) => {
    if (err) cb(err)
    const {error, value} = json.parse(data)
    if (error) return cb(error)
    req.$.body = value
    cb()
  })
}
