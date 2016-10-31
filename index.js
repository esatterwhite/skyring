'use strict';

const Ringpop = require('ringpop')
    , TChannel = require('tchannel')
    , conf = require('keef')
    , Hapi = require('hapi')
    , server = new Hapi.Server()
    , host = conf.get('channel:host')
    , port = ~~conf.get('channel:port')
    , joi = require('joi')
    ;


server.connection({
    port:conf.get('PORT')
  , host: '0.0.0.0'
});

const tchannel = new TChannel();
const ringpop = new Ringpop({
    app: 'timers'
  , hostPort:`${host}:${port}`
  , channel: tchannel.makeSubChannel({
      serviceName: 'ringpop'
    , trace:false
    })
});

ringpop.setupChannel();

tchannel.listen(port, host, ()=> {
  console.log('tchannel listening on ',host, port);

  ringpop.bootstrap(conf.get('seed'),(err)=>{
    if( err ){
      console.error( err.stack );
      process.exit(1)
    }
    console.log('ring bootstraped', conf.get('seed') )
  })
  ringpop.on('request',( req, res ) => {
    
    console.log(req.headers, '\n')
    req.pipe(process.stdout)
    res.writeHead(201)
    res.write(process.hrtime().join(''))
    res.end()
  })
});


// init


const schema = joi.object().keys({
  timeout: joi.number().integer().min(1000).required()
  ,callback: joi.object().keys({
    method:joi.string().valid('post','put','patch').required()
    ,uri: joi.string().required()
  }).required()
})

function proxy( req, reply ) {
    reply(ringpop.handleOrProxy(req.id, req.raw.req, req.raw.res))
}

function payload( req, reply){
  if(!req.pre.handle) return reply(null);

  let data = ''
  req.payload.on('data', (chunk) => {
    data += chunk
  });

  req.payload.on('end',() => {
    debugger;
    console.log( data )
    data = JSON.parse( data )
    const result = schema.validate( data )
    if(result.error){
      console.error( result.error )
    }
    reply(result.error || result.value);
  })
}
server.route({
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
      debugger;
      if( req.pre.handle ){
        console.log('handled', req.pre.payload )
        reply(process.hrtime().join('')).code(201)
        // setTimeout( postBack, req.body.timeout )
        return req.payload.pipe( process.stdout )
      } 
      
      console.log( 'forwarded')
    }
})

if( require.main === module ){
  server.start(( err ) => {
    if( err ){
      console.error( err.message, err.stack )
      process.exit(err.code || 1);
    }
    console.log(`http listening ${server.info.host}:${server.info.port}`)
  })
}

module.exports = { server, ringpop };

