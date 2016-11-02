'use strict'
const Ringpop = require('ringpop')
    , TChannel = require('tchannel')
    , cache = require('./cache')
    , transports = require('./transports')
    , conf = require('keef')
    , host = conf.get('channel:host')
    , port = ~~conf.get('channel:port')

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

tchannel.listen( port, host, ()=> {
  console.log('tchannel listening on ', host, port);

  ringpop.bootstrap(conf.get( 'seed' ),( err ) => {
    if( err ){
      console.error( err.stack );
      process.exit( 1 )
    }
    console.log( 'ring bootstraped', conf.get( 'seed' ) )
  })

  ringpop.on('request', ( req, res ) => {
    let data = ""
    const id = req.headers['x-timer-id']

    if( cache.has(id) ){
      res.writeHead(400);
      res.write('key exists');
      return res.end();
    }

    req.on('data', ( chunk ) => {
      data += chunk
    })

    req.on('end', () => {
      const payload = data && JSON.parse(data);
      const transport = transports[ payload.callback.transport ]
      if( !transport ){
        res.writeHead(400);
        res.write('invalid transport');
        return res.end();
      }

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
      res.writeHead( 204,{
        location:`/timer/${req.headers['x-timer-id']}` 
      })
      res.end()
    })
  })
});

module.exports = ringpop;
