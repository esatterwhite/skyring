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
 * @api {get} /ping check if service is running
 * @apiVersion 8.0.0
 * @apiExample {curl} curl:
 *  curl -i -XGET http://localhost:3000/ping
 * @apiExample {js} Node.js:
 *  const http = require('http')
 *  http.get('http://localhost:3000/ping', (err, res) => {
 *    console.log(res.statusCode);
 *  })
 * @apiExample {python} python:
 * import json
 * from urllib.request import Request, urlopen
 * req = Request(url='http://localhost:3000/ping', method='GET')
 * res = urlopen(req)
 * print(res.status)
 * @apiHeaderExample {text} Headers Example:
 * HTTP/1.1 200 OK
 * Date: Fri, 23 Dec 2018 00:19:13 GMT
 * Connection: keep-alive
 * Content-Length: 0
 **/
