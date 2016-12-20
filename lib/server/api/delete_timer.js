'use strict'
const timer = require('../../timer')

module.exports = {
  path: '/timer/:timer_id'
, method: 'DELETE'
, middleware: [
    require('./middleware/timer_id')
  , require('./middleware/proxy')
  ]
, handler: (req, res, node, cb) => {
    const id = req.$.params.timer_id;
    timer.delete(id, (err) => {
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

/**
 * @apiDescription Deletes a timer
 * @apiGroup timer
 * @apiName delete_timer
 * @api {delete} /timer/:id Delete a timer
 * @apiParam {Number} id Users unique ID.
 * @apiVersion 1.0.0 
 * @apiExample {curl} curl:
 *  curl -XDELETE -H "Content-Type: application/json" http://localhost:3000/timer/8c66a779-9c74-4e30-b5e8-f32d60909d45  
 *  @apiExample {js} Node.js:
 *  const http = require('http')
 *  const options = {
 *     hostname: 'localhost',
 *     port: 3000,
 *     path: '/timer/8c66a779-9c74-4e30-b5e8-f32d60909d45',
 *     method: 'DELETE',
 *     headers: {
 *       'Content-Type': 'application/json',
 *     }
 *   };
 *  const req = http.request(options, (res) => {
 *    res.on('end', () => {
 *      // done
 *    });
 *  })
 *  req.end();
 **/