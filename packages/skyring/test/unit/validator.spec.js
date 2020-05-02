'use strict'

const {test} = require('tap')
const validator = require('../../lib/server/api/validators/timer')
const {testCase} = require('../../../../test')

test('timer payload validation', async (t) => {
  testCase(t, {
    code: '400'
  , description: 'timeout must be a number'
  }, (tt) => {
    validator({
      timeout: null
    }, (err) => {
      tt.type(err, Error, 'error is of type Error')
      tt.match(err, {
        statusCode: 400
      , message: /timeout is required and must be a positive number/
      })
      tt.end()
    })
  })

  testCase(t, {
    code: '400'
  , description: 'timemout must be positive'
  }, (tt) => {
    validator({
      timeout: -1
    }, (err) => {
      tt.type(err, Error, 'error is of type Error')
      tt.match(err, {
        statusCode: 400
      , message: /timeout is required and must be a positive number/i
      })
      tt.end()
    })
  })

  testCase(t, {
    code: '400'
  , description: 'Exceeds maximum value'
  }, (tt) => {
    const MAX = Math.pow(2, 32 - 1) - 1
    validator({
      timeout: MAX + 1
    }, (err) => {
      tt.type(err, Error, 'error is of type Error')
      tt.match(err.statusCode, 400, 'error statusCode')
      tt.match(
        err.message
      , new RegExp(`less than or equal to ${MAX}`, 'ig')
      , 'error message pattern'
      )
      tt.end()
    })
  })

  testCase(t, {
    code: '400'
  , description: 'null value is not a valid data value'
  }, (tt) => {
    validator({
      timeout: 1
    , data: false
    }, (err) => {
      tt.type(err, Error, 'error is of type Error')
      tt.match(err.statusCode, 400, 'error statusCode')
      tt.match(err.message, /must be a string or object/ig, 'error message')
      tt.end()
    })
  })

  testCase(t, {
    code: '400'
  , description: 'callback must be an object'
  }, (tt) => {
    validator({
      timeout: 1
    , data: 'test'
    , callback: 1
    }, (err) => {
      tt.type(err, Error, 'error is of type Error')
      tt.match(err, {
        statusCode: 400
      , message: /callback is required and must be an object/i
      })
      tt.end()
    })
  })

  testCase(t, {
    code: '400'
  , description: 'callback.transport must be a string'
  }, (tt) => {
    validator({
      timeout: 1
    , data: 'test'
    , callback: {
        transport: {}
      }
    }, (err) => {
      tt.type(err, Error, 'error is of type Error')
      tt.match(err, {
        statusCode: 400
      , message: /callback.transport is required and must be a string/i
      })
      tt.end()
    })
  })

  testCase(t, {
    code: '400'
  , description: 'callback.uri must be a string'
  }, (tt) => {
    validator({
      timeout: 1
    , data: 'test'
    , callback: {
        transport: 'http'
      , uri: undefined
      }
    }, (err) => {
      tt.type(err, Error, 'error is of type Error')
      tt.match(err, {
        statusCode: 400
      , message: /callback.uri is required and must be a string/i
      })
      tt.end()
    })
  })

  testCase(t, {
    code: '400'
  , description: 'callback.method must be a string'
  }, (tt) => {
    validator({
      timeout: 1
    , data: 'test'
    , callback: {
        transport: 'http'
      , uri: '/test'
      , method: undefined
      }
    }, (err) => {
      tt.type(err, Error, 'error is of type Error')
      tt.match(err, {
        statusCode: 400
      , message: /callback.method is required and must be a string/i
      })
      tt.end()
    })
  })

  testCase(t, {
    code: '200'
  , description: 'callback.method must be a string'
  }, (tt) => {
    validator({
      timeout: 1
    , data: 'test'
    , callback: {
        transport: 'http'
      , uri: '/test'
      , method: 'post'
      }
    }, (err) => {
      tt.error(err)
      tt.end()
    })
  })
})
