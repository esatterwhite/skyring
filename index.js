'use strict';

const conf = require('keef')
    , http = require('http')
    , ring = require('./lib/ring')
		, Router = require('./lib/server')
    , debug = require('debug')('kronos')
    ;

const router = Router.load();
const server = http.createServer((req, res) => {
	router.handle( req, res );
});

if( require.main === module ){
	server.listen(conf.get('PORT'));
}

ring.on('request', (req, res) => {
  router.handle(req, res)
});
module.exports = { server, ring };

