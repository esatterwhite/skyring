'use strict';
const Ringpop  = require('ringpop')
    , TChannel = require('tchannel')
    , debug    = require('debug')('kronos:ring')
    , conf     = require('keef')
    , host     = conf.get('channel:host')
    , port     = ~~conf.get('channel:port')
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
  debug('tchannel listening on ', host, port);

  ringpop.bootstrap(conf.get( 'seed' ), ( err ) => {
    if( err ){
      console.error( err.stack );
      process.exit( 1 );
    }
    debug( 'ring bootstraped', conf.get( 'seed' ) );
  });
});

module.exports = ringpop;
