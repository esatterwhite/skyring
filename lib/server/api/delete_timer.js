'use strict';

module.exports = {
  path: '/timer/:timer_id'
, method: 'DELETE'
, middleware: [
    require('./middleware/timer_id')
  , require('./middleware/proxy')
  ]
, handler: (req, res, node, cb) => {
    const id = req.$.params.timer_id;
    req.$.timers.cancel(id, (err) => {
      if( err ) {
        switch(err.code) {
          case 'ENOENT':
            res.$.status(404);
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
};

/**
 * @apiDescription Deletes a Timer by id from the ring. 
 * A request can be issued to any server in the ring.
 * @apiGroup timer
 * @apiName delete_timer
 * @api {delete} /timer/:id Delete a timer
 * @apiParam {UUID} id  unique timer ID.
 * @apiParamExample {text} Example id:
 * '8c66a779-9c74-4e30-b5e8-f32d60909d45'
 * @apiVersion 1.0.0
 * @apiExample {curl} curl:
 *  curl -XDELETE -H "Content-Type: application/json" http://localhost:3000/timer/8c66a779-9c74-4e30-b5e8-f32d60909d45
 *  @apiExample {js} Node.js:
 *  const http = require('http')
 *  const req = http.request({
 *    hostname: 'localhost',
 *    port: 3000,
 *    path: '/timer/8c66a779-9c74-4e30-b5e8-f32d60909d45',
 *    method: 'DELETE',
 *    headers: {
 *      'Content-Type': 'application/json',
 *    }
 *  }, (res) => {
 *    res.on('end', () => {
 *      // done
 *    });
 *  })
 *  req.end();
 * @apiExample {python} python:
 * import json
 * from urllib.request import Request, urlopen
 * req = Request(url='http://localhost:3000/timer/8c66a779-9c74-4e30-b5e8-f32d60909d45', method='DELETE')
 * res = urlopen(req)
 * print(res.status)
 * @apiExample {ruby} ruby:
 * require 'json'
 * require 'net/http'
 * require 'uri'
 *
 * uri = URI.parse('http://localhost:3003/timer/8c66a779-9c74-4e30-b5e8-f32d60909d45')
 *
 * http = Net::HTTP.new(uri.host, uri.port)
 * request = Net::HTTP::Delete.new(uri.request_uri, {'Content-Type': 'application/json'})
 * response = http.request(request)
 * print response.code
 **/
