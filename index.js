'use strict';

const conf = require('keef')
    , http = require('http')
    , handler = require('./lib/handler')
    , ring = require('./lib/ring')
    ;

const server = http.createServer( handler );

if( require.main === module ){
	server.listen(conf.get('PORT'))
}

module.exports = { server, ring };

