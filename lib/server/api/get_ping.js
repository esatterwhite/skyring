'use strict';

module.exports = {
  path: '/ping'
, method: 'GET'
, handler: (req, res, node, cb) => {
    res.$.status(200);
    setImmediate(cb, null);
  }
};

/**
 * @apiDescription returns a 200 status if the server is up
 * @apiGroup ping
 * @apiName get_ping
 * @api {get} /ping
 * @apiVersion 8.0.0
 * @apiExample {curl} curl:
 *  curl -i -XGET http://localhost:3000/ping
 * @apiExample {js} Node.js:
 *  const http = require('http')
 *  http.get('http://localhost:3000/ping, (err, res) => {
 *    console.log(res.statusCode);
 *  })
 **/
