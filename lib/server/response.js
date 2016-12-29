'use strict'

function Response( res ) {
  this.res = res
  this.body = null
};

Response.prototype.error = function error( err, msg ) {
  if(typeof err === 'number') {
    return this.status(err).json({
      message: msg 
    })
  }
  err.statusCode = err.statusCode || err.code;
  if( !err.statusCode ) {
    err.statusCode = 500;
    err.message = 'Internal Server Error';
  }
  
  this.status( err.statusCode );
  this.res.setHeader('x-skyring-reason', err.message)
  return this.end()
}

Response.prototype.get = function get( key ) {
  return this.res.getHeader(key);
};

Response.prototype.json = function json( body ) {
  this.res.setHeader('Content-Type', 'application/json');
  this.res.end(JSON.stringify(body));
  return this;
};

Response.prototype.set = function set( key, val ) {
  var value = Array.isArray(val) ? 
              val.map(String) : typeof val === 'string' ? val : String(val);

  this.res.setHeader(key, value);
  return this;
};

Response.prototype.status = function status( code ) {
  this.res.statusCode = code;
  return this;
};

Response.prototype.send = function send( str ) {
  this.res.write( str );
  return this;
}

Response.prototype.end = function end( str ) {
  this.res.end(str);
  return this;
};

module.exports = Response;
