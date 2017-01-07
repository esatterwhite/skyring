/*jshint laxcomma: true, smarttabs: true, node: true, esnext: true*/
'use strict';
/**
 * Simple router class for directing requests
 * @module skyring/lib/server/router
 * @author Eric Satterwhite
 * @since 1.0.0
 * @requires skyring/lib/server/route
 * @requires skyring/lib/server/request
 * @requires skyring/lib/server/response
 */

const Route    = require('./route')
    , Request  = require('./request')
    , Response = require('./response')
    ;

/**
 * @constructor
 * @alias module:skyring/lib/server/router
 * @param {module:skyring/lib/server/node} node The node linked to the application hashring to pass with each request
 * @param {module:skyring/lib/timers} timers A timer instance associated with the application hashring to pass with each request
 * @example var x = new Router(node, timers)
router.handle(req, res)
 */
function Router( node, timers ) {
  this.routes        = new Map();
  this.route_options = new Map();
  this.node          = node;
  this.timers        = timers
};

/**
 * Adds a new get handler to the router a new get handler to the router
 * @param {String} path The url path to route on
 * @param {Function} handler The handler function to call when the route is matched
 **/
Router.prototype.get = function get( path, fn ) {
  this.route( path, 'GET', fn );
};

/**
 * Adds a new put handler to the router
 * @param {String} path The url path to route on
 * @param {Function} handler The handler function to call when the route is matched
 **/
Router.prototype.put = function put( path, fn ) {
  this.route( path, 'PUT', fn);
};

/**
 * Adds a new post handler to the router
 * @param {String} path The url path to route on
 * @param {Function} handler The handler function to call when the route is matched
 **/
Router.prototype.post = function post( path, fn ) {
  this.route( path, 'POST', fn);
};

/**
 * Adds a new patch handler to the router
 * @param {String} path The url path to route on
 * @param {Function} handler The handler function to call when the route is matched
 **/
Router.prototype.patch = function patch( path, fn ) {
  this.route( path, 'PATCH', fn);
};

/**
 * Adds a new delete handler to the router
 * @param {String} path The url path to route on
 * @param {Function} handler The handler function to call when the route is matched
 **/
Router.prototype.delete = function( path, fn ) {
  this.route( path, 'DELETE', fn );
};

/**
 * Adds a new opts handler to the router
 * @param {String} path The url path to route on
 * @param {Function} handler The handler function to call when the route is matched
 **/
Router.prototype.options = function options( path, fn ) {
  this.route( path, 'OPTIONS', fn );
};

/**
 * Adds a new route handler to the router
 * @param {String} path The url path to route on
 * @param {String} m handlerethod The http method to associate to the route
 * @param {Function} The handler function to call when the route is matched
 **/
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

/**
 * Entrypoint for an incoming request 
 * Customer properties are attached to an `$` object on the request rather than the request
 * itself to avoid V8 deopts / perf penalties
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @example
http.createServer((req, res) => {
  router.handle(req, res)
})
 **/
Router.prototype.handle = function handle( req, res ) {
  req.$ = new Request( req );
  res.$ = new Response( res );
  req.$.timers = this.timers;
  
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

/**
 * Responsible for executing the middleware stack on the route ( including the end handler )
 * @param {module:skyring/lib/server/route} route
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 **/
Router.prototype.handleRoute = function handleRoute( route, req, res ) {
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

