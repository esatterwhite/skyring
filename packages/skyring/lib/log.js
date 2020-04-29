'use strict'

const path = require('path')
const pino = require('pino')
const conf = require('../conf')
const opts = conf.get('log')
const ROOT = conf.get('PROJECT_ROOT')
const PRETTY_OPTS = {
  colorize: true
, translateTime: true
}
const LOG_PRETTY = opts.pretty
module.exports = pino({
  name: 'skyring'
, level: opts.level
, prettyPrint: LOG_PRETTY ? PRETTY_OPTS : false
})

module.exports.namespace = (dir, file) => {
  const rel = path.relative(ROOT, dir).replace('lib', '')
  const root = [`skyring${rel.replace(path.sep, ':')}`]
  const sub = `${path.parse(file).name}`.trim()
  if (sub) root.push(sub)
  return root.join(':')
}
