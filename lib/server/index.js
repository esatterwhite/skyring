/*jshint laxcomma: true, smarttabs: true, node: true, esnext: true*/
'use strict';
/**
 * Primary server instance for a skyring app. 
 * @module skyring/lib/server
 * @author Eric Satterwhite
 * @since 1.0.0
 * @requires http
 * @requires debug
 * @requires skyring/lib/server/mock
 * @requires skyring/lib/server/node
 * @requires skyring/lib/server/router
 * @requires skyring/lib/timer
 */

const http   = require('http')
    , Debug  = require('debug')
    , mock   = require('./mock')
    , Node   = require('./node')
    , Router = exports.Router = require('./router')
    , timer  = require('../timer')
    , debug  = Debug('skyring:server')
    ;

/**
 * Description
 * @constructor
 * @extends http.Server
 * @alias module:skyring/lib/server
 * @param {Object} [options]
 * @param {module:skyring/lib/server/node} [options.node] A customer node instance
 * @example var server = new Server({})
server.load().listen(5000)
 */
class Server extends http.Server {
  constructor( opts={} ){
    super((req, res) => {
      this._router.handle(req, res)
    });
    this.closed = false;
    this.options = Object.assign({}, {
      seeds: null
    }, opts)
    this.loaded = false;
    if( opts.node ){
      this._node = opts.node instanceof Node 
        ? opts.node 
        : new Node(
            opts.node.host,
            opts.node.port,
            opts.node.name,
            opts.node.app
          );
    } else {
      this._node = new Node() 
    }
    
    this._router = new Router(this._node);
    this._node.on('ringchange', (evt) => {
      timer.rebalance(evt, this._node, (data) => {
        this.proxy(data);
      });
    });
  }

  /**
   * loads application routes if not already loaded
   * @method module:skyring/lib/server#load 
   * @return {module:skyring/lib/server}
   **/
  load() {
    if( this.loaded ) return this;

    const routes = require('./api')
    Object.keys(routes)
          .forEach((name) => {
            const item = routes[name];
            const route = this._router.route(
              item.path
            , item.method
            , item.handler
            );

            item.middleware && route.before( item.middleware );
          })

    return this;
  }

  /**
   * Joins the node to the configured ring and starts the http server
   * @method module:skyring/lib/server#listen
   * @param {Number} port Port number to listen on
   * @param {String} [host=localhost] host or ip address to listen on 
   * @param {Number} [backlog]
   * @param {Function} [callback] Callback function to call when the server is running
   * @return {module:skyring/lib/server}
   **/
  listen(port, host, backlog, callback) {
    debug('seed nodes', this.options.seeds);
    this._node.join(this.options.seeds, (err) => {
      if (err) return callback(err)
      this._node.handle(( req, res ) => {
        this._router.handle( req, res );
      })
      timer.watch('skyring', (err, data) => {
        this.proxy(data)
      });
      super.listen(port, host, backlog, callback)
    })
    return this;
  }

  proxy(data){
    debug('fabricating request', data)
    const opts = {
      url: '/timer'
    , method: 'POST'
    , headers: {
        "x-timer-id": data.id
      }
    , payload: JSON.stringify(data)
    }
    const res = new mock.Response();
    const req = new mock.Request( opts );
    this._router.handle( req, res );
  }
  /**
   * Removes a server from the ring, closes the http server and redistributes
   * any pending timers
   * @method module:skyring/lib/server#close
   * @param {Function} callback A callback to be called when the server is completely shut down
   **/
  close( cb ){
    if(this.closed) return cb && setImmediate(cb);
    super.close(()=>{
      this._node.close(() => {
        timer.shutdown(() => {
          debug('closing server')
          this.closed = true
          cb && cb()
        })
      })
    })
  }
}

module.exports = Server;
