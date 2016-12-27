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
  constructor( opts ){
    super((req, res) => {
      this._router.handle(req, res)
    });
    this.loaded = false;
    this._node = opts.node || new Node();
    this._router = new Router(this._node);
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
    this._node.join(null, (err) => {
      if (err) return callback(err)
      this._node.handle(( req, res ) => {
        this._router.handle( req, res );
      })
      timer.watch('skyring', (err, data) => {
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
      });
      super.listen(port, host, backlog, callback)
    })
    return this;
  }

  /**
   * Removes a server from the ring, closes the http server and redistributes
   * any pending timers
   * @method module:skyring/lib/server#close
   * @param {Function} callback A callback to be called when the server is completely shut down
   **/
  close( cb ){

    super.close(()=>{
      this._node.close(() => {
        timer.shutdown(() => {
          debug('closing server')
          cb && cb()
        })
      })
    })
  }
}

module.exports = Server;
