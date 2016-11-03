'use strict';

const request = require('request')
const cache   = require('../cache')
const debug   = require('debug')('timers:transport:http')

module.exports = function makeRequest( method, url, payload, id ) {
  const options = {
      json: true
    , body: payload || ""
  };
  debug('executing http transport %s', id)
  request[method](url, options, (err, res, body) => { 
    if(err){
      debug('timer fail')
    } else {
      debug('timer sucess')
    }
    cache.delete(id)
  })
}
