'use strict';
const conf   = require('keef')
    , http   = require('http')
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
    setImmediate(process.exit)
  })
}

process.once('SIGINT', onSignal);
process.once('SIGTERM', onSignal);
