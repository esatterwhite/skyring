'use strict'

const {test, threw} = require('tap')
const json = require('../../lib/json')

test('json', async (t) => {
  t.match(json.parse(), {
    error: null
  , value: {}
  }, 'parse undefined')

  t.match(json.parse({}), {
    error: Error
  , value: null
  })
}).catch(threw)
