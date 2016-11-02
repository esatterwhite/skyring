'use strict';

const conf = require('keef')
    , Hapi = require('hapi')
    , joi = require('joi')
    , boom = require('boom')
    , uuid = require('node-uuid')
    , ring = require('./lib/ring')
    , cache = require('./lib/cache')
    , transports = require('./lib/transports')
    , server = new Hapi.Server()
    , debug = require('debug')('timer:server')
    ;


server.connection({
    port:conf.get('PORT')
  , host: '0.0.0.0'
});


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

server.route(
  [{
    path:'/timer'
  , method: 'post'
  , config: {
      payload:{
        parse: false
        ,output: 'stream'
      }
      ,pre:[
        {method: proxy, assign: 'handle'}
      , {method: payload, assign: 'payload'}
      ]
    }
  , handler: function(req, reply){
      if( req.pre.handle ){
        const id = req.headers['x-timer-id']
        const payload = req.pre.payload;
        const transport = transports[ payload.callback.transport ]
        
        if( cache.has(id) ) return reply( boom.badRequest('key exists') )
        if( !transport) return reply( boom.badRequest('invalid transport') )

        cache.set(
            id
          , setTimeout(
                transport
              , payload.timeout
              , payload.callback.method
              , payload.callback.uri
              , payload.data
              , id
            )
        )
        return reply().code(204).location(`/timer/${req.headers['x-timer-id']}`)
      } 
      debug( 'forwarded')
    }
  }, {
      path: '/timer/{timer_id}'
    , method: 'delete'
    , config: {
        pre:[
            {method: proxy, assign: 'handle'}
          , {method: payload, assign: 'payload'}
        ]
        , payload: {
              parse: false
            , output: 'stream'
          }
        , validate:{
            params: {
              timer_id: joi.string().uuid({ version:['uuidv4'] })
            }
          }
      }

    , handler: function( req, reply ){
        const ref = cache[req.params.timer_id];
        if(!ref) return reply(boom.notFound())

        clearTimeout( ref )
        cache[req.params.timer_id] = null
        reply().code(204)
      }
  }]
)

if( require.main === module ){
  server.start(( err ) => {
    if( err ){
      console.error( err.message, err.stack )
      process.exit(err.code || 1);
    }
    console.log(`http listening ${server.info.host}:${server.info.port}`)
  })
}

module.exports = { server, ring };

