'use strict';
const body   = require('body')
    , uuid   = require('uuid')
    , boom   = require('boom')
    , ring   = require('./ring')
    , router = require('./router')
    ;

module.exports = function handler(req, res){
	const method = req.method.toLowerCase();
	const route = router.route( method, req.url );

	if(route.isBoom) {
		res.writeHead(
			route.output.statusCode,
			Object.assign(route.output.headers, {'Content-Type':'application/json'})
		);
		res.write(JSON.stringify( route.output.payload ) );
		return res.end();
	}
	const timer_id = route.params.timer_id || uuid.v4();
	req.headers['x-timer-id'] = timer_id;
	let cb = router.cache.get( `${method}:${route.route}` );

	if(!cb){
		const err = boom.notFound();
		res.writeHead(
			err.output.statusCode,
			Object.assign(err.output.headers, {'Content-Type':'application/json'})
		);
		res.write(JSON.stringify( err.output.payload ) );
		return res.end();
	}
	const handle = ring.handleOrProxy(timer_id, req, res);
	if(!handle) return;
	
	body(req, res,{}, onBody);
	
	function onBody(err, data){
		if( err ) return res.end();
		req.body = data;
		req.params = route.params;
		return cb( req, res );
	}
};
