'use strict';

module.exports = function timer_id(req, res, next){
  req.headers['x-timer-id'] = req.$.params.timer_id;
  next();
}

