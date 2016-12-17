'use strict';

const Route    = require('./route')
    , Request  = require('./request')
    , Response = require('./response')
    ;


const CORS = ['Authorization', 'Content-Type'];

function Router( node, opts ) {
  this.options       = Object.assign({ corsHeaders: CORS }, opts);
  this.routes        = new Map();
  this.route_options = new Map();
  this.node          = node;
};

Router.prototype.get = function get( path, fn ) {
  this.route( path, 'GET', fn );
};

Router.prototype.put = function put( path, fn ) {
  this.route( path, 'PUT', fn);
};

Router.prototype.post = function post( path, fn ) {
  this.route( path, 'POST', fn);
};

Router.prototype.patch = function patch( path, fn ) {
  this.route( path, 'PATCH', fn);
};

Router.prototype.delete = function( path, fn ) {
  this.route( path, 'DELETE', fn );
};

Router.prototype.options = function options( path, fn ) {
  this.route( path, 'OPTIONS', fn );
};

Router.prototype.route = function route( path, method, fn ) {
  const _method = method.toUpperCase();
  const map = this.routes.get(_method) || new Map();

  if ( map.has( path ) ) {
    const route = map.get( path );
    route.use( fn );
    return route;
  }

  const route = new Route( path, _method);
  route.use( fn );
  map.set( path, route );
  this.routes.set( _method, map );
	return route;
};

Router.prototype.handle = function handle( req, res ) {
  req.$ = new Request( req );
  res.$ = new Response( res );
  const path = req.$.path;
  const method = req.method.toUpperCase();
  const map = this.routes.get( method );

  if( map ) {
    let rte = map.get( path );
    if ( rte ) {
      req.$.params = Object.create(null);
      return this.handleRoute( rte, req, res );
    }

    for ( const route of map.values() ){
      const params = route.match( path );
      if ( params ) {
        req.$.params = params;
        return this.handleRoute( route, req, res );
      }
    }
  }

  return notFound( req, res );
};

Router.prototype.handleRoute = function handleRoute( route, req, res ) {
  debugger;
  route.process(req, res, this.node, ( err ) => {
    if ( err ) return res.$.error( err );

    if ( res.$.body ) return res.$.json( res.$.body );

    return res.$.end();
  });
};

function notFound( req, res ) {
  res.writeHead(404,{
    'Content-Type': 'application/json'
  });
  res.end( JSON.stringify({message: 'Not Found' }) );
}

module.exports = Router;

