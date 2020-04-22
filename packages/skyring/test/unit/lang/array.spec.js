'use strict'

const {test, threw} = require('tap')
const toArray = require('../../../lib/lang/array/to-array.js')

test('array', async (t) => {
  t.test('toArray', async (tt) => {
    const cases = [
      {value: undefined, expected: [], message: 'toArray(undefined) == []'}
    , {value: null, expected: [], message: 'toArray(null) == []'}
    , {value: '', expected: [], message: 'toArray(\'\') == []'}
    , {value: 'test', expected: ['test'], message: 'toArray(\'test\')== [\'test\']'}
    , {value: 1, expected: [1], message: 'toArray(\'test\')== [1]'}
    , {value: '1,2, 3', expected: ['1', '2', '3']}
    , {value: [1, 2, 3], expected: [1, 2, 3]}
    , {value: new Set([1, null, 'test']), expected: [1, null, 'test']}
    ]

    for (const current of cases) {
      tt.deepEqual(
        toArray(current.value)
      , current.expected
      , current.message || `toArray(${current.value}) == ${current.expected}`
      )
    }
  })
}).catch(threw)
