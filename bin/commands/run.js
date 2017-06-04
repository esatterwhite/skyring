'use string';

const child = require('child_process')
    , path = require('path')
    , os   = require('os')
    , seeli = require('seeli')
    , conf  = require('keef')
    , Skyring = require('../../lib')
    , path_regex = /^(.+)\:(.+)$/

function namespace(obj, path){
  if (!path) return obj;
  const keys = path.split(':')
  for( var idx = 0; idx < keys.length; idx++ ) {
    const key = keys[idx];
    if (!obj[key]) {
      obj[key] = Object.create(null);
    }
    obj = obj[key];
  };
  return obj;
}

function set (obj, key, val) {
  var parts = path_regex.exec(key);
  if (parts){
    namespace(obj, parts[1])[parts[2]] = val;
  } else {
    obj[key] = val;
  }
}

module.exports = new seeli.Command({
  description: 'Run a new skyring instance'
, usage: [
    `${seeli.bold('Usage:')} skyring run -p 3000 -s localhost:5522 -s localhost:5523 --channel:port=5522`
  , `${seeli.bold('Usage:')} skyring run -d -p 3001 -s localhost:5522 -s localhost:5523 --channel:port=5523`
  , `${seeli.bold('Usage:')} skyring run --no-daemon -p 3000 -s localhost:5522 -s localhost:5523 --channel:port=6213`
  , `${seeli.bold('Usage:')} skyring run --no-daemon -p 3000 -t @skyring/tcp-transport -t @skyring/zmq-transport`
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

, run: ( cmd, data, done ) => {
    const opts = {}
        , cwd = path.resolve(__dirname, '..', '..')
        ;

    for( var key in data ){
      if ( key === 'argv' ) continue;
      set(opts, key, data[key]);
    }

    if ( !opts.daemon ) {
      return new Skyring( opts ).load().listen(opts.port, null, null, (err) => {
        if(err) {
          console.log(err);
          process.exit(1);
        }
        console.log(seeli.bold('skyring listening'))
        done(null, String(process.pid));
      });
    }

    const args = [
      path.join(cwd, 'index.js')
    , `-p ${opts.port}`
    , `--seeds=${opts.seeds.join(',')}`
    , `--nats:hosts=${opts.nats.hosts}`
    , `--channel:host=${opts.channel.host}`
    , `--channel:port=${opts.channel.port}`
    ]
    const skyring = child.spawn(
      process.execPath
    , args
    , {
        stdio: 'ignore'
      , cwd: cwd
      , detatched: true
      }
    );

    skyring.unref();
    done(null, String(skyring.pid));
  }

})
