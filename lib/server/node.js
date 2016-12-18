'use strict';
const EventEmitter   = require('events').EventEmitter
    , dns            = require('dns')
    , Ringpop        = require('ringpop')
    , TChannel       = require('tchannel')
    , debug          = require('debug')('skyring:ring')
    , conf           = require('keef')
    , host           = conf.get('channel:host')
    , port           = ~~conf.get('channel:port')
    ;

let ring_seeds     = conf.get('seeds')
ring_seeds = !Array.isArray(ring_seeds) ? ring_seeds.split(',') : ring_seeds
function resolve( tasks, cb ){
  const results = [];
  
  ;(function next(){
    if(!tasks.length) return cb(null, results);
    const task = tasks.shift();
    let [h, p] = task.split(':');
    dns.lookup(h, (err, addr) => {
      if (err) return cb(err)
      results.push(`${addr}${p ? ':' + p : ''}`);
      next()
    })
  })()
}

class Node extends EventEmitter {
  constructor(h = host, p = port, name = 'ringpop', app = 'timers' ) {
    super()
    this._port = p;
    this._host = host;
    this._name = name;
    this._app  = app;
    this._tchannel = new TChannel();
    this._ring = null
  }

  join(seed_arr, cb){
    const nodes = seed_arr || ring_seeds
    if(!Array.isArray(nodes)) {
      const err = new TypeError('seeds must be and array')
      return cb(err)
    }

    let addrs = [this._host].concat(nodes);
    resolve(addrs, (err, seeds) => {
      if( err ) return cb( err );
      const host = seeds.shift();
      this._ring = new Ringpop({
          app: this._app
        , hostPort:`${host}:${this._port}`
        , channel: this._tchannel.makeSubChannel({
            serviceName: this._name
          , trace:false
          })
      });
      this._ring.setupChannel();
      this._tchannel.listen( this._port, host, ()=> {
        debug('tchannel listening on ', host, this._port);
        this._ring.bootstrap(seeds, ( er ) => {
          if( er ) return cb(er);
          debug( 'ring bootstraped', seeds);
          cb(null);
        });
      });

    })
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

  handleOrProxy(key, req, res) {
    return this._ring.handleOrProxy(key, req, res);
  }

  close( cb ) {
    debug('node close')
    this._ring.selfEvict(() => {
      debug('destroying ring');
      this._ring.once('destroyed',cb);
      this._ring.destroy();
    })
  }
}

module.exports = Node;
