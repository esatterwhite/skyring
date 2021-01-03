'use strict'
module.exports = {
  'root': true
, 'extends': 'eslint-config-codedependant'
, 'parserOptions': {
    ecmaVersion: 2019
  }
, 'ignorePatterns': [
    'node_modules/'
  , 'coverage/'
  ]
, 'rules': {
    'sensible/check-require': [2, 'always', {
      root: __dirname
    }]
  }
}
