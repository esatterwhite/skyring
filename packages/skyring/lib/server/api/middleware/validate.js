'use strict';

const validate = require('../validators/timer');

module.exports = function validatePayload( req, res, node, next ) {
  validate(req.$.body || undefined, next);
};
