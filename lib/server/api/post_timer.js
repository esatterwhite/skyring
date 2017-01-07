'use strict';
const validate = require('./validators/timer');

module.exports = {
  path: '/timer'
, method: 'POST'
, middleware: [
    require('./middleware/proxy')
  , require('./middleware/validate')
  ]
, handler: (req, res, node, cb) => {
    const id = req.$.headers['x-timer-id'];
    req.$.timers.create(id, req.$.body, (err) => {
      if (err) return cb(err);
      res.$.set('location', `/timer/${id}`);
      res.$.status(201);
      cb();
    });
  }
}

/**
 * @apiDescription Create a new time on the cluster
 * @apiGroup timer
 * @apiName create_timer
 * @api {post} /timer Create a new timer
 * @apiVersion 1.0.0
 * @apiParam {Number} timeout the time in miliseconds before the timer executes
 * @apiParam {String} data a data payload to include with the timer when it executes
 * @apiParam {Object} callback
 * @apiParam {String} callback.transport The delivery transport to use when executing the timer
 * @apiParam {String} callback.method The method of delivery the tranport should use
 * @apiParam {String} callback.uri A full uri the transport should send data to
 * @apiHeader (Response Headers) {String} location URI of the created timer which can be used to modify or cancel the timer
 * @apiHeaderExample {text} Headers Example:
 * HTTP/1.1 201 CREATED
 * LOCATION: /timer/489ea3df-c583-4325-8fb0-0f1ec8301bd9
 * Date: Fri, 23 Dec 2016 00:19:13 GMT
 * Connection: keep-alive
 * Content-Length: 0
 * @apiParamExample {json} request:
 * {
 *  "timeout": 3000,
 *  "data": "Hello world",
 *  "callback": {
 *    "method": "put",
 *    "uri": "http://mydomain.name/timer/callback",
 *    "tranport":"http"
 *  } 
 * @apiExample {curl} curl:
 *  curl -XPOST -H "Content-Type: application/json" http://localhost:3000/timer  -d '{
 *  "timeout": 3000,
 *  "data": "{\"name\":\"Bill\"}",
 *  "callback": {
 *    "method": "post",
 *    "uri": "http://mydomain.name/timer/callback",
 *    "tranport":"http"
 *  }
 *  @apiExample {js} Node.js:
 *  const http = require('http')
 *  const data = JSON.stringify({
 *    timeout: 5000,
 *    data: {foo: 'bar', bar: 'baz'},
 *    callback: {
 *      transport: 'http',
 *      method: 'post',
 *      uri: 'http://mydomain.name/timer/callback
 *    }
 *  })
 *  const options = {
 *     hostname: 'localhost',
 *     port: 3000,
 *     path: '/timer',
 *     method: 'POST',
 *     headers: {
 *       'Content-Type': 'application/json',
 *       'Content-Length': Buffer.byteLength(data)
 *     }
 *   };
 *  const req = http.request(options, (res) => {
 *    let data = '';
 *    res.on('data', (chunk) => {
 *      data += chunk;
 *    });
 *
 *    res.on('end', () => {
 *      // done
 *    });
 *  })
 *  req.write(data);
 *  req.end();
 * @apiExample {python} python:
 * import json
 * from urlib.request import Request, urlopen
 * data = {
 *   'timeout': 5000
 * , 'data': {'foo':'bar'}
 * , 'callback': {
 *      'transport': 'http'
 *    , 'method': 'post'
 *    , 'uri': 'http://mydomain.name/timer/callback'
 *    }
 * }
 * req = Request(url='http://localhost:3000/timer', data=bytes(json.dumps(data),'ascii'), method='POST')
 * res = urlopen(req)
 * print(res.status)
 * print(res.headers['location'])
 **/
