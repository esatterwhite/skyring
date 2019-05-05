'use string';

const child = require('child_process')
    , path = require('path')
    , os   = require('os')
    , seeli = require('seeli')
    , conf  = require('keef')
    , Skyring = require('../../lib')
    , path_regex = /^(.+)\:(.+)$/

const name = seeli.colorize(seeli.get('name'))
const run = seeli.bold('run')

module.exports = new seeli.Command({
  description: 'Run a new skyring instance'
, ui: 'dots9'
, usage: [
    `${name} ${run} -p 3000 -s localhost:5522 -s localhost:5523 --channel:port=5522`
  , `${name} ${run} -d -p 3001 -s localhost:5522 -s localhost:5523 --channel:port=5523`
  , `${name} ${run} --no-daemon -p 3000 -s localhost:5522 -s localhost:5523 --channel:port=6213`
  , `${name} ${run} --no-daemon -p 3000 -t @skyring/tcp-transport -t @skyring/zmq-transport`
  ]
, flags: {
    seeds: {
      type: [String, Array]
    , shorthand: 's'
    , required: true
    , description: 'Nodes in the ring to use as seed nodes'
    }
  , transport: {
      type: [String, Array]
    , shorthand: 't'
    , description: 'Custom transports to load into the server at start up time'
    }

  , 'channel:host': {
      type: String
    , default: '127.0.0.1'
    , description: 'Host name or ip this node should bind on'
    }

  , 'channel:port': {
      type: Number
    , default: 3455
    , description: 'The port this node should bind on'
    }

  , 'storage:backend': {
      type: String
    , default: 'memdown'
    , description: 'A levelup compatible module for levelup. Must be requirable'
    }
  , 'storage:path': {
      type: String
    , description: 'A directory path where data can be stored. '
      + 'Required for persistent storage backends'
    }
  , port: {
      shorthand: 'p'
    , type: Number
    , default: 3000
    , description: 'The port the HTTP Server should listen on'
    }

  , daemon: {
      shorthand: 'd'
    , type: Boolean
    , default: false
    , description: 'Run the process in the background as a daemon'
    }
  , 'nats:hosts': {
      type: String
    , default: 'localhost:4222'
    , description: 'a comma seperated list of nats servers to connect to'
    }
  }

, run: function( cmd, data ) {
    const opts = {}
        , cwd = path.join(__dirname, '..', '..')
        ;

    if ( !data.daemon ) {
      return new Promise((resolve, reject) => {
         new Skyring( data ).listen(data.port, null, null, (err) => {

          if(err) {
            reject(err)
            process.exit(1);
          }
          resolve(
           `skyring process ${process.pid} listening on port ${conf.get('PORT')}`
          )
        });
      })
    }

    const env = Object.assign({}, process.env, {
      PORT: data.port
    , seeds: data.seeds.join(',')
    , nats__hosts: data.nats.hosts
    , channel__host: data.channel.host
    , channel__port: data.channel.port
    , storage__backend: data.storage.backend
    , storage__path: data.storage.path || ''
    })

    const skyring = child.spawn(
      process.execPath
    , [ path.join(cwd, 'index.js') ]
    , {
        stdio: 'ignore'
      , cwd: cwd
      , detatched: true
      , env: env
      }
    );

    skyring.unref();
    return Promise.resolve(String(skyring.pid))
  }

})
