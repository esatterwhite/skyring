'use strict';
const Ringpop = require('ringpop')
    , TChannel = require('tchannel')
    , conf = require('keef')
    , host = conf.get('channel:host')
    , port = ~~conf.get('channel:port')
    ;

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
      process.exit( 1 );
    }
    console.log( 'ring bootstraped', conf.get( 'seed' ) );
  });
  ringpop.on('request', require('./handler') );
});

module.exports = ringpop;
