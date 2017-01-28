'use strict'

const commands = new Map();
commands.set('run', require('./run'))
commands.set('peers', require('./peers'))
module.exports = commands;

