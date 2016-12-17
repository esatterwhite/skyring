'use strict';

const conf = require('keef')
    , http = require('http')
    , Node = require('./lib/ring')
		, Router = require('./lib/server')
    , debug = require('debug')('kronos')
    ;

const router = Router.load();
const node = new Node();
const server = http.createServer((req, res) => {
	router.handle( req, res );
});

module.exports = { server, node };

if( require.main === module ){
	server.listen(conf.get('PORT'));
  node.join(null, (err)=>{
    if(err) return console.log(err)
    node.handle((req, res) => {
      router.handle(req, res)
    });
  });
}

