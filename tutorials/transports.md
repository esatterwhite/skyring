The Transports systems is how skyring executes timeouts. When a timer lapses, a message is delivered to destination that you have defined. *How* that message is delivered is configurable. Out of the box, Skyring comes with an {@link module:skyring/lib/transports/http|HTTP} transport. Defining your own transport is pretty simple, and you can use any of the tools you are currently used to using.

#### STDOUT Transport

To illustrate the process, we're going to make a simple transport handler to write the data to `stdout`. Basically, speaking a transport is just a node.js module that exports a `class`.
The class must, at the very least, have an `exec` function.

```
'use strict'

const os = require('os')

module.exports = class Stdout {

  constructor(opts) {
    // do set up
  }

  exec (method, url, payload, id, storage) {
    // deliver the message
    process.stdout.write(payload);
    process.stdout(os.EOL);

    // clear the timer
    storage.uccessid);
  }

  get [Symbol.toStringTag]() {
    return 'SkyringSTDOutTransport'
  }
};
```

Pretty simple. We just write the data to the stdout out stream attached to the process, of course, be sure to remove the timer reference from the [skyring](https://github.com/esatterwhite/skyring) internal `storage`. To load your transport into a skyring server, you can pass an array of `transports` when instantiating as server instance. The array can contain references to the transport itself, or as string that can be passed to [require](https://nodejs.org/api/globals.html#globals_require)

```
'use strict'

const Skyring = require('skyring')
const Stdout = require('./transports/stdout')
const server = new Skyring({
  transports: [Stdout]
, seeds: ['localhost:3455']
})

server.listen(3000)
```

Done. Just be sure that **every** skyring node in the cluster has all of the same transports loaded so they have the capability to execute all of the timers. Other than that, we can start using our new transport by referencing it by name in the `transport` field of the request to create a new timer.

```bash
curl -XPOST http://localhost:3000/timer -H 'Content-Type: application/json' -d '{
  "timeout":3000
, "data":"hello world!"
, "callback": {
    "transport": "stdout"
  , "method":"unused"
  , "uri": "unused"
  }
}'
```

It is pretty simple and straight forward to build your own transport layer for [Skyring](https://github.com/esatterwhite/skyring). It can be a simple function, or for more complex use cases, you can build out entire npm packages using whatever tools you want. This makes the `transport` system in skyring very flexible, powerful, and easy to use.
