# skyring-tcp-transport
A TCP based transport with connection pooling for Skyring.

## Installation

```bash
$ npm install @skyring/tcp-transport --save
```

## Usage

Skyring accepts an array property `transports`. Each entry can be a string or a named function.
If given a string, skyring will pass it to `require` which must resolve to a named function

```js
const Skyring = require('skyring')
const server = new Skyring({
  transports: ['@skyring/tcp-transport']
, seeds: ['localhost:3455']
})

server
  .load()
  .listen(3000)
```


### Example Echo Server

```js
// tcp echo server
'use strict'

let count = 0
const port = process.env.PORT || 5555
const net = require('net')
const server = net.createServer((socket) => {
  socket.on('data', (chunk) => {
    console.log(`${++count} ` + chunk)
  })
})

process.once('SIGINT', onSignal)
process.once('SIGTERM', onSignal)
server.listen(port, (err) => {
  if (err) {
    console.log(err)
    process.exitCode = 1
  }
  console.log('server listening')
})
function onSignal() {
  server.close()
}
```

```bash
$ curl -XPOST http://localhost:3000/timer -H 'Content-Type: application/json' -d '{
  "timeout":3000
, "data":"hello world!"
, "callback": {
    "transport": "tcp"
  , "method":"unused"
  , "uri": "tcp://0.0.0.0:5555"
  }
}'
```

```
>>> 1 hello world !
```
