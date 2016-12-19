'use strict';

const pathToRegExp = require('path-to-regexp');

function Route(path, method) {
  this.path = path;
  this.method = method;
  this._keys = [];
  this.stack = [];
  this.regexp = pathToRegExp(path, this._keys);
  this.keys = new Array(this._keys.length);
  this.params = Object.create(null);

  for( var idx = 0; idx < this._keys.length; idx++ ) {
    this.keys[ idx ] = this._keys[ idx ].name;
    this.params[ this._keys[ idx ].name ] = undefined;
  }
}

Route.prototype.use = function use( fn ) {
  if( Array.isArray( fn ) ) {
    this.stack.push( ...fn );
  } else {
    this.stack.push( fn );
  }
  
  return this;
};

Route.prototype.before = function before( fn ) {
	const fns = Array.from( fn );
	this.stack.unshift( ...fns );
	return this;
}

Route.prototype.match = function match( path ) {
  const matches = this.regexp.exec( path );
  if ( !matches ) return null;

  const keys = this.keys;
  const params = Object.assign({}, this.params);

  for( var idx = 1; idx < matches.length; idx++ ) {
    params[ keys[ idx - 1 ] ] = matches[ idx ];
  }

  return params;
};

Route.prototype.process = function process( req, res, node, next ) {
  const stack = this.stack;

  ;(function run( idx ) {
    const fn = stack[ idx];
    try {
      fn(req, res, node, (err, out) => {
         if ( err ) return next( err );
         if( idx === stack.length -1 ) return next();
         run(++idx);
      });
    } catch ( err ){
      err.statusCode = err.statusCode || 500;
      return next( err );
    }
  })(0);
}

module.exports = Route;
