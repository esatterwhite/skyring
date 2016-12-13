'use strict';
const joi        = require('joi')
    , cache      = require('./cache')
    , transports = require('./transports')
    ;

const schema = joi.object().keys({
  timeout  : joi.number().integer().min(1000).required()
, data     : joi.string().optional()
, callback : joi.object().keys({
    method    : joi.string().valid('post','put','patch').required()
  , transport : joi.string().valid('http','queue').required()
  , uri       : joi.string().required()
  }).required()
});

function post_list(req, res){
  const payload        = req.body && JSON.parse(req.body);
  const id             = req.headers['x-timer-id'];
  const {error, value} = schema.validate( payload );
  
  if(error){
    console.log(error);
    res.writeHead(400);
    return res.end();
  }

  const transport = transports[ value.callback.transport ];

  if( !transport ){
    res.writeHead(400);
    res.write('invalid transport');
    return res.end();
  }

  if( cache.has(id) ){
    res.writeHead(400);
    res.write('key exists');
    return res.end();
  }
  
  cache.set(
    id
	, setTimeout(
      transport
    , value.timeout
    , value.callback.method
    , value.callback.uri
    , value.data
    , id
    )
  );

  res.writeHead( 204,{
    location:`/timer/${req.headers['x-timer-id']}`
  });
  res.end();
}

function delete_detail(req, res){res.end();}

function put_detail(req, res){res.end();}

module.exports = { post_list, delete_detail, put_detail };
