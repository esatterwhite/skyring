'use strict';
/**
 * Distributed timers as a service
 * Exports a default server instance. If executed directly, the server will be started automoaticall and configured to auto  rebalance on `SIGINT` and `SIGTERM`
 * @module skyring
 * @author Eric Satterwhite
 * @since 1.0.0
 * @requires http
 * @requires debug
 * @requires keef
 * @requires skyring/lib/server
 **/

const conf   = require('./conf')
    , Server = require('./lib/server')
    , debug  = require('debug')('skyring')
    ;

module.exports = Server;

if( require.main === module ){
  process.title = 'skyring';
  process.chdir(__dirname);

  const server = new Server();

  server.listen(conf.get('PORT'), (err) => {
    if(err) {
      process.exitCode = 1;
      console.error(err);
      throw err;
    }
    debug('server listening');
  });

  function onSignal() {
    server.close(()=>{
      debug('shutting down');
    });
  }
  process.once('SIGINT', onSignal);
  process.once('SIGTERM', onSignal);
}




/**
 * Configuration options for skyring. See {@link module:keef} on ways to pass configuration
 * @module skyring/conf
 * @author Eric Satterwhite
 * @since 1.0.0
 * @property {String|String[]} [seeds=127.0.0.1:3455,127.0.0.1:3456] A list of seed nodes to use for bootstrapping a ring cluster
 * @property {Object} channel
 * @property {String} [channel.host=127.0.0.1] hostname or ip addres for tchannel to listen on
 * @property {Number} [channel.port=3455] Port number for tchannel to bind to
 * @property {Number} [PORT=3000] The port number for the http API server to bind to
 * @property {Object} nats Nats queue specific configuration
 * @property {String|String[]} [nats.hosts=127.0.0.1:4222] host:port of instances of a nats cluster. One is usually enough.
 * @property {Object} [options.storage] Storage config options for level db
 * @property {String[]} [options.storage.backend=memdown] a requireable module name, or absolute path to a leveldb compatible backend
 * `leveldown` and `memdown` are installed by default
 * @property {String} options.storage.path A directory path to a leveldb instance. One will be created if it doesn't already exist.
 * @param {String[]|Function[]} [optsion.transport] an array of custom transport functions, or requireable paths that resolve to functions. All transport function must be named functions
 * If the backend is memdown, this is optional and randomly generated per timer instance
 **/
