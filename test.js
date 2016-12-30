var child_process = require('child_process')
  , fs = require('fs')
  , util = require("util")
  , production = (process.env.NODE_ENV === 'test')
  , html
  , reporter
  , coverage
  , mocha
  , env
  ;

env = Object.assign({}, process.env );
env.MOCHA_COLORS = 1;
reporter = process.stdout;
mocha = child_process.spawn("mocha", [
  "--recursive"
, '--reporter=spec'
, 'test/'
],{env:env})
mocha.on('exit', function( code ){
    process.exit( code );
})
mocha.stdout.pipe( reporter );
mocha.stderr.pipe( reporter );
