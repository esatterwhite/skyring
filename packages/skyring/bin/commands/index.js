'use strict'

const commands = new Map()
commands.set('run', require('./run'))
module.exports = commands
