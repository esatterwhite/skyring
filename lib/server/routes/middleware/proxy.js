'use strict';
const uuid  = require('uuid')
    , body  = require('body')
    , debug = require('debug')('kronos:proxy')
    , json  = require('../../../json')
    ;

module.exports = function proxy(req, res, node, cb) {
  const timer_id = req.$.headers['x-timer-id'] || uuid.v4()
  req.headers['x-timer-id'] = timer_id
  const do_handle = node.handleOrProxy(timer_id, req, res)
  
  if (!do_handle) return debug('proxing', timer_id)
  
  body(req, res, (err, data) => {
    if (err) cb(err)
    
    const {error, value} = json.parse(data)
    if (error) return cb(error)
    
    req.$.body = value
    cb()
  })
}
