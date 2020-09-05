'use strict'

const path = require('path')
const pino = require('pino')
const conf = require('../conf')
const opts = conf.get('log')
const ROOT = conf.get('PROJECT_ROOT')
const LOG_PRETTY = opts.pretty

const PRETTY_OPTS = {
  colorize: true
, levelFirst: true
, translateTime: true
, errorProps: 'code,meta'
, errorLikeObjectKeys: 'er,err,error'
}
module.exports = pino({
  name: 'skyring'
, level: opts.level
, prettyPrint: LOG_PRETTY ? PRETTY_OPTS : false
, formatters: {
    level(label) {
      return {level: label}
    }
  , bindings(values) {
      return {name: values.name}
    }
  }
})

module.exports.namespace = (dir, file) => {
  const rel = path.relative(ROOT, dir).replace('lib', '')
  const root = [`skyring${rel.replace(path.sep, ':')}`]
  const sub = `${path.parse(file).name}`.trim()
  if (sub) root.push(sub)
  return root.join(':')
}
