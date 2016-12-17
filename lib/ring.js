'use strict';
const EventEmitter = require('events').EventEmitter
    , Ringpop        = require('ringpop')
    , TChannel       = require('tchannel')
    , debug          = require('debug')('kronos:ring')
    , conf           = require('keef')
    , host           = conf.get('channel:host')
    , port           = ~~conf.get('channel:port')
    ;




class Node extends EventEmitter {
  constructor(name = 'ring', app = 'timers' ) {
    super()

    this._name = name;
    this._app = app;
    this._tchannel = new TChannel();
    this._ring = new Ringpop({
        app: 'timers'
      , hostPort:`${host}:${port}`
      , channel: this._tchannel.makeSubChannel({
          serviceName: 'ringpop'
        , trace:false
        })
    });
    this._ring.setupChannel();
  }

  join(seeds = seed, cb){
    this._tchannel.listen( port, host, ()=> {
      debug('tchannel listening on ', host, port);

      this._ring.bootstrap(conf.get( 'seed' ), ( err ) => {
        if( err ) return cb(err)
        
        debug( 'ring bootstraped', conf.get( 'seed' ) );
        cb(null)
      });
    });
  } 

  leave(cb){
    this._ring.selfEvict((err)=>{
      if( err ) return cb( err );
      this._ring.destroy();
      cb();
    })
  }

  handle(cb) {
    return this._ring.on('request', cb)
  }
}

module.exports = Node;
