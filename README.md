
![skyring](https://github.com/esatterwhite/skyring/raw/master/assets/skyring.png)

[![Travis](https://img.shields.io/travis/esatterwhite/skyring.svg?style=flat-square)](https://travis-ci.org/esatterwhite/skyring)
[![npm](https://img.shields.io/npm/v/skyring.svg?style=flat-square)](https://www.npmjs.com/package/skyring)
[![npm](https://img.shields.io/npm/l/skyring.svg?style=flat-square)](https://www.npmjs.com/package/skyring)
[![David](https://img.shields.io/david/esatterwhite/skyring.svg?style=flat-square)](https://david-dm.org/esatterwhite/skyring)
[![Code Climate](https://img.shields.io/codeclimate/github/esatterwhite/skyring.svg?style=flat-square)](https://codeclimate.com/github/esatterwhite/skyring)
[![Docker Repository on Quay](https://quay.io/repository/esatterwhite/skyring/status "Docker Repository on Quay")](https://quay.io/repository/esatterwhite/skyring)

* [Module Docs](https://esatterwhite.github.io/skyring/)
* [API Docs](https://esatterwhite.github.io/skyring/api)

# Skyring
A distributed reliable timer service providing similar functionality to using `setTimeout`.
`Skyring` servers are clustered  into a *hashring* using consistent hashing to partition timers to specific nodes in the ring.  Skyring exposes a simple HTTP API That allows to you create and cancel timers. Timer execution comes in to the form of an HTTP webhook ( more transports to come )

# Architechture Overview 

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
$ telnet localhost 42222
> ping
PONG
```

### Skyring CLI

If you intend to run skyring as is, it may be preferable to use the included binary over cloning the project.

```
npm install -g skyring

DEBUG=skyring:* skyring run -p 3000 -s localhost:3456 -s localhost:3455
```


### Clone Skyring

Alternatively to the CLI, you can clone and install the project manually

```bash
$ git clone https://github.com/esatterwhite/skyring.git
$ cd skyring
$ npm install
$ DEBUG=* node index.js
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


# Timer API

A request can be issued to any active node in the cluster. If that node is not responsible for the timer in question,
it will forward the request directly to the node that is keeping network latency to a minimum. This makes `Skyring` very
suitable for high performance, stateless, and distributed environments.
The minimum _recommended_ cluster size is 3 nodes, 2 of which being seed or bootstrapping nodes. A cluster of this size can average
between 2K - 5K requests per second.

## Create a timer

##### **POST `/timer`**

**Request**

```bash
curl -i -XPOST http://localhost:8080/timer -d '{
  "timout": 6000,
  "data" : "{\"foo\":\"bar\"}",
  "callback": {
    "transport": "http",
    "method": "post",
    "uri": "http://api.someservice.com/hook/timout"
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

```
HTTP/1.1 202 Accepted
Date: Fri, 23 Dec 2016 00:22:12 GMT
Connection: keep-alive
Content-Length: 0
```

# Crash Recovery

Each Skyring node uses an internal [levelup]() instance to record timers that it owns.
When a node starts, it will check the configured database for any existing timers, and will
immediately load them back into memory. By default, the [memdown]() backend is used, and wil not
persists between starts. To enable full persistence and recovery, you must configure skyring to use a 
persistent backend for `levelup`. [Leveldown]() is installed by default.


```js
skyring run --storage:backend=leveldown --storage:path='/var/data/skyring'
```
