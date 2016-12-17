'use strict';

const conf = require('keef')
    , http = require('http')
    , Node = require('./lib/ring')
		, Server = require('./lib/server')
    , debug = require('debug')('kronos')
    ;

const server = new Server();
module.exports = {server};

if( require.main === module ){
	server.load().listen(conf.get('PORT'),null, null, (err) => {
    if(err) return console.log(err) || process.exit(1)
  });
}

