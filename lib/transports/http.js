'use strict';

const STATUS_CODES = require('http').STATUS_CODES
    , request = require('request')
    , timer   = require('../timer')
    , debug   = require('debug')('skyring:transport:http')
    ;

module.exports = function makeRequest( method, url, payload, id, cb) {
  const options = {
      json: true
    , body: payload || ""
  };
  debug('executing http transport %s', id);
  request[method](url, options, (err, res, body) => {
    if(err){
      debug('timer fail');
      return cb(err)
    }
    
    if(res.statusCode > 299 ){
      debug('timer fail');
      const err = new Error(STATUS_CODES[res.statusCode])
      err.code = res.statusCode = res.statusCode;
      return cb(err);
    }

    debug('timer sucess');
    timer.delete(id);
    cb(null);
  });
};
