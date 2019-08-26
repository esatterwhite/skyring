
![skyring](https://github.com/esatterwhite/skyring/raw/master/assets/skyring.png)

[![Travis branch](https://img.shields.io/travis/esatterwhite/skyring/master.svg?style=flat-square)](skyring)
[![npm](https://img.shields.io/npm/v/skyring.svg?style=flat-square)](https://www.npmjs.com/package/skyring)
[![npm](https://img.shields.io/npm/l/skyring.svg?style=flat-square)](https://github.com/esatterwhite/skyring)
[![David](https://img.shields.io/david/esatterwhite/skyring.svg?style=flat-square)](https://david-dm.org/esatterwhite/skyring)
[![Code Climate](https://img.shields.io/codeclimate/maintainability/esatterwhite/skyring.svg?style=flat-square)](https://codeclimate.com/github/esatterwhite/skyring)
[![Docker Repository on Quay](https://quay.io/repository/esatterwhite/skyring/status "Docker Repository on Quay")](https://quay.io/repository/esatterwhite/skyring)

* [Module Docs](https://esatterwhite.github.io/skyring/)
* [API Docs](https://esatterwhite.github.io/skyring/api)

# Skyring
A distributed reliable timer service providing `setTimeout` functionality in a distributed fashion.
`Skyring` servers are clustered into a *hashring* using consistent hashing to partition timers to specific nodes in the ring.  Skyring exposes a simple HTTP API that allows to you create and cancel timers. Timer execution comes in to the form of an HTTP webhook ( more transports to come )

# Architecture Overview

<img src="https://raw.githubusercontent.com/esatterwhite/skyring/master/assets/skyring-arch.png" width="100%" max-width="800px">

# Install

```
npm install -s skyring
```

## Run A Local Cluster

### Start a nats instance
Download the [nats binary](https://github.com/nats-io/gnatsd/releases) and start it using the defaults

```bash
$ gnats -D -V
```

To verify that it is working, you can `telnet` directly to the server and ping it.

```bash
$ telnet localhost 4222
> ping
PONG
```

### Skyring CLI

If you intend to run skyring as is, it may be preferable to use the included binary over cloning the project.

```
npm install -g skyring

DEBUG=skyring:* skyring run -p 3000 -s localhost:3456 -s localhost:3455
```


### Using in your project

If you want to use the skyring directly, you can just require it and start it directly.
most of the available environment and cli arguments can be passed to the {@link module:skyring/lib/server|skyring constructor}.
If you don't pass anything to the construct the default values are {@link module:keef|loaded} from the appropriate sources

```javascript
// index.js
const Skyring = require('skyring')
const server = new Skyring()

function onSignal() {
  server.close(()=>{
    console.log('shutting down');
  });
}

server.listen(3000, (err) => {
  if (err) throw err
  console.log('skyring listening at %s', 'http://0.0.0.0:3000')
})

process.once('SIGINT', onSignal);
process.once('SIGTERM', onSignal);
```

This can then be started as a single node cluster
```
$ DEBUG=* node . --channel:port=3455 --seeds='localhost:3455'
```

The default settings expect a minimum of 2 servers on port `3455` and `3456` respectively. Start each server in a different terminal session
```bash
# Seed node 1
$ DEBUG=skyring:* node index.js --channel:port=3455 -p 3000
```

```bash
# Seed node 2
$ DEBUG=skyring:* node index.js --channel:port=3456 -p 3001
```

If all goes well you should see a message like this
```
skyring:ring ring bootstraped [ '127.0.0.1:3455', '127.0.0.1:3456' ] +1ms
```
Thats it, you have 2 instances running w/ HTTP servers running on ports `3000` and `3001`

#### Run via Docker Compose

The Easiest way to run a small cluster is to use the included [compose files](https://github.com/esatterwhite/skyring/blob/master/compose/dev.yml). It is also a good way to see how to quickly configure a cluster

- Install [Docker Compose](https://docs.docker.com/compose/install/)

```bash
$ npm start
```
That is it! You have a 5 node **Skyring** cluster with a 3 node `nats` cluster behind an `nginx` proxy listening on port `8080`

#### Run via Kubernetes Helm

To bootstrap to a kubernetes cluster simply go into the kubernetes folder and run
```
helm install ./skyring
```
The default values.yaml file will bootstrap a small cluster that should be suitable for most workloads.

# Timer API

A request can be issued to any active node in the cluster. If that node is not responsible for the timer in question,
it will forward the request directly to the node that is keeping network latency to a minimum. This makes `Skyring` very
suitable for high performance, stateless, and distributed environments.
The minimum _recommended_ cluster size is 3 nodes, 2 of which being seed or bootstrapping nodes. A cluster of this size can average
between 2K - 5K requests per second.

## Create a timer

##### **POST `/timer`**

**Request**

Since timers managed in `Skyring` are done so through the use of `setTimeout`, there is a maximum `timeout` value of `2^31 - 1` or
`2147483647` milliseconds, which is approximately `24.8` days. Attempting to request a timeout great than this value will result in a
`400 Bad Request` response. Additionally, the `timeout` must be greater than `0`.

```bash
curl -i -XPOST http://localhost:8080/timer -d '{
  "timeout": 6000,
  "data" : "{\"foo\":\"bar\"}",
  "callback": {
    "transport": "http",
    "method": "post",
    "uri": "http://api.someservice.com/hook/timeout"
  }
}'
```

**Response Headers**

For performance considerations, a body is not included in responses. Rather, HTTP headers are used to relay information about timer status.
In the case of a `Create` request, the uri to the timer instance is returned in the `Location` header.

```http
HTTP/1.1 201 CREATED
location: /timer/4adb026b-6ef3-44a8-af16-4d6be0343ecf
Date: Fri, 23 Dec 2016 00:19:13 GMT
Connection: keep-alive
Content-Length: 0
```

## Cancel A Timer

##### **DELETE `/timer/:id`**

**Request**

```bash
curl -i -XDELETE http://localhost:8080/timer/4adb026b-6ef3-44a8-af16-4d6be0343ecf
```
**Response Headers**

```http
HTTP/1.1 202 Accepted
Date: Fri, 23 Dec 2016 00:22:12 GMT
Connection: keep-alive
Content-Length: 0
```

# Crash Recovery

Each Skyring node uses an internal [levelup](https://www.npmjs.com/package/levelup) instance to record timers that it owns.
When a node starts, it will check the configured database for any existing timers, and will
immediately load them back into memory. By default, the [memdown](https://www.npmjs.com/package/memdown) backend is used, and wil not
persists between starts. To enable full persistence and recovery, you must configure skyring to use a 
persistent backend for `levelup`. [Leveldown](https://www.npmjs.com/package/leveldown) is installed by default.

```bash
skyring run --storage:backend=leveldown --storage:path='/var/data/skyring'
```

### Custom Storage

In situations when the local disk is not reliable enough, you can install and use any levelup backend to suite your needs.
If, for example you want to off load data storage to a [mongo](https://github.com/esatterwhite/skyring/tree/master/examples/mongo-storage)
or [scylladb](https://github.com/esatterwhite/skyring/tree/master/examples/scylla-storage) cluster, you would just include the backend package
as a dependency in your project and specify it by name as the storage package. Options for the backend can be passed via the `storage` attribute

```bash
npm install @skyring/scylladown
skyring run --storage:backend=@skyring/scylladown --storage:path=skyring-1 --storage:contactPoints=0.0.0.0:9042 --storage:contactPoints=0.0.0.0:9043
skyring run --storage:backend=@skyring/scylladown --storage:path=skyring-2 --storage:contactPoints=0.0.0.0:9042 --storage:contactPoints=0.0.0.0:9043
```

# Custom Transports

Skyring ships with a single HTTP transport, but support custom transports. A `transport` is a named function
that can be executed when a timer triggers. To register a transport, you can pass an array of named functions, or
module file paths to the skyring server constructor via via the {@link module:skyring/lib/transports|transports} option

Optionally, for transports that need to perform some clean up work, a function property `shutdown` may be defined
on the transport

```javascript
const path = require('path')
const Skyring = require('skyring')

function fizzbuz(method, uri, payload, id, timer_store) {
 // send payload to uri...
 timer_store.remove(id)
}

fuzzbuz.shutdown(cb) {
  // drain connections...
  // free up event loop
  cb()
}

const server = new Skyring({
  transports: [
    'my-transport-module'
  , fizzbuz
  , path.resolve(__dirname, '../transports/fake-transport')
  ]
})
```

The same can be achieved through CLI arguments or ENV vars via the `transport` key

```bash
transport=foobar,fizzbuz node index.js
```

```bash
node index --transport=foobar --transport=fizzbuz --transport=$PWD/../path/to/my-transport
```

