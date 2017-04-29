/*jshint laxcomma: true, smarttabs: true, node: true, esnext: true*/
'use strict';
/**
 * Primary server instance for a skyring app.
 * @module skyring/lib/server
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
    , Router = require('./router')
    , Timer  = require('../timer')
    , debug  = Debug('skyring:server')
    ;

/**
 * @constructor
 * @extends http.Server
 * @alias module:skyring/lib/server
 * @author Eric Satterwhite
 * @since 1.0.0
 * @param {Object} [options]
 * @param {module:skyring/lib/server/node} [options.node] A customer node instance
 * @param {String} [optiopns.node.host] host name for the node to listen on - 127.0.0.1 must be used for localhost ( not 0.0.0.0 )
 * @param {Number} [options.node.port] Port number for the node to listen on in the ring
 * @param {String} [options.node.app=timers] name of the active ring to join
 * @param {Object} [options.nats]
 * @param {String[]} [options.nats.servers] An array of nats `host:port` addresses to connect to
 * @example
// Use only configuration values
var server = new Server().load().listen(5000)
 * @example var server = new Server({
  node :{
    host: 172.17.0.9
  , port: 8456
  , app: 'payback'
  }
, nats: {
    servers: ['nats1.domain.com:4222', 'nats2.domain.com:4222']
  }
})
server.load().listen(5000)
 * @example // Use a custom node instance
var node = new Node({
    host: 172.17.0.9
  , port: 8456
  , app: 'payback'
})
var server = new Server({ node })
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
    , nats: null
    , storage: null
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
    this._group = this._node.name
    this._timers = new Timer({ nats: this.options.nats, storage: this.options.storage });
    this._router = new Router(this._node, this._timers);
    this._node.on('ringchange', (evt) => {
      this._timers.rebalance(evt, this._node, (data) => {
        this.proxy(data);
      });
    });
    this._node.on('bootstrap', (seeds) => {
      this.emit('bootstrap', seeds);
    })
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
      if (err) {
        console.error(err)
        return callback && callback(err)
      }
      this._node.handle(( req, res ) => {
        this._router.handle( req, res );
      })
      this._timers.watch(`skyring:${this._group}`, (err, data) => {
        this.proxy(data)
      });
      super.listen(port, host, backlog, callback)
    })
    return this;
  }

  proxy(data) {
    debug('fabricating request', data.id)
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
    super.close(() => {
      this._node.close(() => {
        this._timers.shutdown(() => {
          debug('closing server')
          this.closed = true
          cb && cb()
        })
      })
    })
  }
}

module.exports = Server;
module.exports.Router = Router;
