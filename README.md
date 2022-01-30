![skyring](https://github.com/esatterwhite/skyring/raw/main/assets/skyring.png)

[![Travis branch](https://img.shields.io/travis/esatterwhite/skyring/main.svg?style=flat-square)](skyring)
[![npm](https://img.shields.io/npm/v/skyring.svg?style=flat-square)](https://www.npmjs.com/package/skyring)
[![npm](https://img.shields.io/npm/l/skyring.svg?style=flat-square)](https://github.com/esatterwhite/skyring)
[![David](https://img.shields.io/david/esatterwhite/skyring.svg?style=flat-square)](https://david-dm.org/esatterwhite/skyring)
[![Docker Repository on Quay](https://quay.io/repository/esatterwhite/skyring/status "Docker Repository on Quay")](https://quay.io/repository/esatterwhite/skyring)

* [Module Docs](https://esatterwhite.github.io/skyring/)
* [API Docs](https://esatterwhite.github.io/skyring/api)

# Skyring

A distributed reliable timer service providing `setTimeout` functionality in a distributed fashion.
`Skyring` servers are clustered into a *hashring* using consistent hashing to partition timers to specific nodes in the ring.  Skyring exposes a simple HTTP API that allows to you create and cancel timers. Timer execution comes in to the form of an HTTP webhook ( more transports to come )

* Pluggable transports (timer execution)
* Plugable Storage (crash recovery + balancing)
* Auto Rebalancing
* Crash Recovery

# Architecture Overview

<img src="https://raw.githubusercontent.com/esatterwhite/skyring/main/assets/skyring-arch.png" width="100%" max-width="800px">

## Examples
A request can be issued to any active node in the cluster. If that node is not responsible for the timer in question,
it will forward the request directly to the node that is keeping network latency to a minimum. This makes `Skyring` very
suitable for high performance, stateless, and distributed environments.
The minimum _recommended_ cluster size is 3 nodes, 2 of which being seed or bootstrapping nodes. A cluster of this size can average
between 2K - 5K requests per second.

### Create a timer

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

## Contributing

Skyring is a monorepo managed by pnpm. Clone the repo and bootstrap the project

```bash
$ git clone https://github.com/esatterwhite/skyring.git project-skyring
$ pnpm install -r
$ docker-compose -f compose/nats.yml up -d
$ pnpm test
```

## Packages

* [Skyring](./packages/skyring): Primary server
* [TCP Transport](./packages/tcp-transport): TCP Timer transport
* [ZeroMQ Transport](./packages/zmq-transport): ZMQ Timer transport
* [Ringpop](./packages/ringpop): Gossip Clustering
* [Scylladown](./packages/scylladown): Scyalldb backed timer Storage

## License

MIT Licensed, Copyright (c) 2020 Eric Satterwhite
