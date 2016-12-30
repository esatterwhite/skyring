#! /usr/bin/env node
'use strict';
process.title = 'skyring'
const path = require('path')
process.chdir(path.join(__dirname, '..'))
const seeli = require('seeli')
    , commands = require('./commands')
    ;

for( var [name, command] of commands.entries() ) {
  seeli.use( name, command )
}

seeli.set('color', 'green');
seeli.run();
