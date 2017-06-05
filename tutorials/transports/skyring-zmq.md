An Officially support ZMQ transport allowing for transports over `PUSH` or `PUB`
socket types

## Installation

```bash
$ npm install @skyring/zmq-transport --save
```

## Usage

Skyring accepts an array property `transports`. Each entry can be a string or a named function.
If given a string, skyring will pass it to `require` which must resolve to a named function. Use
the `method` option of the `timer` definition to specify the socket type on the connection.

*NOTE* That connections are long lived and once a type of socket has been created for a given host, it is not possible ( or recommeded ) to change them. I.E., attempting to transition from `PUSH` to `PUB`

```
const Skyring = require('skyring')
const server = new Skyring({
  transports: ['@skyring/zmq-transport']
, seeds: ['localhost:3455']
})

server
  .load()
  .listen(3000)
```

### Example PUSH handler

```
'use strict'

let count = 0
const port = process.env.PORT || 5555
const zmq = require('zmq')
const socket = zmq.socket('pull')

socket.on('message', (evt, payload) => {
    console.log(payload.toString('utf8'))
})

socket.connect(`tcp://0.0.0.0:${port}`)

process.once('SIGINT', onSignal)
process.once('SIGTERM', onSignal)

function onSignal() {
  socket.disconnect()
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

```bash
>>> 1 hello world !
```


### Example PUB handler

```javascript
'use strict'

let count = 0
const port = process.env.PORT || 5555
const zmq = require('zmq')
const socket = zmq.socket('sub')

socket.on('message', (evt, payload) => {
    console.log(payload.toString('utf8'))
})

socket.subscribe('timeout')
socket.connect(`tcp://0.0.0.0:${port}`)

process.once('SIGINT', onSignal)
process.once('SIGTERM', onSignal)

function onSignal() {
  socket.disconnect()
  socket.close()
}
```

```bash
$ curl -XPOST http://localhost:3000/timer -H 'Content-Type: application/json' -d '{
  "timeout":3000
, "data":"hello world!"
, "callback": {
    "transport": "zmq"
  , "method":"pub"
  , "uri": "tcp://0.0.0.0:5555"
  }
}'
```

```bash
# start as many pub handlers as you want
>>> 1 hello world !
>>> 1 hello world !
>>> 1 hello world !
```
