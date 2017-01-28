/*jshint laxcomma: true, smarttabs: true, node: true, esnext: true*/
/**
 * Represents a participant in the Hashring
 * @module skyring/lib/server/node
 * @author Eric Satterwhite
 * @since 1.0.0
 * @requires events
 * @requires dns
 * @requires ringpop
 * @requires tchannel
 * @requires debug
 * @requires keef
 */

const EventEmitter   = require('events').EventEmitter
    , dns            = require('dns')
    , Ringpop        = require('ringpop')
    , TChannel       = require('tchannel')
    , debug          = require('debug')('skyring:ring')
    , conf           = require('keef')
    , host           = conf.get('channel:host')
    , port           = ~~conf.get('channel:port')
    ;

let ring_seeds = conf.get('seeds');
ring_seeds     = !Array.isArray(ring_seeds) ? ring_seeds.split(',') : ring_seeds;

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

/**
 * @constructor
 * @alias module:skyring/lib/server/node
 * @param {String} [host] host name for the node to listen on - 127.0.0.1 must be used for localhost ( not 0.0.0.0)
 * @param {Number} [port] Port number for the node to listen on in the ring
 * @param {String} [name='ringpop'] name of the active ring to join
 * @param {String} [app=timers] app name of the active ring
 */
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

  /**
   * Does the work of configuring tchannel and joining itself into a ringpop ring
   * @method module:skyring/lib/server/node#join
   * @param {String[]} [seeds] An array of node addresses to use as boot strapping nodes
   * @param {Function} callback Function to call when the node has completed the bootstrap process
   * @example node.join(['node-1:5555', '172.10.0.4:4563'], (err) => {
if (err) throw err
 })
   **/
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
      this._ring.on('ringChanged', ( evt ) => {
        const added = evt.added;
        if(!added.length) return;
        if(added.length === 1 && added.indexOf(`${host}:${this._port}`) !== -1) return;
        debug('node added', added)
        this.emit('ringchange', evt);
      })
      this._tchannel.listen( this._port, host, (er)=> {
        if(er) return cb(er)
        debug('tchannel listening on ', host, this._port);
        this._ring.bootstrap(seeds, ( er ) => {
          if( er ) return cb(er);
          debug( 'ring bootstraped', seeds);
          this.emit('bootstrap', seeds)
          cb(null);
        });
      });

    })
  } 

  /**
   * Removes itself from the active ring and destroys existing connections
   * @method module:skyring/lib/server/node#leave
   * @param {Function} callback Callback function to call when the eviction process is complete
   **/
  leave(cb){
    this._ring.selfEvict((err)=>{
      if( err ) return cb( err );
      this._tchannel.drain('leaving ring', () => {
        this._ring.destroy();
      })
      cb();
    })
  }

  /**
   * Adds a request handler to the active ringpop instance
   * @method module:skyring/lib/server/node#handle
   * @param {Function} handler A request handler for incoming requests from the ring
   **/
  handle(cb) {
    return this._ring.on('request', cb)
  }

  /**
   * Determines if this instance is responsible for a specific key. 
   * proxies the request if it is not
   * @method module:skyring/lib/server/node#handleOrProxy
   * @param {String} Key The key to use to do a node lookup in the ring
   * @param {http.IncomingMessage} req an http request object
   * @param {http.ServerResponse} res an http response object
   * @example const handle = node.handleOrProxy('foobar', req, res)
if (!handle) return;
// deal with request
   * @return {Boolean}
   **/
  handleOrProxy(key, req, res) {
    return this._ring.handleOrProxy(key, req, res);
  }

  /**
   * Determines if this node is responsible for a specific key
   * @method module:skyring/lib/server/node#owns
   * @param {String} key The key to use
   * @return {Boolean}
   **/
  owns( key ){
    return this._ring.lookup( key ) == this._ring.whoami()
  }

  /**
   * Lookup the address of the server responsible for a given key
   * @method module:skyring/lib/server/node#lookup
   * @param {String} key The key to look up
   * @return {String} A server address
   **/  
  lookup( key ) {
    return this._ring.lookup(key);
  }

  /**
   * Removes itself from the ring and closes and connections
   * @method module:skyring/lib/server/node#close
   * @param {Function} A callback function to call when the ring is closed
   **/  
  close( cb ) {
    debug('node close')
    this._ring.selfEvict(() => {
      debug('draining tchannel')
      this._tchannel.drain('leaving', () => {
        debug('destroying ring');
        this._ring.once('destroyed',()=>{
          setTimeout(cb, 100)
        });
        this._ring.destroy();
      })
    })
  }


}

Object.defineProperty(Node.prototype, 'name', {
  get: function() {
    return this._app;
  }
})
module.exports = Node;
