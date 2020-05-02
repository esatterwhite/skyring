#! /usr/bin/env node
'use strict'
process.title = 'skyring'
const path = require('path')
process.chdir(path.join(__dirname, '..'))
const seeli = require('seeli')

seeli.set({
  color: 'red'
, exitOnContent: false
, exitOnError: true
})

const commands = require('./commands')

for (var [name, command] of commands.entries()) {
  seeli.use(name, command)
}

seeli.run()
