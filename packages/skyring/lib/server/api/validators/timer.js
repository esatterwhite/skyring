'use strict';

const type_exp = /^\[object (.*)\]$/;
const transports = require('../../../transports');

function typeOf(obj) {
  if (obj === null) return 'Null';
  if (obj === undefined) return 'Undefined';
  return type_exp.exec( Object.prototype.toString.call(obj) )[1];
}

// 2^32 - 1
const MAX_TIMEOUT_VALUE = 2147483647;

module.exports = function(data = {}, cb) {
  if (isNaN(data.timeout) || data.timeout < 1) {
    const err = new TypeError('timeout is required and must be a positive number');
    err.statusCode = 400;
    return setImmediate(cb, err);
  }

  if (data.timeout > MAX_TIMEOUT_VALUE) {
    const err = new TypeError(`timeout must be less than or equal to 2147483647 milliseconds`);
    err.statusCode = 400;
    return setImmediate(cb, err);
  }

  if (data.data) {
    const type = typeOf(data.data);
    if (type !== 'String' && type !== 'Object') {
      const err = new TypeError('data is required and must be a string or object');
      err.statusCode = 400;
      return setImmediate(cb, err);
    }
  }

  if (typeOf(data.callback) !== 'Object') {
    const err = new TypeError('callback is required and must be an object');
    err.statusCode = 400;
    return setImmediate(cb, err);
  }

  if (typeOf(data.callback.transport) !== 'String') {
    const err = new TypeError('callback.transport is required and must be a string');
    err.statusCode = 400;
    return setImmediate(cb, err);
  }

  if (typeOf(data.callback.uri) !== 'String') {
    const err = new TypeError('callback.uri is required and must be a string');
    err.statusCode = 400;
    return setImmediate(cb, err);
  }

  if (typeOf(data.callback.method) !== 'String') {
    const err = new TypeError('callback.method is required and must be a string');
    err.statusCode = 400;
    return setImmediate(cb, err);
  }
  setImmediate(cb, null, data);
};
