'use strict';

const http = require('http');
const Debug = require('debug')
const mock = require('./mock')
const Node = require('./node');
const Router = exports.Router = require('./router');
const timer = require('../timer');
const debug = Debug('skyring:server')

class Server extends http.Server {
  constructor( opts, node ){
    super((req, res) => {
      this._router.handle(req, res)
    });
    this.loaded = false;
    this._node = node || new Node();
    this._router = new Router(this._node);
  }

  load(){
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

  listen(port, host, backlog, callback) {
    this._node.join(null, (err) => {
      this._node.handle(( req, res) => {
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

  close( cb ){
    timer.shutdown(() => {
      this._node.close(() => {
        super.close(cb)
      })
    })
  }
}

module.exports = Server;
