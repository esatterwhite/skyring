'use strict';

const request = require('request')
    , cache   = require('../cache')
    , debug   = require('debug')('timers:transport:http')
    ;

module.exports = function makeRequest( method, url, payload, id ) {
  const options = {
      json: true
    , body: payload || ""
  };
  debug('executing http transport %s', id);
  request[method](url, options, (err, res, body) => { 
    if(err){
      debug('timer fail');
    } else {
      debug('timer sucess', res.statusCode);
    }
    cache.delete(id);
  });
};
