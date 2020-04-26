'use strict'

const CSV_SEP_EXP = /\s*,\s*/

module.exports = toArray
function toArray(item) {
  if (!item) return []
  if (item instanceof Set) return Array.from(item)
  if (Array.isArray(item)) return item
  return typeof item === 'string' ? item.split(CSV_SEP_EXP) : [item]
}
