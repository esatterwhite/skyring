'use strict'

const {test, threw} = require('tap')
const slugify = require('../lib/lang/string/slugify')

test('string#sligify', async (t) => {
  t.equal(slugify(), '')
  t.equal(slugify('foo.bar test'), 'foobar_test')
}).catch(threw)
