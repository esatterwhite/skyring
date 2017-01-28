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
process.title = 'skyring';
process.chdir(__dirname);

const http   = require('http')
    , conf   = require('keef')
    , Server = require('./lib/server')
    , debug  = require('debug')('skyring')
    ;

const server = new Server();

module.exports =  server;

if( require.main === module ){
  server.load().listen(conf.get('PORT'),null, null, (err) => {
    if(err) return console.log(err) || process.exit(1)
    debug('server listening')
  });
}


function onSignal() {
  server.close(()=>{
    debug('shutting down')
    process.statusCode = 0
  })
}

process.once('SIGINT', onSignal);
process.once('SIGTERM', onSignal);
