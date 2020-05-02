'use strict'

module.exports = {
  path: '/timer/:timer_id'
, method: 'PUT'
, middleware: [
    require('./middleware/timer_id')
  , require('./middleware/proxy')
  , require('./middleware/validate')
  ]
, handler: (req, res, node, cb) => {
    const id = req.$.params.timer_id
    req.$.timers.update(id, req.$.body, (err) => {
      if (err) {
        switch (err.code) {
          case 'ENOENT':
            res.$.status(404)
            break
          default:
            res.$.status(500)
        }
        return cb()
      }

      res.$.status(200)
      cb()
    })
  }
}

/**
 * @apiDescription Update a new time on the cluster
 * @apiGroup timer
 * @apiName put_timer
 * @api {put} /timer/:id Update a new timer in place
 * @apiVersion 1.0.0
 * @apiParam {Number} timeout the time in milliseconds from now the timer should execute. This must be in the range: 0 < timeout < 2^31 - 1.
 * @apiParam {String} data a data payload to include with the timer when it executes
 * @apiParam {Object} callback
 * @apiParam {String} callback.transport The delivery transport to use when executing the timer
 * @apiParam {String} callback.method The method of delivery the tranport should use
 * @apiParam {String} callback.uri A full uri the transport should send data to
 * @apiHeader (Response Headers) {String} location URI of the created timer which can be used to modify or cancel the timer
 * @apiHeader (Response Headers) {String} [x-skyring-reason] An err message if an error occured
 * @apiExample {curl} curl:
 *  curl -XPUT -H "Content-Type: application/json" http://localhost:3000/timer/8c66a779-9c74-4e30-b5e8-f32d60909d45  -d '{
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
 *     path: '/timer/8c66a779-9c74-4e30-b5e8-f32d60909d45',
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
 * from urllib.request import Request, urlopen
 * data = {
 *   'timeout': 5000
 * , 'data': {'foo':'bar'}
 * , 'callback': {
 *      'transport': 'http'
 *    , 'method': 'post'
 *    , 'uri': 'http://mydomain.name/timer/callback'
 *    }
 * }
 * req = Request(url='http://localhost:3000/timer/8c66a779-9c74-4e30-b5e8-f32d60909d45', data=bytes(json.dumps(data),'ascii'), method='PUT')
 * res = urlopen(req)
 * print(res.status)
 * print(res.headers['location'])
 * @apiExample {ruby} ruby:
 *
 * require 'json'
 * require 'net/http'
 * require 'uri'
 *
 * uri = URI.parse('http://localhost:3003/timer/8c66a779-9c74-4e30-b5e8-f32d60909d45')
 * payload = {
 *  timeout: 3000,
 *  data: "hello world",
 *  callback: {
 *    method: 'post',
 *    transport: 'http',
 *    uri: 'http://localhost:4000'
 *  }
 * }
 *
 * http = Net::HTTP.new(uri.host, uri.port)
 * request = Net::HTTP::Put.new(uri.request_uri, {'Content-Type': 'application/json'})
 * request.body = payload.to_json
 * response = http.request(request)
 * print response.code
 **/
