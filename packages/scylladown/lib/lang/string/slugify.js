'use strict'
const NON_ALPHA_NUM_RE = /[^\w\s-]+/g
const EXTRA_HYPHEN_RE = /[\-\s]+/g

module.exports = function slugify(str) {
  if (!str) return ''
  const clean = str
    .replace(NON_ALPHA_NUM_RE, '')
    .trim()
    .replace(EXTRA_HYPHEN_RE, '_')

  return clean.toLowerCase()
}

