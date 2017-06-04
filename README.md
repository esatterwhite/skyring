# skyring-zmq-transport

A ZMQ based transport for Skyring using `PUSH` or `PUB` zmq socket types.
Specify the type of socket for the connection with the `method` field when
creating a timer

## Installation

```bash
$ npm install @skyring/zmq-transport --save
```

## Usage

Skyring accepts an array property `transports`. Each entry can be a string or a named function.
If given a string, skyring will pass it to `require` which must resolve to a named function

```js
const Skyring = require('skyring')
const server = new Skyring({
  transports: ['@skyring/zmq-transport']
, seeds: ['localhost:3455']
})

server
  .load()
  .listen(3000)
```


### Example Echo Server

```js
'use strict'

const zmq = require('zmq')

let count = 0
const port = process.env.PORT || 5555
const socket = zmq.socket('pull')
socket.connect(`tcp://0.0.0.0:${port}`)
socket.on('message', (evt, chunk) => {
  console.log(`${++count} ` + chunk)
})
process.once('SIGINT', onSignal)
process.once('SIGTERM', onSignal)
function onSignal() {
  socket.disconnect(`tcp://0.0.0.0:${port}`)
  socket.close()
}
```

```bash
$ curl -XPOST http://localhost:3000/timer -H 'Content-Type: application/json' -d '{
  "timeout":3000
, "data":"hello world!"
, "callback": {
    "transport": "zmq"
  , "method":"push"
  , "uri": "tcp://0.0.0.0:5555"
  }
}'
```

```
>>> 1 hello world !
```
