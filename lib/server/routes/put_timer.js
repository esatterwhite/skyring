'use strict'
const timer = require('../../timer')

module.exports = {
  path: '/timer/:timer_id'
, method: 'PUT'
, middleware: [
    require('./middleware/timer_id')
  , require('./middleware/proxy')
  ]
, handler: (req, res, cb) => {
    const id = req.$.params.timer_id;
    timer.update(id, (err) => {
      if( err ) {
        switch(err.code) {
          case 'ENOENT':
            res.$.status(404);
            break;
          case 'ECONFLICT':
            res.$.status(409);
            break;
          default:
            res.$.status(500);
        }
        return cb();
      }

      res.$.status(202);
      cb();
    });
  }
}
