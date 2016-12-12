'use strict';

const conf = require('keef')
    , joi = require('joi')
    , uuid = require('uuid')
    , http = require('http')
    , boom = require('boom')
    , handler = require('./lib/handler')
    , ring = require('./lib/ring')
    , cache = require('./lib/cache')
    , transports = require('./lib/transports')
    , debug = require('debug')('timer:server')
    ;


// init


const schema = joi.object().keys({
  timeout: joi.number().integer().min(1000).required()
  ,data: joi.string().optional()
  ,callback: joi.object().keys({
    method:joi.string().valid('post','put','patch').required()
    ,transport:joi.string().valid('http','queue').required()
    ,uri: joi.string().required()
  }).required()
})


function proxy( req, reply ) {
  // we need to do this because requests are proxied using
  // the tchannel connections, not http and skips routing, etc
  // this just makes it easier
  const timer_id = req.params.timer_id || uuid.v4();
  req.headers['x-timer-id'] = timer_id;
  reply(ring.handleOrProxy(timer_id, req.raw.req, req.raw.res))
}

function payload(req, reply){
  if(!req.pre.handle) return reply(null);
  let data = ''
  req.payload.on('data', (chunk) => {
    data += chunk
  });

  req.payload.on('end',() => {
    if( data ){
      data && JSON.parse( data )
      const result = schema.validate( data )
      return reply( result.error || result.value );
    }
    reply(null)
  })
}

const server = http.createServer( handler );

if( require.main === module ){
	server.listen(conf.get('PORT'))
}

module.exports = { server, ring };

